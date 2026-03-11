"""Upload router — POST /api/v1/analyze"""
import logging

from fastapi import APIRouter, Form, HTTPException, UploadFile, status
from pydantic import EmailStr

from app.config import get_settings
from app.models.schemas import AnalyzeResponse
from app.services.ai_service import generate_summary
from app.services.email_service import send_email
from app.services.parser import parse_file
from app.utils.validators import validate_file

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Analysis"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Upload a sales dataset and receive an AI-generated executive summary via email",
    responses={
        200: {"description": "Summary generated and email sent successfully"},
        413: {"description": "File too large"},
        415: {"description": "Unsupported file type"},
        422: {"description": "Unprocessable file content"},
        500: {"description": "AI or email service error"},
    },
)
async def analyze_file(
    file: UploadFile,
    recipient_email: EmailStr = Form(..., description="Email address to receive the summary"),
) -> AnalyzeResponse:
    """
    Upload a CSV or XLSX sales dataset.

    - Validates file type (.csv, .xlsx) and size (configurable, default 10 MB)
    - Parses data with pandas
    - Sends data context to Google Gemini for executive summary generation
    - Emails the summary to `recipient_email`
    - Returns the summary text in the response body
    """
    settings = get_settings()

    # --- 1. Validate file ---
    validate_file(file)

    file_bytes = await file.read()

    # Double-check size after read (catches streamed uploads without Content-Length)
    if len(file_bytes) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {settings.max_file_size_mb} MB.",
        )

    logger.info(
        "Processing file '%s' (%d bytes) for recipient '%s'",
        file.filename,
        len(file_bytes),
        recipient_email,
    )

    # --- 2. Parse ---
    data_context = parse_file(file_bytes, file.filename or "upload")

    # --- 3. Generate AI summary ---
    try:
        summary = await generate_summary(data_context)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    # --- 4. Send email ---
    try:
        await send_email(to_email=str(recipient_email), summary=summary)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return AnalyzeResponse(
        status="success",
        message=f"Executive summary generated and emailed to {recipient_email}.",
        summary=summary,
        recipient_email=str(recipient_email),
    )


@router.get("/health", summary="Health check", tags=["Health"])
async def health_check() -> dict:
    """Returns service health status."""
    return {"status": "ok", "service": "sales-insight-automator"}

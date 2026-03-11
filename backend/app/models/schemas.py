"""Pydantic schemas for request/response models."""
from pydantic import BaseModel, EmailStr


class AnalyzeResponse(BaseModel):
    status: str = "success"
    message: str
    summary: str
    recipient_email: str


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    detail: str | None = None

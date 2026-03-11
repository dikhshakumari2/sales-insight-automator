"""CSV/XLSX parsing service using pandas."""
import io
import logging
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def parse_file(file_bytes: bytes, filename: str) -> dict[str, Any]:
    """
    Parse a CSV or XLSX file and return a structured data context dict
    suitable for AI prompt construction.
    """
    suffix = Path(filename).suffix.lower()

    try:
        if suffix == ".csv":
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif suffix in {".xlsx", ".xls"}:
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file format.",
            )
    except Exception as exc:
        logger.exception("Failed to parse file '%s': %s", filename, exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse the uploaded file: {exc}",
        ) from exc

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file is empty.",
        )

    # --- Build structured context ---
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()

    context: dict[str, Any] = {
        "filename": filename,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "null_counts": df.isnull().sum().to_dict(),
        "sample_rows": df.head(5).to_dict(orient="records"),
        "tail_rows": df.tail(3).to_dict(orient="records"),
    }

    if numeric_cols:
        desc = df[numeric_cols].describe().round(2)
        context["numeric_summary"] = desc.to_dict()

        # Month-over-month or period trends if a date column exists
        date_cols = [
            c for c in df.columns if "date" in c.lower() or "month" in c.lower() or "year" in c.lower()
        ]
        context["date_columns"] = date_cols

        if date_cols:
            try:
                df[date_cols[0]] = pd.to_datetime(df[date_cols[0]], errors="coerce")
                df_sorted = df.sort_values(date_cols[0])
                context["date_range"] = {
                    "start": str(df_sorted[date_cols[0]].min()),
                    "end": str(df_sorted[date_cols[0]].max()),
                }
                # Attempt revenue/sales trend
                value_cols = [
                    c for c in numeric_cols
                    if any(k in c.lower() for k in ["revenue", "sales", "amount", "total", "profit"])
                ]
                if value_cols:
                    monthly = (
                        df.groupby(df[date_cols[0]].dt.to_period("M"))[value_cols[0]]
                        .sum()
                        .reset_index()
                    )
                    monthly.columns = ["period", value_cols[0]]
                    monthly["period"] = monthly["period"].astype(str)
                    context["period_trend"] = monthly.to_dict(orient="records")
            except Exception:
                logger.debug("Could not compute period trend.", exc_info=True)

    # Top categorical values
    for col in categorical_cols[:3]:
        context.setdefault("top_categories", {})[col] = (
            df[col].value_counts().head(10).to_dict()
        )

    return context

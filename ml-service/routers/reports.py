import csv
import io
import json
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models as db_models
from services.auth_service import get_current_user

logger = logging.getLogger("aaroh.reports")

router = APIRouter(tags=["reports"])

class ReportListItem(BaseModel):
    id: int
    name: str
    category: str
    date: str | None
    file_size_bytes: int | None
    format: str

class ReportsListResponse(BaseModel):
    items: list[ReportListItem]

def _iso(dt: datetime | None) -> str | None:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

def _build_report_payload(
    db: Session,
    user_id: int,
    days: int = 30,
) -> dict:
    """
    Build a deterministic report payload from stored detections (plus best-effort
    environmental snapshot derived from last detection rows).
    """
    since = datetime.now(timezone.utc) - timedelta(days=max(1, min(365, int(days))))
    detections = (
        db.query(db_models.Detection)
        .filter(db_models.Detection.user_id == user_id, db_models.Detection.timestamp >= since)
        .order_by(desc(db_models.Detection.timestamp))
        .all()
    )

    rows = []
    for d in detections:
        rows.append(
            {
                "detection_id": int(d.id),
                "timestamp": _iso(d.timestamp),
                "pest_name": d.pest_name,
                "severity": d.severity,
                "confidence": float(d.confidence) if d.confidence is not None else None,
                "risk_index": float(d.risk_index) if d.risk_index is not None else None,
                "risk_level": d.risk_level,
                "temperature": float(d.temperature) if d.temperature is not None else None,
                "humidity": float(d.humidity) if d.humidity is not None else None,
                "soil_moisture": float(d.soil_moisture) if d.soil_moisture is not None else None,
                "light_intensity": float(d.light_intensity) if d.light_intensity is not None else None,
                "conditions": d.conditions,
                "status": getattr(d, "status", None),
            }
        )

    # Aggregate metrics for insights section
    total_scans = len(rows)
    treated = sum(1 for r in rows if (r.get("status") or "").lower() == "treated")
    avg_risk = None
    risk_vals = [r["risk_index"] for r in rows if isinstance(r.get("risk_index"), (int, float))]
    if risk_vals:
        avg_risk = sum(risk_vals) / float(len(risk_vals))

    high_risk = sum(1 for r in rows if (r.get("risk_index") or 0) >= 75)

    return {
        "generated_at": _iso(datetime.now(timezone.utc)),
        "range": {"days": int(days)},
        "metrics": {
            "total_scans": total_scans,
            "treated_scans": treated,
            "high_risk_scans": high_risk,
            "avg_risk_index": round(avg_risk, 2) if avg_risk is not None else None,
        },
        "rows": rows,
    }

@router.get("/reports", response_model=ReportsListResponse)
def list_reports(
    days: int = Query(30, ge=1, le=365),
    refresh: bool = Query(False, description="If true, generate a fresh report snapshot"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Returns report metadata (and creates a fresh report on-demand if requested).
    """
    try:
        if refresh:
            payload = _build_report_payload(db, user_id=current_user.id, days=days)
            # Best-effort: attach advisory + preventive measures from the latest detection.
            # These fields are optional and will be omitted if unavailable.
            try:
                latest = (
                    db.query(db_models.Detection)
                    .filter(db_models.Detection.user_id == current_user.id)
                    .order_by(desc(db_models.Detection.timestamp))
                    .first()
                )
                if latest:
                    # We don't currently persist full ai_advisory JSON in DB. If you add it later,
                    payload["ai_advisory"] = getattr(latest, "ai_advisory", None)
                    payload["preventive_measures"] = getattr(latest, "preventive_measures", None)
            except Exception:
                pass
            name = f"Pest & Farm Analytics ({days}d)"
            category = "Analytics"
            r = db_models.Report(
                user_id=current_user.id,
                name=name,
                category=category,
                format="csv",
                meta={"days": int(days)},
                payload=payload,
            )
            db.add(r)
            db.commit()
            db.refresh(r)

            from utils.logger import log_activity
            log_activity(db, current_user.id, "REPORT_GENERATED", target=name, details=f"Generated {days}d {category} report", level="INFO", commit=True)

        reports = (
            db.query(db_models.Report)
            .filter(db_models.Report.user_id == current_user.id)
            .order_by(desc(db_models.Report.created_at))
            .limit(50)
            .all()
        )

        items = [
            ReportListItem(
                id=int(r.id),
                name=r.name,
                category=r.category,
                date=r.created_at.date().isoformat() if r.created_at else None,
                file_size_bytes=int(r.file_size_bytes) if r.file_size_bytes is not None else None,
                format=r.format,
            )
            for r in reports
        ]
        return ReportsListResponse(items=items)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to list/generate reports for user_id=%s", getattr(current_user, "id", None))
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to load reports", "code": "REPORTS_LOAD_FAILED"},
        ) from exc

def _csv_stream(payload: dict) -> io.BytesIO:
    buf = io.StringIO()
    rows = payload.get("rows", []) if isinstance(payload, dict) else []
    fieldnames = [
        "detection_id",
        "timestamp",
        "pest_name",
        "severity",
        "confidence",
        "risk_index",
        "risk_level",
        "temperature",
        "humidity",
        "soil_moisture",
        "light_intensity",
        "conditions",
        "status",
    ]
    w = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    w.writeheader()
    for r in rows:
        if isinstance(r, dict):
            w.writerow(r)
    out = io.BytesIO(buf.getvalue().encode("utf-8"))
    out.seek(0)
    return out

def _confidence_label(conf: float | None) -> str:
    if conf is None:
        return "Unknown"
    # conf is stored as 0..1 in DB
    if conf >= 0.8:
        return "High"
    if conf >= 0.6:
        return "Medium"
    return "Low"

def _uploads_dir() -> str:
    # app.py defines uploads as ml-service/uploads
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ml-service/
    return os.path.join(base, "uploads")

def _try_local_image_path(image_url: str | None) -> str | None:
    if not image_url:
        return None
    # Expected: "/uploads/<file>"
    name = image_url.split("/uploads/")[-1] if "/uploads/" in image_url else None
    if not name:
        return None
    p = os.path.join(_uploads_dir(), name)
    return p if os.path.exists(p) else None

def _build_pdf(report: db_models.Report, user: db_models.User, detection: db_models.Detection | None) -> io.BytesIO:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
            Image as RLImage,
            HRFlowable,
            KeepTogether,
        )
        from reportlab.lib.units import inch
    except Exception as exc:
        logger.warning("reportlab unavailable; PDF export disabled: %s", exc)
        raise HTTPException(
            status_code=501,
            detail={"message": "PDF export is not enabled on this server", "code": "PDF_NOT_AVAILABLE"},
        ) from exc

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
        title=report.name or "AAROH Crop Health Report",
        author="AAROH AI System",
    )

    styles = getSampleStyleSheet()
    title = ParagraphStyle("title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=18, spaceAfter=10)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, spaceBefore=10, spaceAfter=6)
    body = ParagraphStyle("body", parent=styles["BodyText"], fontSize=10, leading=13)
    small = ParagraphStyle("small", parent=styles["BodyText"], fontSize=9, textColor=colors.grey)

    farm = user.farms[0] if getattr(user, "farms", None) else None
    farmer_name = getattr(user, "name", None) or "—"
    farm_location = getattr(farm, "farm_location", None) or "—"
    now = datetime.now(timezone.utc)

    elements: list = []

    elements.append(Paragraph("AAROH Crop Health Report", title))
    elements.append(Paragraph(f"<b>Farmer:</b> {farmer_name}", body))
    elements.append(Paragraph(f"<b>Farm Location:</b> {farm_location}", body))
    elements.append(Paragraph(f"<b>Date &amp; Time:</b> {now.isoformat()}", body))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB")))
    elements.append(Spacer(1, 12))

    # Image section
    elements.append(Paragraph("Crop Image", h2))
    local_img = _try_local_image_path(getattr(detection, "image_url", None) if detection else None)
    if local_img:
        try:
            img = RLImage(local_img)
            img.drawHeight = 2.2 * inch
            img.drawWidth = 3.6 * inch
            elements.append(img)
            elements.append(Spacer(1, 8))
        except Exception:
            elements.append(Paragraph("Image could not be rendered.", small))
    else:
        elements.append(Paragraph("No image available for this report.", small))
    elements.append(Spacer(1, 8))

    # Detection details
    elements.append(Paragraph("Detection Details", h2))
    if detection:
        conf = float(detection.confidence) if detection.confidence is not None else None
        conf_label = _confidence_label(conf)
        data = [
            ["Pest Name", detection.pest_name],
            ["Confidence", f"{round(conf * 100, 1)}% ({conf_label})" if conf is not None else "—"],
            ["Severity Level", detection.severity],
            ["Risk Level", detection.risk_level],
        ]
    else:
        data = [["Pest Name", "—"], ["Confidence", "—"], ["Severity Level", "—"], ["Risk Level", "—"]]

    t = Table(data, colWidths=[140, 340])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(t)

    # Environmental data
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Environmental Data", h2))
    if detection:
        env = [
            ["Temperature", f"{detection.temperature} °C" if detection.temperature is not None else "—"],
            ["Humidity", f"{detection.humidity} %" if detection.humidity is not None else "—"],
            ["Soil Moisture", f"{detection.soil_moisture} %" if detection.soil_moisture is not None else "—"],
        ]
    else:
        env = [["Temperature", "—"], ["Humidity", "—"], ["Soil Moisture", "—"]]
    env_t = Table(env, colWidths=[140, 340])
    env_t.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(env_t)

    # AI advisory (best-effort from stored payload)
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("AI Advisory", h2))
    payload = report.payload or {}
    advisory = None
    # Prefer persisted detection advisory (authoritative), fallback to report payload.
    if detection is not None and isinstance(getattr(detection, "ai_advisory", None), dict):
        advisory = detection.ai_advisory
    elif isinstance(payload, dict):
        advisory = payload.get("ai_advisory")
    if isinstance(advisory, dict):
        explanation = advisory.get("explanation") or "—"
        elements.append(Paragraph(f"<b>Explanation:</b> {explanation}", body))
        chem = (advisory.get("chemical_treatment") or {}).get("name") if isinstance(advisory.get("chemical_treatment"), dict) else None
        org = (advisory.get("organic_treatment") or {}).get("name") if isinstance(advisory.get("organic_treatment"), dict) else None
        fert = (advisory.get("preventive_treatment") or {}).get("name") if isinstance(advisory.get("preventive_treatment"), dict) else None
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(f"<b>Chemical:</b> {chem or '—'}", body))
        elements.append(Paragraph(f"<b>Organic:</b> {org or '—'}", body))
        elements.append(Paragraph(f"<b>Fertilizer Support:</b> {fert or '—'}", body))
    else:
        elements.append(Paragraph("AI advisory is not available for this report.", body))

    # Preventive measures
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Preventive Measures", h2))
    measures = None
    if detection is not None and isinstance(getattr(detection, "preventive_measures", None), list):
        measures = detection.preventive_measures
    elif isinstance(payload, dict):
        measures = payload.get("preventive_measures")
    if isinstance(measures, list) and measures:
        bullets = "<br/>".join([f"• {str(m)}" for m in measures])
        elements.append(Paragraph(bullets, body))
    else:
        elements.append(Paragraph("—", body))

    # Footer
    elements.append(Spacer(1, 14))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB")))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("Generated by AAROH AI System", small))
    elements.append(Paragraph(f"Timestamp: {now.isoformat()}", small))

    try:
        doc.build(elements)
    except Exception as exc:
        logger.exception("PDF generation failed report_id=%s user_id=%s", report.id, user.id)
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to generate PDF", "code": "PDF_GENERATION_FAILED"},
        ) from exc

    buf.seek(0)
    return buf

@router.get("/reports/export")
def export_report(
    report_id: int = Query(..., ge=1),
    format: str = Query("csv", pattern="^(csv|pdf)$"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Export a report file for download.
    - csv: always available
    - pdf: optional (requires reportlab); otherwise returns 501
    """
    r = (
        db.query(db_models.Report)
        .filter(db_models.Report.id == report_id, db_models.Report.user_id == current_user.id)
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail={"message": "Report not found", "code": "REPORT_NOT_FOUND"})

    payload = r.payload or {}
    base_name = (r.name or "aaroh-report").strip().replace(" ", "_")
    safe_name = "".join(ch for ch in base_name if ch.isalnum() or ch in ("_", "-", ".")).strip("_") or "aaroh-report"

    if format == "csv":
        f = _csv_stream(payload)
        try:
            size = int(f.getbuffer().nbytes)
            if r.file_size_bytes != size:
                r.file_size_bytes = size
                db.commit()
        except Exception:
            # Non-fatal; export should still succeed.
            pass
        filename = f"{safe_name}.csv"
        headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

        from utils.logger import log_activity
        log_activity(db, current_user.id, "REPORT_EXPORTED", target=str(report_id), details=f"Exported report {report_id} as CSV", level="INFO", commit=True)

        return StreamingResponse(f, media_type="text/csv", headers=headers)

    # PDF generation (dynamic, DB-backed)
    detection = None
    try:
        rows = payload.get("rows", []) if isinstance(payload, dict) else []
        if isinstance(rows, list) and len(rows) > 0 and isinstance(rows[0], dict):
            det_id = rows[0].get("detection_id")
            if det_id:
                detection = (
                    db.query(db_models.Detection)
                    .filter(db_models.Detection.id == int(det_id), db_models.Detection.user_id == current_user.id)
                    .first()
                )
    except Exception:
        detection = None

    pdf_buf = _build_pdf(report=r, user=current_user, detection=detection)
    try:
        size = int(pdf_buf.getbuffer().nbytes)
        if r.file_size_bytes != size:
            r.file_size_bytes = size
            r.format = "pdf"
            db.commit()
    except Exception:
        pass
    filename = f"aaroh-report-{report_id}.pdf"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    from utils.logger import log_activity
    log_activity(db, current_user.id, "REPORT_EXPORTED", target=str(report_id), details=f"Exported report {report_id} as PDF", level="INFO", commit=True)

    return StreamingResponse(pdf_buf, media_type="application/pdf", headers=headers)


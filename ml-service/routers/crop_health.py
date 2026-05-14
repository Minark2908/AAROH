from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import random

from database import get_db
import models
import schemas
from services.auth_service import get_current_user
from sqlalchemy import func, desc, and_

router = APIRouter(
    prefix="/api/crop",
    tags=["Crop Health"],
    responses={404: {"description": "Not found"}},
)

def seed_mock_data(db: Session, user_id: int, force: bool = False):
    existing = db.query(models.Field).filter(models.Field.user_id == user_id).first()
    if existing and not force:
        return

    # Seed 3 Mock Fields in Maharashtra region
    base_lat = 18.5204
    base_lng = 73.8567

    mock_fields = [
        {
            "name": "Field A (North)",
            "crop_type": "Cotton",
            "coordinates": [
                [base_lat, base_lng],
                [base_lat + 0.005, base_lng],
                [base_lat + 0.005, base_lng + 0.005],
                [base_lat, base_lng + 0.005]
            ],
            "area_acres": 12.5,
            "growth_stage": "Flowering",
            "progress_percentage": 60,
        },
        {
            "name": "Field B (East)",
            "crop_type": "Wheat",
            "coordinates": [
                [base_lat + 0.006, base_lng + 0.006],
                [base_lat + 0.010, base_lng + 0.006],
                [base_lat + 0.010, base_lng + 0.012],
                [base_lat + 0.006, base_lng + 0.012]
            ],
            "area_acres": 8.0,
            "growth_stage": "Tillering",
            "progress_percentage": 35,
        },
        {
            "name": "Field C (South)",
            "crop_type": "Cotton",
            "coordinates": [
                [base_lat - 0.006, base_lng],
                [base_lat - 0.002, base_lng],
                [base_lat - 0.002, base_lng + 0.006],
                [base_lat - 0.006, base_lng + 0.006]
            ],
            "area_acres": 15.0,
            "growth_stage": "Vegetative",
            "progress_percentage": 20,
        }
    ]

    for f_data in mock_fields:
        new_field = models.Field(
            user_id=user_id,
            name=f_data["name"],
            crop_type=f_data["crop_type"],
            coordinates=f_data["coordinates"],
            area_acres=f_data["area_acres"],
            growth_stage=f_data["growth_stage"],
            progress_percentage=f_data["progress_percentage"]
        )
        db.add(new_field)
        db.commit()
        db.refresh(new_field)

        # Generate 30 days of history
        now = datetime.utcnow()
        base_ndvi = 0.5 + random.uniform(-0.1, 0.3)
        if f_data["name"] == "Field C (South)":
             base_ndvi = 0.3 # create a struggling field

        for i in range(30):
            day_ndvi = max(0.1, min(0.9, base_ndvi + (i * 0.01) + random.uniform(-0.05, 0.05)))
            day_soil_moisture = max(10, min(90, 40 + random.uniform(-20, 30)))
            day_humidity = max(30, min(95, 60 + random.uniform(-20, 20)))

            if day_ndvi < 0.4:
                day_soil_moisture = max(10, min(30, day_soil_moisture)) # correlate low NDVI with low moisture for some cases

            # Determine health status
            status = "Healthy"
            if day_ndvi < 0.4:
                status = "Critical"
            elif day_ndvi < 0.6:
                status = "Moderate"

            rec = None
            prob = None
            if status == "Critical":
                if day_soil_moisture < 30:
                    prob = "Severe Water Stress"
                    rec = "Critical: Immediate irrigation required. Field moisture levels below 30%."
                else:
                    prob = "Significant Nutrient Deficiency"
                    rec = "Action required: Apply Nitrogen-rich fertilizer (e.g., Urea) and monitor for 48 hours."
            elif status == "Moderate":
                if day_humidity > 80:
                    prob = "High Fungal Risk"
                    rec = "Note: High humidity detected (>80%). Inspect lower leaves for mildew or fungal spots."
                else:
                    prob = "Stunted Growth Stage"
                    rec = "Observation: Growth rate slightly below seasonal average. Monitor closely."
            
            hist = models.FieldHealthHistory(
                field_id=new_field.id,
                ndvi_value=round(day_ndvi, 2),
                health_status=status,
                recommendation=rec if i == 29 else None, # only latest has active rec
                problem=prob if i == 29 else None,
                soil_moisture=round(day_soil_moisture, 1),
                humidity=round(day_humidity, 1),
                confidence=round(random.uniform(0.7, 0.95), 2),
                recorded_at=now - timedelta(days=(29-i))
            )
            db.add(hist)
        
        db.commit()

@router.get("/fields", response_model=List[schemas.FieldResponse])
def get_fields(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    seed: bool = False
):
    """Get all fields for the current user, along with their latest health data.
    
    Args:
        seed: If True, generate sample mock fields (only if user has no fields yet)
    """
    # Only seed if explicitly requested
    if seed:
        seed_mock_data(db, current_user.id, force=False)
    
    # Optimized query: Get fields with their latest history in a single pass
    # Use a subquery to find the latest history record ID for each field
    latest_history_subquery = (
        db.query(
            models.FieldHealthHistory.field_id,
            func.max(models.FieldHealthHistory.id).label("max_id")
        )
        .group_by(models.FieldHealthHistory.field_id)
        .subquery()
    )
    
    # Query all fields for the user
    fields = db.query(models.Field).filter(models.Field.user_id == current_user.id).all()
    
    # For each field, attach the latest history record (already fetched in one query)
    if fields:
        field_ids = [f.id for f in fields]
        latest_histories = (
            db.query(models.FieldHealthHistory)
            .filter(
                and_(
                    models.FieldHealthHistory.field_id.in_(field_ids),
                    models.FieldHealthHistory.id.in_(
                        db.query(func.max(models.FieldHealthHistory.id))
                        .filter(models.FieldHealthHistory.field_id.in_(field_ids))
                        .group_by(models.FieldHealthHistory.field_id)
                    )
                )
            )
            .all()
        )
        
        history_map = {h.field_id: h for h in latest_histories}
        
        # Attach history to fields
        for field in fields:
            if field.id in history_map:
                field.history = [history_map[field.id]]
            else:
                field.history = []
    
    return fields

@router.get("/ndvi-history")
def get_ndvi_history(field_id: int, days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get historical NDVI trends for a specific field."""
    # Verify owner
    field = db.query(models.Field).filter(models.Field.id == field_id, models.Field.user_id == current_user.id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    cutoff_date = datetime.utcnow() - timedelta(days=days)
    history = db.query(models.FieldHealthHistory).filter(
        models.FieldHealthHistory.field_id == field_id,
        models.FieldHealthHistory.recorded_at >= cutoff_date
    ).order_by(models.FieldHealthHistory.recorded_at.asc()).all()

    return history

@router.get("/crop-health")
def get_crop_health_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get an aggregated summary of crop health for dashboard overviews."""
    seed_mock_data(db, current_user.id)
    fields = db.query(models.Field).filter(models.Field.user_id == current_user.id).all()

    total_area = sum([f.area_acres or 0 for f in fields])
    critical_fields = 0
    healthy_fields = 0
    avg_ndvi_sum = 0
    count = 0

    recommendations = []

    weighted_ndvi_sum = 0
    total_active_area = 0

    # Optimize: Get all latest histories in one query instead of looping
    if fields:
        field_ids = [f.id for f in fields]
        
        latest_histories = (
            db.query(models.FieldHealthHistory)
            .filter(
                and_(
                    models.FieldHealthHistory.field_id.in_(field_ids),
                    models.FieldHealthHistory.id.in_(
                        db.query(func.max(models.FieldHealthHistory.id))
                        .filter(models.FieldHealthHistory.field_id.in_(field_ids))
                        .group_by(models.FieldHealthHistory.field_id)
                    )
                )
            )
            .all()
        )
        
        history_map = {h.field_id: h for h in latest_histories}
        
        # Process fields with their history data
        for f in fields:
            latest_hist = history_map.get(f.id)
            if latest_hist:
                weighted_ndvi_sum += latest_hist.ndvi_value * (f.area_acres or 1)
                total_active_area += (f.area_acres or 1)
                count += 1
                if latest_hist.health_status == "Critical":
                    critical_fields += 1
                elif latest_hist.health_status == "Healthy":
                    healthy_fields += 1
                
                if latest_hist.recommendation:
                    recommendations.append({
                        "field_name": f.name,
                        "problem": latest_hist.problem,
                        "recommendation": latest_hist.recommendation,
                        "confidence": latest_hist.confidence or 0.85,
                        "soil_moisture": latest_hist.soil_moisture,
                        "humidity": latest_hist.humidity
                    })

    avg_ndvi = round(weighted_ndvi_sum / total_active_area, 2) if total_active_area > 0 else 0

    return {
        "total_fields": len(fields),
        "total_area_acres": total_area,
        "average_ndvi": avg_ndvi,
        "health_distribution": {
            "healthy": healthy_fields,
            "moderate": len(fields) - critical_fields - healthy_fields,
            "critical": critical_fields
        },
        "active_alerts": recommendations
    }

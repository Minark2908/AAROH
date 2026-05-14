from fastapi import APIRouter, Depends
import httpx
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from database import get_db
import models as db_models
from services.auth_service import get_current_user

router = APIRouter(tags=["farm"])

class FarmResponse(BaseModel):
    id: int
    location: str | None = None
    land_area: float | None = None
    crops: list[str] = []
    growth_stage: str | None = None
    irrigation_type: str | None = None
    lat: float | None = None
    lon: float | None = None

class UpdateFarmRequest(BaseModel):
    location: str | None = None
    land_area: float | None = None
    crops: list[str] | None = None
    growth_stage: str | None = None
    irrigation_type: str | None = None

    @field_validator("land_area")
    @classmethod
    def _land_area(cls, v: float | None):
        if v is None:
            return v
        if v < 0:
            raise ValueError("Land area must be positive.")
        return v

def _farm_to_response(farm: db_models.Farm | None) -> FarmResponse:
    if not farm:
        return FarmResponse(id=0, location=None, land_area=None, crops=[], growth_stage=None, irrigation_type=None)
    crops: list[str] = []
    if getattr(farm, "primary_crop", None):
        crops.append(str(farm.primary_crop))
    if getattr(farm, "secondary_crop", None):
        crops.append(str(farm.secondary_crop))
    return FarmResponse(
        id=int(farm.id),
        location=getattr(farm, "farm_location", None),
        land_area=float(farm.land_area) if farm.land_area is not None else None,
        crops=crops,
        growth_stage=getattr(farm, "crop_growth_stage", None),
        irrigation_type=getattr(farm, "irrigation_type", None),
        lat=getattr(farm, "latitude", None),
        lon=getattr(farm, "longitude", None),
    )

@router.get("/farm", response_model=FarmResponse)
def get_farm(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    farm = current_user.farms[0] if current_user.farms else None
    if not farm:
        return FarmResponse(id=0, location=None, land_area=None, crops=[], growth_stage=None, irrigation_type=None, lat=None, lon=None)
    return _farm_to_response(farm)

@router.put("/farm", response_model=FarmResponse)
def update_farm(
    req: UpdateFarmRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    farm = current_user.farms[0] if current_user.farms else None

    def geocode_location(loc: str) -> tuple[float | None, float | None]:
        q = (loc or "").strip()
        if not q:
            return (None, None)
        # Open-Meteo geocoding (no key) - best effort.
        try:
            with httpx.Client(timeout=8.0) as client:
                r = client.get("https://geocoding-api.open-meteo.com/v1/search", params={"name": q, "count": 1, "language": "en", "format": "json"})
                r.raise_for_status()
                data = r.json() or {}
                results = data.get("results") or []
                if results and isinstance(results, list):
                    first = results[0] or {}
                    return (first.get("latitude"), first.get("longitude"))
        except Exception:
            return (None, None)
        return (None, None)

    if not farm:
        crops = req.crops or []
        primary_crop = (crops[0] if len(crops) > 0 else "Unknown") or "Unknown"
        secondary_crop = (crops[1] if len(crops) > 1 else None) or None
        lat, lon = geocode_location(req.location or "")
        farm = db_models.Farm(
            user_id=current_user.id,
            land_area=float(req.land_area or 0.0),
            primary_crop=str(primary_crop),
            secondary_crop=str(secondary_crop) if secondary_crop else None,
            irrigation_type=req.irrigation_type,
            farm_location=req.location,
            crop_growth_stage=req.growth_stage,
            latitude=lat,
            longitude=lon,
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)
        return _farm_to_response(farm)

    if req.location is not None:
        loc = (req.location or "").strip() or None
        farm.farm_location = loc
        lat, lon = geocode_location(loc or "")
        if lat is not None and lon is not None:
            farm.latitude = float(lat)
            farm.longitude = float(lon)
    if req.land_area is not None:
        farm.land_area = float(req.land_area)
    if req.irrigation_type is not None:
        farm.irrigation_type = (req.irrigation_type or "").strip() or None
    if req.growth_stage is not None:
        farm.crop_growth_stage = (req.growth_stage or "").strip() or None

    if req.crops is not None:
        crops = [c.strip() for c in req.crops if isinstance(c, str) and c.strip()]
        farm.primary_crop = crops[0] if len(crops) >= 1 else (farm.primary_crop or "Unknown")
        farm.secondary_crop = crops[1] if len(crops) >= 2 else None

    db.commit()
    db.refresh(farm)
    return _farm_to_response(farm)


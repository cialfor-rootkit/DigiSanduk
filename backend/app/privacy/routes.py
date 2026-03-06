from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.privacy_setting import PrivacySetting
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/privacy", tags=["Privacy"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PrivacyPayload(BaseModel):
    allow_anonymous_sharing: bool
    consented: bool


@router.get("/me")
def get_privacy(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    settings = db.query(PrivacySetting).filter(PrivacySetting.user_id == int(user_id)).first()
    if not settings:
        return {"allow_anonymous_sharing": False, "consented": False}
    return {
        "allow_anonymous_sharing": settings.allow_anonymous_sharing,
        "consented": settings.consented
    }


@router.post("/me")
def update_privacy(
    payload: PrivacyPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    settings = db.query(PrivacySetting).filter(PrivacySetting.user_id == int(user_id)).first()
    if not settings:
        settings = PrivacySetting(user_id=int(user_id))
        db.add(settings)

    settings.allow_anonymous_sharing = payload.allow_anonymous_sharing
    settings.consented = payload.consented
    db.commit()
    return {"message": "Privacy settings updated"}

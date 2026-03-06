from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.notification import Notification
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/alerts")
def list_alerts(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(Notification).filter(Notification.user_id == int(user_id)).all()

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.security_data import SecurityData
from app.models.data_share import DataShare
from app.models.incident import Incident
from app.models.audit_log import AuditLog
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    org_id = user.organization_id if user else None

    total_data = db.query(SecurityData).filter(SecurityData.owner_org_id == org_id).count()
    total_shares = db.query(DataShare).count()
    total_incidents = db.query(Incident).filter(Incident.org_id == org_id).count()
    audit_events = db.query(AuditLog).count()

    return {
        "total_data": total_data,
        "total_shares": total_shares,
        "total_incidents": total_incidents,
        "audit_events": audit_events
    }

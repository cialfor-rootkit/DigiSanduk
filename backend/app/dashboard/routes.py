from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.data_share import DataShare
from app.models.data_request import DataRequest
from app.models.notification import Notification
from app.models.organization import Organization
from app.models.security_data import SecurityData
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_super_admin = user.email == "admin@digisanduk"
    org = db.query(Organization).filter(Organization.id == user.organization_id).first() if user.organization_id else None
    is_org_admin = org and org.admin_user_id == user.id

    if is_super_admin:
        active_shares = db.query(DataShare).count()
        data_received = db.query(DataShare).count()
        pending_approvals = db.query(DataRequest).filter(DataRequest.status == "pending").count()
        security_alerts = db.query(Notification).count()
    elif is_org_admin and org:
        active_shares = db.query(DataShare).join(
            SecurityData, DataShare.data_id == SecurityData.id
        ).filter(SecurityData.owner_org_id == org.id).count()
        data_received = db.query(DataShare).filter(DataShare.shared_with_org_id == org.id).count()
        pending_approvals = db.query(DataRequest).filter(
            DataRequest.target_org_id == org.id,
            DataRequest.status == "pending"
        ).count()
        security_alerts = db.query(Notification).join(
            User, Notification.user_id == User.id
        ).filter(User.organization_id == org.id).count()
    else:
        active_shares = 0
        data_received = 0
        pending_approvals = 0
        security_alerts = 0

    return {
        "active_shares": active_shares,
        "data_received": data_received,
        "pending_approvals": pending_approvals,
        "security_alerts": security_alerts,
        "visibility": "all" if is_super_admin else ("org" if is_org_admin else "none")
    }

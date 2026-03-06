from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.organization import Organization
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/logs")
def list_audit_logs(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.email != "admin@digisanduk":
        raise HTTPException(status_code=403, detail="Super admin required")

    org_map = {o.id: o.name for o in db.query(Organization).all()}
    user_map = {u.id: u.email for u in db.query(User).all()}

    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "performed_by": user_map.get(log.actor_user_id),
            "actor_user_id": log.actor_user_id,
            "actor_org_id": log.actor_org_id,
            "actor_org_name": org_map.get(log.actor_org_id),
            "resource": log.target_resource,
            "timestamp": log.timestamp
        }
        for log in logs
    ]

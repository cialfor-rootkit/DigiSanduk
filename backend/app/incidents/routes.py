from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.incident import Incident
from app.models.incident_comment import IncidentComment
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class IncidentPayload(BaseModel):
    title: str
    description: str
    severity: str | None = "medium"


class CommentPayload(BaseModel):
    comment: str


@router.post("")
def create_incident(
    payload: IncidentPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.organization_id:
        raise HTTPException(status_code=400, detail="User not assigned to organization")

    incident = Incident(
        title=payload.title,
        description=payload.description,
        severity=payload.severity or "medium",
        reporter_user_id=user.id,
        org_id=user.organization_id
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    return {
        "message": "Incident reported",
        "incident_id": incident.id
    }


@router.get("")
def list_incidents(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.organization_id:
        raise HTTPException(status_code=400, detail="User not assigned to organization")

    incidents = db.query(Incident).filter(Incident.org_id == user.organization_id).all()
    return incidents


@router.put("/{incident_id}/status")
def update_incident_status(
    incident_id: int,
    status: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident or incident.org_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = status
    db.commit()
    return {"message": "Status updated"}


@router.post("/{incident_id}/comments")
def add_comment(
    incident_id: int,
    payload: CommentPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident or incident.org_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Incident not found")

    comment = IncidentComment(
        incident_id=incident.id,
        author_user_id=user.id,
        comment=payload.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {"message": "Comment added", "comment_id": comment.id}


@router.get("/{incident_id}/comments")
def list_comments(
    incident_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident or incident.org_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Incident not found")

    comments = db.query(IncidentComment).filter(IncidentComment.incident_id == incident.id).all()
    return comments

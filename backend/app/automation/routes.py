from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.playbook import Playbook
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/automation", tags=["Automation"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PlaybookPayload(BaseModel):
    name: str
    description: str | None = None


@router.get("/playbooks")
def list_playbooks(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(Playbook).all()


@router.post("/playbooks")
def create_playbook(
    payload: PlaybookPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    playbook = Playbook(name=payload.name, description=payload.description, status="active")
    db.add(playbook)
    db.commit()
    db.refresh(playbook)
    return {"message": "Playbook created", "playbook_id": playbook.id}


@router.post("/playbooks/{playbook_id}/run")
def run_playbook(
    playbook_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    playbook = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    return {"message": "Playbook run queued", "playbook_id": playbook_id}

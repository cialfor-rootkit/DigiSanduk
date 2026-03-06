from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.training_resource import TrainingResource
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/training", tags=["Training"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TrainingPayload(BaseModel):
    title: str
    type: str
    content: str | None = None


@router.get("/resources")
def list_resources(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(TrainingResource).all()


@router.post("/resources")
def create_resource(
    payload: TrainingPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    resource = TrainingResource(
        title=payload.title,
        type=payload.type,
        content=payload.content
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return {"message": "Resource added", "resource_id": resource.id}

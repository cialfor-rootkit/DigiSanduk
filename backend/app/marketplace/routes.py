from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.marketplace_item import MarketplaceItem
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MarketplacePayload(BaseModel):
    name: str
    provider: str
    description: str | None = None
    category: str | None = None


@router.get("/items")
def list_items(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(MarketplaceItem).all()


@router.post("/items")
def create_item(
    payload: MarketplacePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    item = MarketplaceItem(
        name=payload.name,
        provider=payload.provider,
        description=payload.description,
        category=payload.category
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Marketplace item added", "item_id": item.id}

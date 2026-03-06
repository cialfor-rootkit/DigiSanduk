from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.threat_feed import ThreatFeed
from app.models.threat_intel_item import ThreatIntelItem
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/threat", tags=["Threat Intelligence"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class FeedPayload(BaseModel):
    name: str
    source_url: str | None = None
    description: str | None = None


class IntelPayload(BaseModel):
    feed_id: int
    title: str
    description: str | None = None
    severity: str | None = None
    indicator: str | None = None


@router.get("/feeds")
def list_feeds(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(ThreatFeed).all()


@router.post("/feeds")
def add_feed(
    payload: FeedPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    existing = db.query(ThreatFeed).filter(ThreatFeed.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feed already exists")

    feed = ThreatFeed(
        name=payload.name,
        source_url=payload.source_url,
        description=payload.description
    )
    db.add(feed)
    db.commit()
    db.refresh(feed)
    return {"message": "Feed added", "feed_id": feed.id}


@router.get("/intel")
def list_intel(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(ThreatIntelItem).all()


@router.post("/intel")
def add_intel(
    payload: IntelPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    feed = db.query(ThreatFeed).filter(ThreatFeed.id == payload.feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")

    intel = ThreatIntelItem(
        feed_id=payload.feed_id,
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        indicator=payload.indicator
    )
    db.add(intel)
    db.commit()
    db.refresh(intel)
    return {"message": "Threat intel added", "intel_id": intel.id}

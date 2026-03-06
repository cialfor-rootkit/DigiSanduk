from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class ThreatIntelItem(Base):
    __tablename__ = "threat_intel_items"

    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, ForeignKey("threat_feeds.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), nullable=True)
    indicator = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

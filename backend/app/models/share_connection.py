from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class ShareConnection(Base):
    __tablename__ = "share_connections"

    id = Column(Integer, primary_key=True, index=True)
    org_a_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    org_b_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

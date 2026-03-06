from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class DataRequest(Base):
    __tablename__ = "data_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    target_org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_type = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

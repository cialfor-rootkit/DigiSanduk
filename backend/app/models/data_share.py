from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime
from datetime import datetime
from app.database import Base

class DataShare(Base):
    __tablename__ = "data_shares"

    id = Column(Integer, primary_key=True)
    data_id = Column(Integer, ForeignKey("security_data.id"), nullable=False)
    shared_with_org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    anonymized = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255), nullable=False)
    actor_user_id = Column(Integer, nullable=False)
    actor_org_id = Column(Integer, nullable=False)
    target_resource = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    trust_level = Column(String(50), default="low")
    admin_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_user = relationship("User", foreign_keys=[admin_user_id])

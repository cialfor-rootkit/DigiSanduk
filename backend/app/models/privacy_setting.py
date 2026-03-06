from sqlalchemy import Column, Integer, Boolean, ForeignKey
from app.database import Base


class PrivacySetting(Base):
    __tablename__ = "privacy_settings"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    allow_anonymous_sharing = Column(Boolean, default=False)
    consented = Column(Boolean, default=False)

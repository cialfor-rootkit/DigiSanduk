from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class SecurityData(Base):
    __tablename__ = "security_data"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    threat_type = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    sector = Column(String(100), nullable=True)

    owner_org_id = Column(Integer, ForeignKey("organizations.id"))
    owner_org = relationship("Organization")

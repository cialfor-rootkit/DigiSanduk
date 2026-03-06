from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base


class DataTag(Base):
    __tablename__ = "data_tags"

    data_id = Column(Integer, ForeignKey("security_data.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)

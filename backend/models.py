from sqlalchemy import Column, Integer, String, Date, ARRAY
from database import Base

class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    amount = Column(String, nullable=True)
    deadline = Column(Date, nullable=False)
    education_level = Column(String, nullable=False)
    institution_type = Column(String, nullable=True)
    url = Column(String, nullable=True)
    tags = Column(ARRAY(String), nullable=True)

from pydantic import BaseModel
from datetime import date
from typing import Optional, List

class ScholarshipCreate(BaseModel):
    title: str
    provider: str
    amount: str
    deadline: date
    education_level: str
    url: Optional[str] = None
    tags: Optional[List[str]] = None

class ScholarshipResponse(BaseModel):
    id: int
    title: str
    provider: str
    amount: str
    deadline: date
    education_level: str
    url: Optional[str] = None
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True

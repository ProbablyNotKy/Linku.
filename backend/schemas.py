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

class ScholarshipMatchResponse(BaseModel):
    id: int
    title: str
    provider: str
    amount: str
    deadline: date
    education_level: str
    url: Optional[str] = None
    tags: Optional[List[str]] = None
    similarity_score: float

class ProfileSyncRequest(BaseModel):
    bio: str
    education_level: Optional[str] = None
    field_of_study: Optional[str] = None

class ProfileSyncResponse(BaseModel):
    embedding: List[float]
    message: str

class MatchRequest(BaseModel):
    embedding: List[float]
    limit: int = 5

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    response: str
    conversation_history: List[dict]

class VectorizeResponse(BaseModel):
    processed: int
    message: str

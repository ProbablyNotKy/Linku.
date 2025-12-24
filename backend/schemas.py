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


class ScholarshipExtraction(BaseModel):
    title: Optional[str] = None
    provider: Optional[str] = None
    amount: Optional[str] = None
    deadline: Optional[str] = None
    education_level: Optional[str] = None
    description: Optional[str] = None
    source_quote: Optional[str] = None


class ScholarshipList(BaseModel):
    scholarships: List[ScholarshipExtraction]


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResponse(BaseModel):
    drafts_created: int
    message: str


class DraftResponse(BaseModel):
    id: int
    title: Optional[str] = None
    provider: Optional[str] = None
    amount: Optional[str] = None
    deadline: Optional[str] = None
    education_level: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    source_quote: Optional[str] = None
    status: str


class PublishResponse(BaseModel):
    scholarship_id: int
    message: str

from pydantic import BaseModel
from datetime import date
from typing import Optional, List

# Malaysian states for validation
MALAYSIAN_STATES = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
    "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah",
    "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur",
    "Labuan", "Putrajaya"
]

# Standard Malaysian study areas
STUDY_AREAS = [
    "STEM", "Engineering", "Medicine", "Health Sciences", "Business",
    "Accounting", "Law", "Education", "Arts & Humanities", "Social Sciences",
    "Agriculture", "Architecture", "IT & Computer Science", "Aviation",
    "Islamic Studies", "General"
]


class ScholarshipCreate(BaseModel):
    title: str
    provider: str
    amount: str
    deadline: date
    education_level: str
    url: Optional[str] = None
    tags: Optional[List[str]] = None
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = False
    ai_matching_context: Optional[str] = None
    # English proficiency requirements
    min_muet: Optional[float] = None  # MUET Band (1-5)
    min_ielts: Optional[float] = None  # IELTS score (0-9)
    min_spm_english: Optional[str] = None  # SPM English grade (A+, A, A-, B+, B, C, etc.)


class ScholarshipResponse(BaseModel):
    id: int
    title: str
    provider: str
    amount: str
    deadline: date
    education_level: str
    url: Optional[str] = None
    tags: Optional[List[str]] = None
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = False
    ai_matching_context: Optional[str] = None
    # English proficiency requirements
    min_muet: Optional[float] = None
    min_ielts: Optional[float] = None
    min_spm_english: Optional[str] = None

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
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = False
    # English proficiency requirements
    min_muet: Optional[float] = None
    min_ielts: Optional[float] = None
    min_spm_english: Optional[str] = None
    # Match scoring
    similarity_score: float
    match_score: Optional[float] = None  # Hybrid score (0-100%)
    is_eligible: bool = True
    ineligibility_reasons: Optional[List[str]] = None
    # Match breakdown for UI
    match_reasons: Optional[List[str]] = None  # Human-readable match reasons
    score_breakdown: Optional[dict] = None  # Detailed score components
    # Eligibility badges
    eligibility_badges: Optional[dict] = None  # e.g., {"education": "Match", "state": "Match"}


class ProfileSyncRequest(BaseModel):
    bio: str
    education_level: Optional[str] = None
    field_of_study: Optional[str] = None
    cgpa: Optional[float] = None
    spm_as: Optional[int] = None
    household_income: Optional[float] = None
    state: Optional[str] = None
    intended_study_areas: Optional[List[str]] = None
    is_bumiputera: Optional[bool] = None


class ProfileSyncResponse(BaseModel):
    embedding: List[float]
    message: str


class MatchRequest(BaseModel):
    embedding: List[float]
    limit: int = 5
    cgpa: Optional[float] = None
    spm_as: Optional[int] = None
    household_income: Optional[float] = None
    state: Optional[str] = None
    intended_study_areas: Optional[List[str]] = None
    is_bumiputera: Optional[bool] = None


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
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = None
    ai_matching_context: Optional[str] = None
    # English proficiency requirements
    min_muet: Optional[float] = None
    min_ielts: Optional[float] = None
    min_spm_english: Optional[str] = None


class ScholarshipList(BaseModel):
    scholarships: List[ScholarshipExtraction]


class ScrapeRequest(BaseModel):
    urls: List[str]


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
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = None
    ai_matching_context: Optional[str] = None
    # English proficiency requirements
    min_muet: Optional[float] = None
    min_ielts: Optional[float] = None
    min_spm_english: Optional[str] = None


class DraftUpdateRequest(BaseModel):
    title: Optional[str] = None
    provider: Optional[str] = None
    amount: Optional[str] = None
    deadline: Optional[str] = None
    education_level: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = None
    ai_matching_context: Optional[str] = None
    # English proficiency requirements
    min_muet: Optional[float] = None
    min_ielts: Optional[float] = None
    min_spm_english: Optional[str] = None


class PublishResponse(BaseModel):
    scholarship_id: int
    message: str


# User Profile schemas
class UserProfileCreate(BaseModel):
    education_level: str
    cgpa: Optional[float] = None
    spm_as: Optional[int] = None
    household_income: str  # B40, M40, T20
    state: str
    is_bumiputera: bool = False
    study_areas: List[str] = []
    bio_achievements: str
    # English proficiency scores
    muet_band: Optional[float] = None  # MUET Band (1-5)
    ielts_score: Optional[float] = None  # IELTS score (0-9)
    spm_english_grade: Optional[str] = None  # SPM English grade (A+, A, A-, B+, etc.)


class UserProfileResponse(BaseModel):
    id: str
    education_level: Optional[str] = None
    cgpa: Optional[float] = None
    spm_as: Optional[int] = None
    household_income: Optional[str] = None
    state: Optional[str] = None
    is_bumiputera: bool = False
    study_areas: Optional[List[str]] = None
    bio_achievements: Optional[str] = None
    has_embedding: bool = False
    # English proficiency scores
    muet_band: Optional[float] = None
    ielts_score: Optional[float] = None
    spm_english_grade: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfileMatchRequest(BaseModel):
    profile_id: str
    limit: int = 10

from pydantic import BaseModel
from datetime import date
from typing import Optional, List

# Import shared constants from constants.py
from constants import MALAYSIAN_STATES, STUDY_AREAS, SPM_ENGLISH_GRADES


class ScholarshipCreate(BaseModel):
    title: str
    provider: str
    amount: str
    deadline: Optional[date] = None  # Made optional for Rolling/TBA scholarships
    education_level: Optional[List[str]] = None  # Array of levels, null = open to all
    url: Optional[str] = None
    tags: Optional[List[str]] = None
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = False
    ai_matching_context: Optional[str] = None
    detailed_description: Optional[str] = None  # Rich text/markdown description
    # English proficiency requirements
    min_muet: Optional[float] = None  # MUET Band (1-5)
    min_ielts: Optional[float] = None  # IELTS score (0-9)
    min_spm_english: Optional[str] = None  # SPM English grade (A+, A, A-, B+, B, C, etc.)
    # New fields for enhanced UI
    email: Optional[str] = None
    scholarship_type: Optional[str] = None  # e.g., "Scholarship", "Grant", "Fellowship"
    place_of_study: Optional[List[str]] = None  # e.g., ["Local", "Overseas"]
    banner_image_url: Optional[str] = None
    # Deadline flexibility fields
    deadline_type: Optional[str] = "Fixed"  # Fixed, Estimated, Rolling, TBA
    opens_at: Optional[date] = None  # When applications typically open


class ScholarshipResponse(BaseModel):
    id: int
    title: str
    provider: str
    amount: str
    deadline: Optional[date] = None  # Made optional for Rolling/TBA scholarships
    education_level: Optional[List[str]] = None  # Array of levels, null = open to all
    url: Optional[str] = None
    tags: Optional[List[str]] = None
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = False
    ai_matching_context: Optional[str] = None
    detailed_description: Optional[str] = None  # Rich text/markdown description
    # English proficiency requirements
    min_muet: Optional[float] = None
    min_ielts: Optional[float] = None
    min_spm_english: Optional[str] = None
    # New fields for enhanced UI
    email: Optional[str] = None
    scholarship_type: Optional[str] = None
    place_of_study: Optional[List[str]] = None
    banner_image_url: Optional[str] = None
    # Deadline flexibility fields
    deadline_type: Optional[str] = "Fixed"  # Fixed, Estimated, Rolling, TBA
    opens_at: Optional[date] = None  # When applications typically open

    class Config:
        from_attributes = True


class ScholarshipMatchResponse(BaseModel):
    id: int
    title: str
    provider: str
    amount: str
    deadline: Optional[date] = None  # Made optional for Rolling/TBA scholarships
    education_level: Optional[List[str]] = None  # Array of levels, null = open to all
    url: Optional[str] = None
    tags: Optional[List[str]] = None
    study_areas: Optional[List[str]] = None
    min_cgpa: Optional[float] = None
    min_spm_as: Optional[int] = None
    household_income_max: Optional[float] = None
    state_restriction: Optional[str] = None
    is_bumiputera_only: Optional[bool] = False
    detailed_description: Optional[str] = None  # Rich text/markdown description
    # English proficiency requirements
    min_muet: Optional[float] = None
    min_ielts: Optional[float] = None
    min_spm_english: Optional[str] = None
    # New fields for enhanced UI
    email: Optional[str] = None
    scholarship_type: Optional[str] = None
    place_of_study: Optional[List[str]] = None
    banner_image_url: Optional[str] = None
    # Deadline flexibility fields
    deadline_type: Optional[str] = "Fixed"  # Fixed, Estimated, Rolling, TBA
    opens_at: Optional[date] = None  # When applications typically open
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
    education_level: Optional[List[str]] = None  # Array of levels, null = open to all
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
    education_level: Optional[List[str]] = None  # Array of levels, null = open to all
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
    education_level: Optional[List[str]] = None  # Array of levels, null = open to all
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


# Subscription schemas for premium tier management
class SubscriptionResponse(BaseModel):
    id: int
    auth_user_id: str
    tier: str  # 'free' or 'premium'
    status: str  # 'active', 'expired', 'cancelled'
    expires_at: Optional[str] = None
    payment_reference: Optional[str] = None
    is_premium: bool = False  # Computed field for easy checks
    
    class Config:
        from_attributes = True


class SubscriptionCreateRequest(BaseModel):
    """Request from ToyyibPay webhook to activate subscription"""
    payment_reference: str
    amount_paid: float
    duration_months: int = 1  # How many months to activate


class SubscriptionWebhookRequest(BaseModel):
    """ToyyibPay webhook callback structure - adjust based on actual ToyyibPay API"""
    billcode: str
    order_id: str
    status: str  # '1' for success, '2' for pending, '3' for failed
    transaction_id: Optional[str] = None
    amount: Optional[str] = None
    msg: Optional[str] = None


class FeatureAccessResponse(BaseModel):
    """Response for feature access checks"""
    has_access: bool
    tier: str
    message: Optional[str] = None
    upgrade_required: bool = False

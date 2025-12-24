from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
import json
import httpx
from openai import OpenAI
from markdownify import markdownify as md

from supabase_client import supabase
from schemas import (
    ScholarshipCreate, 
    ScholarshipResponse,
    ScholarshipMatchResponse,
    ProfileSyncRequest,
    ProfileSyncResponse,
    MatchRequest,
    ChatRequest,
    ChatResponse,
    VectorizeResponse,
    ScrapeRequest,
    ScrapeResponse,
    DraftResponse,
    DraftUpdateRequest,
    PublishResponse,
    ScholarshipList,
    UserProfileCreate,
    UserProfileResponse,
    UserProfileMatchRequest,
    MALAYSIAN_STATES,
    STUDY_AREAS
)

app = FastAPI(title="Ascendia API", description="Malaysian Scholarship Discovery Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o"

SOCRATIC_SYSTEM_PROMPT = """You are the Ascendia Socratic Mentor. You help Malaysian students with scholarship applications.

IMPORTANT RULES:
1. NEVER write essays, personal statements, or application content for students
2. Ask guiding questions using the STAR method (Situation, Task, Action, Result)
3. Help students structure their own stories and experiences
4. Encourage reflection and self-discovery
5. Be supportive, warm, and encouraging
6. Use simple, clear language accessible to Malaysian students
7. When a student shares an experience, ask follow-up questions to help them elaborate

STAR Method Questions:
- Situation: "Can you describe the context? Where and when did this happen?"
- Task: "What was your specific role or responsibility?"
- Action: "What steps did you take? How did you approach it?"
- Result: "What was the outcome? What did you learn from this?"

Always encourage students to find their own voice and express their genuine experiences."""


def generate_embedding(text: str) -> List[float]:
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


def create_scholarship_text(scholarship: dict) -> str:
    parts = [
        scholarship.get("title", ""),
        scholarship.get("provider", ""),
        scholarship.get("education_level", ""),
        scholarship.get("amount", ""),
        scholarship.get("description", ""),
        scholarship.get("ai_matching_context", ""),
    ]
    if scholarship.get("tags"):
        parts.extend(scholarship["tags"])
    if scholarship.get("study_areas"):
        parts.extend(scholarship["study_areas"])
    return " ".join(filter(None, parts))


@app.on_event("startup")
def startup_event():
    try:
        result = supabase.table("scholarships").select("id").limit(1).execute()
        count = len(result.data)
        print(f"[Supabase] Connection verified. Found {count} scholarship(s) in test query.")
        
        if count == 0:
            seed_scholarships()
    except Exception as e:
        print(f"[Supabase] Warning: Could not verify connection: {e}")


def seed_scholarships():
    print("[Supabase] Seeding initial scholarship data...")
    scholarships = [
        {
            "title": "Yayasan Khazanah Global Scholarship",
            "provider": "Yayasan Khazanah",
            "amount": "Full Ride + Allowance",
            "deadline": "2025-03-31",
            "education_level": "Undergraduate",
            "url": "https://www.yayasankhazanah.com.my/scholarship/",
            "tags": ["full-ride", "overseas", "merit-based"],
            "study_areas": ["STEM", "Business", "Law"],
            "min_cgpa": 3.5,
            "is_bumiputera_only": False
        },
        {
            "title": "Maybank Group Scholarship Programme",
            "provider": "Maybank Foundation",
            "amount": "RM 40,000/year",
            "deadline": "2025-04-15",
            "education_level": "Undergraduate",
            "url": "https://www.maybank.com/scholarship",
            "tags": ["banking", "finance", "local"],
            "study_areas": ["Business", "Accounting", "IT & Computer Science"],
            "min_cgpa": 3.0
        },
        {
            "title": "JPA PIDN Scholarship",
            "provider": "Public Service Department",
            "amount": "Full Coverage",
            "deadline": "2025-05-01",
            "education_level": "Degree",
            "url": "https://www.jpa.gov.my/",
            "tags": ["government", "full-coverage", "bonded"],
            "study_areas": ["General"],
            "is_bumiputera_only": True
        },
        {
            "title": "Shell Malaysia Scholarship",
            "provider": "Shell Malaysia",
            "amount": "RM 12,000 + Internship",
            "deadline": "2025-02-28",
            "education_level": "Undergraduate",
            "url": "https://www.shell.com.my/careers/scholarships.html",
            "tags": ["engineering", "oil-gas", "internship"],
            "study_areas": ["Engineering", "STEM"],
            "min_cgpa": 3.2
        },
        {
            "title": "The Star Education Fund",
            "provider": "The Star",
            "amount": "Tuition Fee Waiver",
            "deadline": "2025-06-30",
            "education_level": "Diploma/Degree",
            "url": "https://www.thestar.com.my/education",
            "tags": ["media", "journalism", "local"],
            "study_areas": ["Arts & Humanities", "Social Sciences"]
        }
    ]
    
    try:
        result = supabase.table("scholarships").insert(scholarships).execute()
        print(f"[Supabase] Seeded {len(result.data)} scholarships successfully!")
    except Exception as e:
        print(f"[Supabase] Error seeding data: {e}")


@app.get("/")
def read_root():
    return {"message": "Ascendia API - Malaysian Scholarship Discovery Platform"}


@app.post("/scholarships/", response_model=ScholarshipResponse)
def create_scholarship(scholarship: ScholarshipCreate):
    data = scholarship.model_dump()
    if data.get("deadline"):
        data["deadline"] = str(data["deadline"])
    
    result = supabase.table("scholarships").insert(data).execute()
    
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail="Failed to create scholarship")


@app.get("/scholarships/", response_model=List[ScholarshipResponse])
def list_scholarships(
    skip: int = 0,
    limit: int = 100,
    query: Optional[str] = Query(None, description="Search in title and tags"),
    level: Optional[str] = Query(None, description="Filter by education level"),
):
    q = supabase.table("scholarships").select("*")
    
    if level:
        q = q.ilike("education_level", f"%{level}%")
    
    if query:
        q = q.ilike("title", f"%{query}%")
    
    q = q.order("deadline", desc=False)
    q = q.range(skip, skip + limit - 1)
    
    result = q.execute()
    return result.data


@app.get("/scholarships/{scholarship_id}", response_model=ScholarshipResponse)
def get_scholarship(scholarship_id: int):
    result = supabase.table("scholarships").select("*").eq("id", scholarship_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return result.data[0]


@app.put("/scholarships/{scholarship_id}", response_model=ScholarshipResponse)
def update_scholarship(scholarship_id: int, scholarship_data: ScholarshipCreate):
    existing = supabase.table("scholarships").select("id").eq("id", scholarship_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    data = scholarship_data.model_dump()
    if data.get("deadline"):
        data["deadline"] = str(data["deadline"])
    
    result = supabase.table("scholarships").update(data).eq("id", scholarship_id).execute()
    
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail="Failed to update scholarship")


@app.delete("/scholarships/{scholarship_id}")
def delete_scholarship(scholarship_id: int):
    existing = supabase.table("scholarships").select("id").eq("id", scholarship_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    supabase.table("scholarships").delete().eq("id", scholarship_id).execute()
    return {"message": "Scholarship deleted successfully"}


@app.post("/profile/sync", response_model=ProfileSyncResponse)
def sync_profile(request: ProfileSyncRequest):
    profile_parts = [request.bio]
    
    if request.education_level:
        profile_parts.append(f"Education level: {request.education_level}.")
    if request.field_of_study:
        profile_parts.append(f"Field of study: {request.field_of_study}.")
    if request.intended_study_areas:
        profile_parts.append(f"Interested in: {', '.join(request.intended_study_areas)}.")
    if request.state:
        profile_parts.append(f"From {request.state}, Malaysia.")
    if request.cgpa:
        profile_parts.append(f"CGPA: {request.cgpa}.")
    if request.spm_as:
        profile_parts.append(f"SPM A's: {request.spm_as}.")
    
    profile_text = " ".join(profile_parts)
    
    try:
        embedding = generate_embedding(profile_text)
        return ProfileSyncResponse(
            embedding=embedding,
            message="Profile embedding generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


# Household income bracket to RM conversion
INCOME_BRACKETS = {
    "B40": 4850,    # Below RM 4,850/month
    "M40": 10959,   # RM 4,850 - 10,959/month
    "T20": 999999   # Above RM 10,959/month (no limit)
}


# ============================================================================
# ENGLISH PROFICIENCY EQUIVALENCE ENGINE
# Maps MUET, IELTS, and SPM English to a Universal Scale (1-9) based on CEFR
# ============================================================================

# SPM English grade to Universal Scale mapping
SPM_ENGLISH_TO_UNIVERSAL = {
    "A+": 9,   # C1/C2
    "A": 8,    # C1
    "A-": 7,   # B2 High
    "B+": 6,   # B2 Low
    "B": 5,    # B1 High
    "C+": 4,   # B1 Low
    "C": 3,    # A2 High
    "D": 2,    # A2 Low
    "E": 1,    # A1
    "G": 0,    # Below A1
}

# MUET Band to Universal Scale mapping
MUET_TO_UNIVERSAL = {
    5.0: 9,    # Aggregated Band 5 - C1/C2
    4.5: 7,    # High Band 4 - B2 High  
    4.0: 6,    # Band 4 - B2 Low
    3.5: 5,    # High Band 3 - B1 High
    3.0: 4,    # Band 3 - B1 Low
    2.5: 3,    # High Band 2 - A2 High
    2.0: 2,    # Band 2 - A2 Low
    1.5: 1,    # High Band 1 - A1
    1.0: 0,    # Band 1 - Below A1
}

# IELTS to Universal Scale mapping
IELTS_TO_UNIVERSAL = {
    9.0: 9,    # Expert - C2
    8.5: 9,    # Very good - C2
    8.0: 8,    # Very good - C1
    7.5: 8,    # Good - C1
    7.0: 8,    # Good - C1
    6.5: 7,    # Competent - B2 High
    6.0: 7,    # Competent - B2 High
    5.5: 6,    # Modest - B2 Low
    5.0: 5,    # Modest - B1 High
    4.5: 4,    # Limited - B1 Low
    4.0: 3,    # Limited - A2 High
    3.5: 2,    # Extremely limited - A2 Low
    3.0: 1,    # Extremely limited - A1
}


def get_muet_universal_level(muet_band: float) -> int:
    """Convert MUET band to universal scale (1-9)."""
    if muet_band is None:
        return 0
    # Find the closest MUET band
    bands = sorted(MUET_TO_UNIVERSAL.keys())
    for band in bands:
        if muet_band <= band:
            return MUET_TO_UNIVERSAL[band]
    return MUET_TO_UNIVERSAL[max(bands)]


def get_ielts_universal_level(ielts_score: float) -> int:
    """Convert IELTS score to universal scale (1-9)."""
    if ielts_score is None:
        return 0
    # Find the closest IELTS score (round to nearest 0.5)
    rounded = round(ielts_score * 2) / 2
    if rounded in IELTS_TO_UNIVERSAL:
        return IELTS_TO_UNIVERSAL[rounded]
    # Find closest lower score
    scores = sorted(IELTS_TO_UNIVERSAL.keys(), reverse=True)
    for score in scores:
        if ielts_score >= score:
            return IELTS_TO_UNIVERSAL[score]
    return 0


def get_spm_english_universal_level(grade: str) -> int:
    """Convert SPM English grade to universal scale (1-9)."""
    if grade is None:
        return 0
    return SPM_ENGLISH_TO_UNIVERSAL.get(grade.upper().strip(), 0)


def calculate_user_english_level(
    muet_band: Optional[float] = None,
    ielts_score: Optional[float] = None,
    spm_english_grade: Optional[str] = None
) -> int:
    """
    Calculate the user's highest English proficiency level from any test they have.
    Returns the maximum universal level from all available tests.
    """
    levels = []
    if muet_band is not None:
        levels.append(get_muet_universal_level(muet_band))
    if ielts_score is not None:
        levels.append(get_ielts_universal_level(ielts_score))
    if spm_english_grade is not None:
        levels.append(get_spm_english_universal_level(spm_english_grade))
    
    return max(levels) if levels else 0


def check_english_eligibility(
    profile: dict,
    scholarship: dict
) -> tuple[bool, Optional[str]]:
    """
    Check if user meets scholarship English requirements.
    Uses cross-test equivalence if user has different test type.
    
    Returns: (is_eligible, ineligibility_reason or None)
    """
    # Get scholarship requirements
    req_muet = scholarship.get("min_muet")
    req_ielts = scholarship.get("min_ielts")
    req_spm_english = scholarship.get("min_spm_english")
    
    # If no English requirement, user is eligible
    if req_muet is None and req_ielts is None and req_spm_english is None:
        return True, None
    
    # Get user's English scores
    user_muet = profile.get("muet_band")
    user_ielts = profile.get("ielts_score")
    user_spm_english = profile.get("spm_english_grade")
    
    # If user has no English scores, they're NOT automatically disqualified
    # (following spec: don't disqualify if user hasn't taken test yet)
    if user_muet is None and user_ielts is None and user_spm_english is None:
        return True, None
    
    # Calculate user's universal English level
    user_level = calculate_user_english_level(user_muet, user_ielts, user_spm_english)
    
    # Calculate required universal level from scholarship
    required_levels = []
    requirement_descriptions = []
    
    if req_muet is not None:
        required_levels.append(get_muet_universal_level(req_muet))
        requirement_descriptions.append(f"MUET Band {req_muet}")
    if req_ielts is not None:
        required_levels.append(get_ielts_universal_level(req_ielts))
        requirement_descriptions.append(f"IELTS {req_ielts}")
    if req_spm_english is not None:
        required_levels.append(get_spm_english_universal_level(req_spm_english))
        requirement_descriptions.append(f"SPM English {req_spm_english}")
    
    # User needs to meet at least the minimum required level
    # (using the lowest requirement if multiple are specified)
    min_required_level = min(required_levels) if required_levels else 0
    
    if user_level >= min_required_level:
        return True, None
    else:
        req_str = " or ".join(requirement_descriptions)
        return False, f"English requirement not met: needs {req_str}"


def create_profile_text(profile: dict) -> str:
    """Create text representation of profile for embedding generation."""
    parts = []
    if profile.get("bio_achievements"):
        parts.append(profile["bio_achievements"])
    if profile.get("education_level"):
        parts.append(f"Education level: {profile['education_level']}.")
    if profile.get("study_areas"):
        parts.append(f"Interested in: {', '.join(profile['study_areas'])}.")
    if profile.get("state"):
        parts.append(f"From {profile['state']}, Malaysia.")
    if profile.get("cgpa"):
        parts.append(f"CGPA: {profile['cgpa']}.")
    if profile.get("spm_as"):
        parts.append(f"SPM A's: {profile['spm_as']}.")
    return " ".join(parts)


@app.post("/profiles/", response_model=UserProfileResponse)
def create_user_profile(profile: UserProfileCreate):
    """Create a new user profile and generate embedding."""
    try:
        data = profile.model_dump()
        
        # Generate embedding from profile data
        profile_text = create_profile_text(data)
        embedding = generate_embedding(profile_text)
        data["embedding"] = embedding
        
        result = supabase.table("user_profiles").insert(data).execute()
        
        if result.data:
            profile_data = result.data[0]
            return UserProfileResponse(
                id=profile_data["id"],
                education_level=profile_data.get("education_level"),
                cgpa=profile_data.get("cgpa"),
                spm_as=profile_data.get("spm_as"),
                household_income=profile_data.get("household_income"),
                state=profile_data.get("state"),
                is_bumiputera=profile_data.get("is_bumiputera", False),
                study_areas=profile_data.get("study_areas"),
                bio_achievements=profile_data.get("bio_achievements"),
                has_embedding=profile_data.get("embedding") is not None,
                muet_band=profile_data.get("muet_band"),
                ielts_score=profile_data.get("ielts_score"),
                spm_english_grade=profile_data.get("spm_english_grade")
            )
        raise HTTPException(status_code=500, detail="Failed to create profile")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")


@app.get("/profiles/{profile_id}", response_model=UserProfileResponse)
def get_user_profile(profile_id: str):
    """Get a user profile by ID."""
    result = supabase.table("user_profiles").select("*").eq("id", profile_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile_data = result.data[0]
    return UserProfileResponse(
        id=profile_data["id"],
        education_level=profile_data.get("education_level"),
        cgpa=profile_data.get("cgpa"),
        spm_as=profile_data.get("spm_as"),
        household_income=profile_data.get("household_income"),
        state=profile_data.get("state"),
        is_bumiputera=profile_data.get("is_bumiputera", False),
        study_areas=profile_data.get("study_areas"),
        bio_achievements=profile_data.get("bio_achievements"),
        has_embedding=profile_data.get("embedding") is not None,
        muet_band=profile_data.get("muet_band"),
        ielts_score=profile_data.get("ielts_score"),
        spm_english_grade=profile_data.get("spm_english_grade")
    )


@app.post("/profiles/match", response_model=List[ScholarshipMatchResponse])
def match_with_profile(request: UserProfileMatchRequest):
    """Match scholarships using a stored profile from Supabase."""
    # Get profile from database
    profile_result = supabase.table("user_profiles").select("*").eq("id", request.profile_id).execute()
    
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = profile_result.data[0]
    
    if not profile.get("embedding"):
        raise HTTPException(status_code=400, detail="Profile has no embedding. Please recreate your profile.")
    
    # Convert household income bracket to RM value for comparison
    household_income_rm = INCOME_BRACKETS.get(profile.get("household_income"), None)
    
    try:
        # Handle embedding format - it may come as string or list from Supabase
        embedding_data = profile["embedding"]
        if isinstance(embedding_data, str):
            # It's already a string, use it directly (may be "[0.1,0.2,...]" format)
            embedding_str = embedding_data
        elif isinstance(embedding_data, list):
            # It's a list, convert to string format for RPC
            embedding_str = "[" + ",".join(map(str, embedding_data)) + "]"
        else:
            raise HTTPException(status_code=500, detail="Invalid embedding format in profile")
        
        result = supabase.rpc(
            "match_scholarships",
            {
                "query_embedding": embedding_str,
                "match_count": request.limit * 3
            }
        ).execute()
        
        if not result.data:
            return []
        
        matches = []
        for row in result.data:
            is_eligible = True
            ineligibility_reasons = []
            
            # CGPA check
            if profile.get("cgpa") is not None and row.get("min_cgpa") is not None:
                if profile["cgpa"] < row["min_cgpa"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Requires minimum CGPA of {row['min_cgpa']}")
            
            # SPM A's check
            if profile.get("spm_as") is not None and row.get("min_spm_as") is not None:
                if profile["spm_as"] < row["min_spm_as"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Requires minimum {row['min_spm_as']} A's in SPM")
            
            # Household income check (convert bracket to RM)
            if household_income_rm is not None and row.get("household_income_max") is not None:
                if household_income_rm > row["household_income_max"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Household income exceeds RM {row['household_income_max']:,.0f} limit")
            
            # State restriction check
            if row.get("state_restriction") and profile.get("state"):
                if profile["state"] != row["state_restriction"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Restricted to {row['state_restriction']} residents")
            
            # Bumiputera check
            if row.get("is_bumiputera_only") and not profile.get("is_bumiputera"):
                is_eligible = False
                ineligibility_reasons.append("Restricted to Bumiputera applicants")
            
            # English proficiency check using equivalence engine
            english_eligible, english_reason = check_english_eligibility(profile, row)
            if not english_eligible:
                is_eligible = False
                if english_reason:
                    ineligibility_reasons.append(english_reason)
            
            similarity_score = row.get("similarity", 0) if is_eligible else 0
            
            matches.append(ScholarshipMatchResponse(
                id=row["id"],
                title=row["title"],
                provider=row["provider"],
                amount=row["amount"],
                deadline=row["deadline"],
                education_level=row["education_level"],
                url=row.get("url"),
                tags=row.get("tags"),
                study_areas=row.get("study_areas"),
                min_cgpa=row.get("min_cgpa"),
                min_spm_as=row.get("min_spm_as"),
                household_income_max=row.get("household_income_max"),
                state_restriction=row.get("state_restriction"),
                is_bumiputera_only=row.get("is_bumiputera_only", False),
                min_muet=row.get("min_muet"),
                min_ielts=row.get("min_ielts"),
                min_spm_english=row.get("min_spm_english"),
                similarity_score=similarity_score,
                is_eligible=is_eligible,
                ineligibility_reasons=ineligibility_reasons if ineligibility_reasons else None
            ))
        
        # Sort: eligible first (by similarity), then ineligible
        matches.sort(key=lambda x: (not x.is_eligible, -x.similarity_score))
        
        return matches[:request.limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to match scholarships: {str(e)}")


@app.post("/scholarships/match", response_model=List[ScholarshipMatchResponse])
def match_scholarships(request: MatchRequest):
    try:
        embedding_str = "[" + ",".join(map(str, request.embedding)) + "]"
        
        result = supabase.rpc(
            "match_scholarships",
            {
                "query_embedding": embedding_str,
                "match_count": request.limit * 3
            }
        ).execute()
        
        if not result.data:
            return []
        
        matches = []
        for row in result.data:
            is_eligible = True
            ineligibility_reasons = []
            
            if request.cgpa is not None and row.get("min_cgpa") is not None:
                if request.cgpa < row["min_cgpa"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Requires minimum CGPA of {row['min_cgpa']}")
            
            if request.spm_as is not None and row.get("min_spm_as") is not None:
                if request.spm_as < row["min_spm_as"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Requires minimum {row['min_spm_as']} A's in SPM")
            
            if request.household_income is not None and row.get("household_income_max") is not None:
                if request.household_income > row["household_income_max"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Household income exceeds RM {row['household_income_max']:,.0f} limit")
            
            if row.get("state_restriction") and request.state:
                if request.state != row["state_restriction"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Restricted to {row['state_restriction']} residents")
            
            if row.get("is_bumiputera_only") and request.is_bumiputera is False:
                is_eligible = False
                ineligibility_reasons.append("Restricted to Bumiputera applicants")
            
            similarity_score = row.get("similarity", 0) if is_eligible else 0
            
            matches.append(ScholarshipMatchResponse(
                id=row["id"],
                title=row["title"],
                provider=row["provider"],
                amount=row["amount"],
                deadline=row["deadline"],
                education_level=row["education_level"],
                url=row.get("url"),
                tags=row.get("tags"),
                study_areas=row.get("study_areas"),
                min_cgpa=row.get("min_cgpa"),
                min_spm_as=row.get("min_spm_as"),
                household_income_max=row.get("household_income_max"),
                state_restriction=row.get("state_restriction"),
                is_bumiputera_only=row.get("is_bumiputera_only", False),
                similarity_score=similarity_score,
                is_eligible=is_eligible,
                ineligibility_reasons=ineligibility_reasons if ineligibility_reasons else None
            ))
        
        matches.sort(key=lambda x: (not x.is_eligible, -x.similarity_score))
        
        return matches[:request.limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to match scholarships: {str(e)}")


@app.post("/scholarships/vectorize", response_model=VectorizeResponse)
def vectorize_scholarships():
    try:
        result = supabase.table("scholarships").select("*").is_("embedding", "null").execute()
        
        if not result.data:
            return VectorizeResponse(processed=0, message="All scholarships already have embeddings")
        
        processed = 0
        for scholarship in result.data:
            text = create_scholarship_text(scholarship)
            embedding = generate_embedding(text)
            
            supabase.table("scholarships").update({
                "embedding": embedding
            }).eq("id", scholarship["id"]).execute()
            
            processed += 1
        
        return VectorizeResponse(
            processed=processed,
            message=f"Successfully vectorized {processed} scholarships"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to vectorize scholarships: {str(e)}")


@app.post("/chat/coach", response_model=ChatResponse)
def chat_with_coach(request: ChatRequest):
    try:
        messages = [{"role": "system", "content": SOCRATIC_SYSTEM_PROMPT}]
        
        if request.conversation_history:
            history = request.conversation_history[-20:]
            messages.extend(history)
        
        messages.append({"role": "user", "content": request.message})
        
        response = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message.content
        
        new_history = request.conversation_history or []
        new_history.append({"role": "user", "content": request.message})
        new_history.append({"role": "assistant", "content": assistant_message})
        
        return ChatResponse(
            response=assistant_message,
            conversation_history=new_history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get coach response: {str(e)}")


SCRAPER_SYSTEM_PROMPT = f"""You are a scholarship data extraction expert for Malaysian scholarships. Extract scholarship information from the provided webpage content.

CRITICAL RULES - HALLUCINATION PREVENTION:
1. If information is NOT EXPLICITLY STATED in the text, set the field to null
2. NEVER guess or infer numbers (CGPA, income limits, SPM grades, MUET bands, IELTS scores)
3. If no specific study area is mentioned, use ["General"]
4. For each piece of data, include a source_quote - the exact phrase that proves this data
5. If multiple distinct scholarships exist, extract EACH separately

FIELD EXTRACTION GUIDELINES:
- title: The scholarship name (required)
- provider: The organization offering it
- amount: Monetary value with currency (RM, USD, etc.) or coverage description
- deadline: Application deadline in YYYY-MM-DD format if possible
- education_level: One of SPM, STPM, Diploma, Undergraduate, Postgraduate, PhD
- description: Brief description of the scholarship
- source_quote: The specific text from the page that confirms this scholarship

ELIGIBILITY FIELDS (set to null if not explicitly stated):
- study_areas: Array from {STUDY_AREAS}. Use ["General"] if not specified
- min_cgpa: Minimum CGPA requirement (float like 3.0, 3.5). NULL if not stated
- min_spm_as: Minimum number of A's required in SPM (integer). NULL if not stated
- household_income_max: Maximum household income in RM (number). NULL if not stated
- state_restriction: If restricted to a specific state from {MALAYSIAN_STATES}. NULL if nationwide
- is_bumiputera_only: true if explicitly for Bumiputera only, false otherwise

ENGLISH PROFICIENCY REQUIREMENTS (set to null if not explicitly stated):
- min_muet: MUET Band requirement (float 1-5, e.g. 4.0 for "Band 4", 4.5 for "Band 4.5"). Look for phrases like "MUET Band 4", "minimum Band 3". NULL if not stated
- min_ielts: IELTS score requirement (float 0-9, e.g. 6.0, 6.5, 7.0). Look for phrases like "IELTS 6.0", "minimum IELTS score of 6.5". NULL if not stated
- min_spm_english: SPM English 1119 grade requirement (string like "A+", "A", "B+", "B"). Look for phrases like "SPM English Credit", "minimum grade B+ in English". NULL if not stated

AI MATCHING CONTEXT (IMPORTANT):
- ai_matching_context: Write 1-2 sentences describing the IDEAL candidate profile based on the scholarship's values and preferences. Example: "Values leadership and community service in rural areas. Prefers candidates with entrepreneurial mindset."

Remember: When in doubt, use null. Never fabricate requirements."""


@app.post("/admin/scrape", response_model=ScrapeResponse)
async def scrape_scholarship_urls(request: ScrapeRequest):
    if not request.urls:
        raise HTTPException(status_code=400, detail="At least one URL is required")
    
    all_content = []
    primary_url = request.urls[0]
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        for url in request.urls:
            try:
                response = await client.get(url, headers=headers, follow_redirects=True)
                
                if response.status_code == 200:
                    html_content = response.text
                    markdown_content = md(html_content, heading_style="ATX", strip=['script', 'style', 'nav', 'footer'])
                    all_content.append(f"=== Content from {url} ===\n{markdown_content}")
                else:
                    all_content.append(f"=== Failed to fetch {url}: HTTP {response.status_code} ===")
            except Exception as e:
                all_content.append(f"=== Failed to fetch {url}: {str(e)} ===")
    
    combined_content = "\n\n".join(all_content)
    combined_content = combined_content[:25000]
    
    try:
        extraction_response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SCRAPER_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract scholarship information from these webpages:\n\nPrimary URL: {primary_url}\n\nContent:\n{combined_content}"}
            ],
            response_format={"type": "json_object"},
            max_tokens=3000,
            temperature=0.1
        )
        
        result_text = extraction_response.choices[0].message.content
        result_data = json.loads(result_text)
        
        scholarships = result_data.get("scholarships", [result_data] if "title" in result_data else [])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
    
    drafts_created = 0
    for scholarship in scholarships:
        if not scholarship.get("title"):
            continue
        
        study_areas = scholarship.get("study_areas")
        if not study_areas or len(study_areas) == 0:
            study_areas = ["General"]
        else:
            study_areas = [area for area in study_areas if area in STUDY_AREAS]
            if not study_areas:
                study_areas = ["General"]
        
        state = scholarship.get("state_restriction")
        if state and state not in MALAYSIAN_STATES:
            state = None
        
        min_cgpa = scholarship.get("min_cgpa")
        if min_cgpa is not None:
            try:
                min_cgpa = float(min_cgpa)
                if min_cgpa < 0 or min_cgpa > 4:
                    min_cgpa = None
            except (ValueError, TypeError):
                min_cgpa = None
        
        min_spm = scholarship.get("min_spm_as")
        if min_spm is not None:
            try:
                min_spm = int(min_spm)
                if min_spm < 0 or min_spm > 10:
                    min_spm = None
            except (ValueError, TypeError):
                min_spm = None
        
        income_max = scholarship.get("household_income_max")
        if income_max is not None:
            try:
                income_max = float(income_max)
                if income_max < 0:
                    income_max = None
            except (ValueError, TypeError):
                income_max = None
        
        # Validate English proficiency fields
        min_muet = scholarship.get("min_muet")
        if min_muet is not None:
            try:
                min_muet = float(min_muet)
                if min_muet < 1 or min_muet > 5:
                    min_muet = None
            except (ValueError, TypeError):
                min_muet = None
        
        min_ielts = scholarship.get("min_ielts")
        if min_ielts is not None:
            try:
                min_ielts = float(min_ielts)
                if min_ielts < 0 or min_ielts > 9:
                    min_ielts = None
            except (ValueError, TypeError):
                min_ielts = None
        
        min_spm_english = scholarship.get("min_spm_english")
        valid_spm_grades = ["A+", "A", "A-", "B+", "B", "C+", "C", "D", "E", "G"]
        if min_spm_english is not None:
            if isinstance(min_spm_english, str):
                min_spm_english = min_spm_english.strip().upper()
                if min_spm_english not in valid_spm_grades:
                    min_spm_english = None
            else:
                min_spm_english = None
        
        def clean_value(val):
            if val is None:
                return None
            if isinstance(val, str):
                stripped = val.strip().lower()
                if not stripped or stripped == "null" or stripped == "none" or stripped == "n/a":
                    return None
                return val.strip()
            return val
        
        draft_data = {
            "title": scholarship.get("title"),
            "provider": clean_value(scholarship.get("provider")),
            "amount": clean_value(scholarship.get("amount")),
            "education_level": clean_value(scholarship.get("education_level")),
            "url": primary_url,
            "description": clean_value(scholarship.get("description")),
            "source_quote": clean_value(scholarship.get("source_quote")),
            "status": "pending"
        }
        
        deadline = clean_value(scholarship.get("deadline"))
        if deadline:
            draft_data["deadline"] = deadline
        
        optional_fields = {
            "study_areas": study_areas,
            "min_cgpa": min_cgpa,
            "min_spm_as": min_spm,
            "household_income_max": income_max,
            "state_restriction": state,
            "is_bumiputera_only": bool(scholarship.get("is_bumiputera_only", False)),
            "ai_matching_context": clean_value(scholarship.get("ai_matching_context")),
            "min_muet": min_muet,
            "min_ielts": min_ielts,
            "min_spm_english": min_spm_english
        }
        
        for key, val in optional_fields.items():
            if val is not None:
                draft_data[key] = val
        
        try:
            supabase.table("scholarship_drafts").insert(draft_data).execute()
            drafts_created += 1
        except Exception as e:
            print(f"Failed to insert draft: {e}")
    
    if drafts_created == 0:
        return ScrapeResponse(drafts_created=0, message="No scholarships found on these pages")
    
    return ScrapeResponse(
        drafts_created=drafts_created,
        message=f"Successfully extracted {drafts_created} scholarship(s) for review"
    )


@app.get("/admin/drafts", response_model=List[DraftResponse])
def list_drafts(status: Optional[str] = Query("pending", description="Filter by status: pending, approved, rejected")):
    try:
        q = supabase.table("scholarship_drafts").select("*")
        if status:
            q = q.eq("status", status)
        q = q.order("id", desc=True)
        
        result = q.execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch drafts: {str(e)}")


@app.put("/admin/drafts/{draft_id}", response_model=DraftResponse)
def update_draft(draft_id: int, update_data: DraftUpdateRequest):
    try:
        draft_result = supabase.table("scholarship_drafts").select("*").eq("id", draft_id).execute()
        
        if not draft_result.data:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        raw_dict = update_data.model_dump(exclude_unset=True)
        update_dict = {}
        
        string_fields = ["title", "provider", "amount", "deadline", "education_level", "url", "description", "ai_matching_context"]
        for key in string_fields:
            if key in raw_dict:
                val = raw_dict[key]
                update_dict[key] = val if val and val.strip() else None
        
        if "study_areas" in raw_dict:
            areas = raw_dict["study_areas"]
            if areas:
                areas = [a for a in areas if a in STUDY_AREAS]
                update_dict["study_areas"] = areas if areas else ["General"]
            else:
                update_dict["study_areas"] = ["General"]
        
        if "state_restriction" in raw_dict:
            state = raw_dict["state_restriction"]
            update_dict["state_restriction"] = state if state in MALAYSIAN_STATES else None
        
        if "min_cgpa" in raw_dict:
            cgpa = raw_dict["min_cgpa"]
            if cgpa is not None and 0 <= cgpa <= 4:
                update_dict["min_cgpa"] = cgpa
            else:
                update_dict["min_cgpa"] = None
        
        if "min_spm_as" in raw_dict:
            spm = raw_dict["min_spm_as"]
            if spm is not None and 0 <= spm <= 10:
                update_dict["min_spm_as"] = spm
            else:
                update_dict["min_spm_as"] = None
        
        if "household_income_max" in raw_dict:
            income = raw_dict["household_income_max"]
            if income is not None and income >= 0:
                update_dict["household_income_max"] = income
            else:
                update_dict["household_income_max"] = None
        
        if "is_bumiputera_only" in raw_dict:
            update_dict["is_bumiputera_only"] = bool(raw_dict["is_bumiputera_only"])
        
        if not update_dict:
            return draft_result.data[0]
        
        result = supabase.table("scholarship_drafts").update(update_dict).eq("id", draft_id).execute()
        
        if result.data:
            return result.data[0]
        raise HTTPException(status_code=500, detail="Failed to update draft")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update draft: {str(e)}")


@app.post("/admin/drafts/{draft_id}/publish", response_model=PublishResponse)
def publish_draft(draft_id: int):
    try:
        draft_result = supabase.table("scholarship_drafts").select("*").eq("id", draft_id).execute()
        
        if not draft_result.data:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        draft = draft_result.data[0]
        
        if draft["status"] != "pending":
            raise HTTPException(status_code=400, detail=f"Draft is already {draft['status']}")
        
        scholarship_data = {
            "title": draft["title"] or "Untitled Scholarship",
            "provider": draft["provider"] or "Unknown Provider",
            "amount": draft["amount"] or "Contact provider",
            "deadline": draft["deadline"] or "2025-12-31",
            "education_level": draft["education_level"] or "Various",
            "url": draft["url"],
            "tags": [],
            "study_areas": draft.get("study_areas") or ["General"],
            "min_cgpa": draft.get("min_cgpa"),
            "min_spm_as": draft.get("min_spm_as"),
            "household_income_max": draft.get("household_income_max"),
            "state_restriction": draft.get("state_restriction"),
            "is_bumiputera_only": draft.get("is_bumiputera_only", False),
            "ai_matching_context": draft.get("ai_matching_context")
        }
        
        scholarship_result = supabase.table("scholarships").insert(scholarship_data).execute()
        
        if not scholarship_result.data:
            raise HTTPException(status_code=500, detail="Failed to create scholarship")
        
        new_scholarship = scholarship_result.data[0]
        scholarship_id = new_scholarship["id"]
        
        try:
            text = create_scholarship_text(new_scholarship)
            embedding = generate_embedding(text)
            supabase.table("scholarships").update({"embedding": embedding}).eq("id", scholarship_id).execute()
        except Exception as embed_error:
            print(f"Warning: Failed to generate embedding: {embed_error}")
        
        supabase.table("scholarship_drafts").update({"status": "approved"}).eq("id", draft_id).execute()
        
        return PublishResponse(
            scholarship_id=scholarship_id,
            message="Draft published successfully and added to Magic Match"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish draft: {str(e)}")


@app.delete("/admin/drafts/{draft_id}")
def reject_draft(draft_id: int):
    try:
        draft_result = supabase.table("scholarship_drafts").select("id").eq("id", draft_id).execute()
        
        if not draft_result.data:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        supabase.table("scholarship_drafts").update({"status": "rejected"}).eq("id", draft_id).execute()
        
        return {"message": "Draft rejected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reject draft: {str(e)}")

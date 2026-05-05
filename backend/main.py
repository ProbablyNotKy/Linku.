from fastapi import FastAPI, HTTPException, Query, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
import json
import httpx
import psycopg2
from openai import OpenAI
from markdownify import markdownify as md

from supabase_client import supabase
from auth import get_current_user, get_optional_user, require_admin, AuthUser
from constants import (
    MALAYSIAN_STATES, STUDY_AREAS, INCOME_BRACKETS, 
    get_income_rm_value, EDUCATION_LEVELS, SPM_ENGLISH_GRADES
)
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
    STUDY_AREAS,
    SubscriptionResponse,
    SubscriptionCreateRequest,
    SubscriptionWebhookRequest,
    FeatureAccessResponse
)
from datetime import datetime, timedelta

app = FastAPI(title="Ascendia API", description="Malaysian Scholarship Discovery Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_db_connection():
    """Get a direct PostgreSQL connection for bypassing PostgREST cache issues."""
    # Use Supabase database URL if available, fallback to Replit's DATABASE_URL
    db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
    return psycopg2.connect(db_url)

def update_column_direct_sql(table: str, id_value: int, column: str, value):
    """Update a single column using direct SQL - bypasses PostgREST schema cache."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if value is None:
            cursor.execute(f'UPDATE {table} SET "{column}" = NULL WHERE id = %s', (id_value,))
        elif isinstance(value, list):
            cursor.execute(f'UPDATE {table} SET "{column}" = %s WHERE id = %s', (value, id_value))
        elif isinstance(value, bool):
            cursor.execute(f'UPDATE {table} SET "{column}" = %s WHERE id = %s', (value, id_value))
        elif isinstance(value, (int, float)):
            cursor.execute(f'UPDATE {table} SET "{column}" = %s WHERE id = %s', (value, id_value))
        else:
            cursor.execute(f'UPDATE {table} SET "{column}" = %s WHERE id = %s', (str(value), id_value))
        conn.commit()
        print(f"Column '{column}' updated via direct SQL successfully")
        return True
    except Exception as e:
        print(f"Direct SQL update for '{column}' failed: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

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


def parse_postgres_array(value) -> Optional[List[str]]:
    """Parse Postgres array format from Supabase response.
    Handles: None, [], ["a", "b"], "{a,b}", '["a","b"]' (JSON string), or "a,b" formats.
    Returns None for empty arrays (meaning "open to all").
    """
    import json
    if value is None:
        return None
    if isinstance(value, list):
        # Check if list contains a single JSON-encoded string (Supabase bug workaround)
        result = []
        for v in value:
            if isinstance(v, str) and v.startswith('[') and v.endswith(']'):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        result.extend(parsed)
                        continue
                except json.JSONDecodeError:
                    pass
            if v and str(v).strip():
                result.append(str(v).strip())
        return result if result else None
    if isinstance(value, str):
        value = value.strip()
        # Handle empty cases
        if not value or value == '{}' or value == '[]':
            return None
        # Handle JSON array string
        if value.startswith('[') and value.endswith(']'):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    filtered = [str(v).strip() for v in parsed if v and str(v).strip()]
                    return filtered if filtered else None
            except json.JSONDecodeError:
                pass
        # Handle Postgres array format {a,b,c}
        if value.startswith('{') and value.endswith('}'):
            inner = value[1:-1]
            if not inner:
                return None
            items = [item.strip().strip('"') for item in inner.split(',') if item.strip()]
            return items if items else None
        return [value]
    return None


def normalize_scholarship_data(data: dict) -> dict:
    """Normalize scholarship data from Supabase to ensure correct types."""
    if 'education_level' in data:
        data['education_level'] = parse_postgres_array(data.get('education_level'))
    return data


def parse_education_level_string(value) -> Optional[List[str]]:
    """Parse education_level from drafts which may be comma-separated strings."""
    if value is None:
        return None
    if isinstance(value, list):
        return value if value else None
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        # Handle Postgres array format
        if value.startswith('{') and value.endswith('}'):
            inner = value[1:-1]
            if not inner:
                return None
            items = [item.strip().strip('"') for item in inner.split(',')]
            return items if items else None
        # Handle comma-separated values like "A-Level, Undergraduate, Master's & PhD"
        if ',' in value:
            items = [item.strip() for item in value.split(',') if item.strip()]
            return items if items else None
        # Single value
        return [value]
    return None


def normalize_draft_data(data: dict) -> dict:
    """Normalize draft data from Supabase to ensure correct types."""
    if 'education_level' in data:
        data['education_level'] = parse_education_level_string(data.get('education_level'))
    return data


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


def ensure_columns():
    """Ensure new columns exist in the scholarships table."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS institution_type TEXT;
            ALTER TABLE scholarships ALTER COLUMN amount DROP NOT NULL;
            ALTER TABLE scholarships ALTER COLUMN deadline DROP NOT NULL;
        """)
        conn.commit()
        print("[DB] Ensured institution_type column exists.")
    except Exception as e:
        print(f"[DB] Column migration note: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


@app.on_event("startup")
def startup_event():
    try:
        ensure_columns()
    except Exception as e:
        print(f"[DB] Column migration warning: {e}")
    
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
def create_scholarship(
    scholarship: ScholarshipCreate,
    user: AuthUser = Depends(require_admin)
):
    """Create a new scholarship. Requires admin authentication."""
    data = scholarship.model_dump()
    
    # Convert date objects to ISO strings for Supabase
    if data.get("deadline"):
        data["deadline"] = str(data["deadline"])
    if data.get("opens_at"):
        data["opens_at"] = str(data["opens_at"])
    
    # Handle education_level: null means "open to all", convert to empty array for Supabase
    if data.get("education_level") is None:
        data["education_level"] = []
    
    # Core columns - these are the oldest and definitely in schema cache
    core_columns = ["title", "provider", "amount", "deadline", "education_level", "institution_type", "url", "tags"]
    
    # All other columns may or may not be in cache - update one at a time after insert
    extra_columns = [
        "detailed_description", "email", "scholarship_type", "place_of_study",
        "banner_image_url", "deadline_type", "opens_at",
        "study_areas", "min_cgpa", "min_spm_as", "household_income_max",
        "state_restriction", "is_bumiputera_only", "ai_matching_context",
        "min_muet", "min_ielts"
    ]
    
    # Build insert payload with core columns only (skip None values to avoid NOT NULL violations)
    insert_data = {}
    for col in core_columns:
        if col in data and data[col] is not None:
            insert_data[col] = data[col]
    
    result = supabase.table("scholarships").insert(insert_data).execute()
    
    if result.data:
        scholarship_data = result.data[0]
        scholarship_id = scholarship_data.get("id")
        
        # Update extra columns one at a time - use direct SQL fallback if REST API fails
        for col in extra_columns:
            if col in data and data[col] is not None:
                try:
                    supabase.table("scholarships").update({col: data[col]}).eq("id", scholarship_id).execute()
                except Exception as col_error:
                    print(f"Column '{col}' REST API failed (schema cache issue): {col_error}")
                    print(f"Trying direct SQL fallback for column '{col}'...")
                    update_column_direct_sql("scholarships", scholarship_id, col, data[col])
        
        # Generate embedding for the new scholarship
        try:
            text = create_scholarship_text(scholarship_data)
            embedding = generate_embedding(text)
            supabase.table("scholarships").update({"embedding": embedding}).eq("id", scholarship_id).execute()
            scholarship_data["embedding"] = embedding
        except Exception as embed_error:
            print(f"Warning: Failed to generate embedding for scholarship {scholarship_id}: {embed_error}")
        
        # Re-fetch to get all updated data
        final_result = supabase.table("scholarships").select("*").eq("id", scholarship_id).execute()
        if final_result.data:
            return normalize_scholarship_data(final_result.data[0])
        return normalize_scholarship_data(scholarship_data)
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
    return [normalize_scholarship_data(s) for s in result.data]


@app.get("/scholarships/{scholarship_id}", response_model=ScholarshipResponse)
def get_scholarship(scholarship_id: int):
    result = supabase.table("scholarships").select("*").eq("id", scholarship_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return normalize_scholarship_data(result.data[0])


@app.put("/scholarships/{scholarship_id}", response_model=ScholarshipResponse)
def update_scholarship(
    scholarship_id: int, 
    scholarship_data: ScholarshipCreate,
    user: AuthUser = Depends(require_admin)
):
    """Update a scholarship. Requires admin authentication."""
    existing = supabase.table("scholarships").select("id").eq("id", scholarship_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    data = scholarship_data.model_dump()
    
    # Convert date objects to ISO strings for Supabase
    if data.get("deadline"):
        data["deadline"] = str(data["deadline"])
    if data.get("opens_at"):
        data["opens_at"] = str(data["opens_at"])
    
    # Handle education_level: null means "open to all", convert to empty array for Supabase
    if data.get("education_level") is None:
        data["education_level"] = []
    
    # Core columns - these are the oldest and definitely in schema cache
    core_columns = ["title", "provider", "amount", "deadline", "education_level", "institution_type", "url", "tags"]
    
    # All other columns may or may not be in cache - update one at a time
    extra_columns = [
        "detailed_description", "email", "scholarship_type", "place_of_study",
        "banner_image_url", "deadline_type", "opens_at",
        "study_areas", "min_cgpa", "min_spm_as", "household_income_max",
        "state_restriction", "is_bumiputera_only", "ai_matching_context",
        "min_muet", "min_ielts"
    ]
    
    # Build core update payload
    core_update = {}
    for col in core_columns:
        if col in data:
            core_update[col] = data[col]
    
    # Update core columns first - this should definitely work
    if core_update:
        try:
            supabase.table("scholarships").update(core_update).eq("id", scholarship_id).execute()
        except Exception as e:
            print(f"Core update failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update scholarship: {str(e)}")
    
    # Update extra columns one at a time - use direct SQL fallback if REST API fails
    for col in extra_columns:
        if col in data:
            try:
                supabase.table("scholarships").update({col: data[col]}).eq("id", scholarship_id).execute()
            except Exception as col_error:
                print(f"Column '{col}' REST API failed (schema cache issue): {col_error}")
                print(f"Trying direct SQL fallback for column '{col}'...")
                update_column_direct_sql("scholarships", scholarship_id, col, data[col])
    
    # Fetch final result
    result = supabase.table("scholarships").select("*").eq("id", scholarship_id).execute()
    
    if result.data:
        updated_data = result.data[0]
        
        # Regenerate embedding when scholarship content changes
        try:
            text = create_scholarship_text(updated_data)
            embedding = generate_embedding(text)
            supabase.table("scholarships").update({"embedding": embedding}).eq("id", scholarship_id).execute()
            updated_data["embedding"] = embedding
        except Exception as embed_error:
            print(f"Warning: Failed to regenerate embedding for scholarship {scholarship_id}: {embed_error}")
        
        return normalize_scholarship_data(updated_data)
    raise HTTPException(status_code=500, detail="Failed to update scholarship")


@app.delete("/scholarships/{scholarship_id}")
def delete_scholarship(
    scholarship_id: int,
    user: AuthUser = Depends(require_admin)
):
    """Delete a scholarship. Requires admin authentication."""
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


# Household income bracket to RM conversion - use get_income_rm_value() from constants
# Legacy dict for backward compatibility
INCOME_BRACKET_RM = {
    "B40": 5250,    # Upper limit for B40
    "M40": 10959,   # Upper limit for M40  
    "T20": 50000    # High value for T20 (no real limit)
}


# ============================================================================
# STRICT MODE: EDUCATION PATHWAYS MAPPING
# Defines which education levels can match which scholarship levels
# ============================================================================

# User education level -> Allowed scholarship education levels
EDUCATION_PATHWAYS = {
    # SPM/O-Level students can only match pre-tertiary programs
    "SPM": ["Pre-U", "Foundation", "A-Levels", "Diploma", "Pre-University", "STPM", "Matriculation"],
    "O-Level": ["Pre-U", "Foundation", "A-Levels", "Diploma", "Pre-University", "STPM", "Matriculation"],
    "STPM": ["Pre-U", "Foundation", "A-Levels", "Diploma", "Pre-University", "Undergraduate", "Degree", "Bachelor"],
    
    # Diploma/Foundation students can only match undergraduate programs
    "Diploma": ["Undergraduate", "Degree", "Bachelor", "Bachelor's"],
    "Foundation": ["Undergraduate", "Degree", "Bachelor", "Bachelor's"],
    "A-Levels": ["Undergraduate", "Degree", "Bachelor", "Bachelor's"],
    "Pre-U": ["Undergraduate", "Degree", "Bachelor", "Bachelor's"],
    "Matriculation": ["Undergraduate", "Degree", "Bachelor", "Bachelor's"],
    
    # Degree students can only match postgraduate programs
    "Degree": ["Postgraduate", "Master", "Masters", "Master's", "PhD", "Doctorate", "Graduate"],
    "Undergraduate": ["Postgraduate", "Master", "Masters", "Master's", "PhD", "Doctorate", "Graduate"],
    "Bachelor": ["Postgraduate", "Master", "Masters", "Master's", "PhD", "Doctorate", "Graduate"],
    "Bachelor's": ["Postgraduate", "Master", "Masters", "Master's", "PhD", "Doctorate", "Graduate"],
    
    # Postgraduate students can match PhD/Doctorate
    "Master": ["PhD", "Doctorate", "Postdoctoral"],
    "Masters": ["PhD", "Doctorate", "Postdoctoral"],
    "Master's": ["PhD", "Doctorate", "Postdoctoral"],
    "Postgraduate": ["PhD", "Doctorate", "Postdoctoral"],
}


def normalize_education_level(level: str) -> str:
    """Normalize education level string for comparison."""
    if not level:
        return ""
    normalized = level.strip().lower()
    # Map common variations
    mappings = {
        "spm": "SPM",
        "o-level": "O-Level",
        "o level": "O-Level",
        "stpm": "STPM",
        "diploma": "Diploma",
        "foundation": "Foundation",
        "a-levels": "A-Levels",
        "a levels": "A-Levels",
        "a-level": "A-Levels",
        "pre-u": "Pre-U",
        "pre-university": "Pre-U",
        "matriculation": "Matriculation",
        "matrikulasi": "Matriculation",
        "degree": "Degree",
        "undergraduate": "Undergraduate",
        "bachelor": "Bachelor",
        "bachelor's": "Bachelor's",
        "bachelors": "Bachelor's",
        "postgraduate": "Postgraduate",
        "master": "Master",
        "masters": "Masters",
        "master's": "Master's",
        "phd": "PhD",
        "doctorate": "PhD",
    }
    return mappings.get(normalized, level.strip())


def check_education_pathway_eligibility(user_education: str, scholarship_education) -> tuple[bool, Optional[str]]:
    """
    Check if user's education level is eligible for the scholarship's target level.
    scholarship_education can be a string, list of strings, or None (open to all).
    Returns: (is_eligible, ineligibility_reason or None)
    """
    # If scholarship has no education level requirement (null/empty), it's open to all
    if not scholarship_education:
        return True, None
    
    if not user_education:
        return True, None  # If user education is missing, don't filter
    
    user_level = normalize_education_level(user_education)
    
    # Handle array of education levels
    if isinstance(scholarship_education, list):
        if len(scholarship_education) == 0:
            return True, None  # Empty array = open to all
        
        # Check if user's level matches any of the scholarship's accepted levels
        for level in scholarship_education:
            scholarship_level = normalize_education_level(level)
            allowed_levels = EDUCATION_PATHWAYS.get(user_level, [])
            
            if not allowed_levels:
                # Unknown user education level - check direct match
                if user_level.lower() in scholarship_level.lower() or scholarship_level.lower() in user_level.lower():
                    return True, None
                continue
            
            scholarship_lower = scholarship_level.lower()
            for allowed in allowed_levels:
                if allowed.lower() in scholarship_lower or scholarship_lower in allowed.lower():
                    return True, None
            
            # Also check if the exact user level is mentioned
            if user_level.lower() in scholarship_lower:
                return True, None
        
        return False, f"Education level mismatch: Your {user_level} level doesn't match {', '.join(scholarship_education)} scholarship"
    
    # Handle single string (legacy support)
    scholarship_level = normalize_education_level(scholarship_education)
    
    # Get allowed scholarship levels for this user's education
    allowed_levels = EDUCATION_PATHWAYS.get(user_level, [])
    
    if not allowed_levels:
        # Unknown user education level - allow matching to prevent false negatives
        return True, None
    
    # Check if scholarship level matches any allowed level (case-insensitive partial match)
    scholarship_lower = scholarship_level.lower()
    for allowed in allowed_levels:
        if allowed.lower() in scholarship_lower or scholarship_lower in allowed.lower():
            return True, None
    
    # Also check if the exact user level is mentioned in the scholarship level
    # (e.g., scholarship says "Diploma/Degree" and user is "Diploma")
    if user_level.lower() in scholarship_lower:
        return True, None
    
    return False, f"Education level mismatch: Your {user_level} level doesn't match {scholarship_education} scholarship"


def check_study_area_overlap(user_areas: List[str], scholarship_areas: List[str]) -> tuple[bool, Optional[str], float]:
    """
    Check if user's intended study areas overlap with scholarship's required areas.
    Returns: (is_eligible, ineligibility_reason or None, overlap_score)
    
    Now returns overlap_score (0.0 to 1.0) for "Generic Penalty" instead of hard fail.
    - 1.0 = full match or scholarship is open to all
    - 0.5 = user has no study areas (generic penalty)
    - 0.0 = no overlap between specific areas
    """
    # If scholarship has no specific study areas or is "General", allow all with full score
    if not scholarship_areas or scholarship_areas == ["General"]:
        return True, None, 1.0
    
    # Normalize scholarship areas
    scholarship_set = set(area.lower().strip() for area in scholarship_areas if area and area.lower() != "general")
    
    # If scholarship is actually general after filtering, allow with full score
    if not scholarship_set:
        return True, None, 1.0
    
    # If user has no study areas specified, apply "Generic Penalty" (50% score) instead of hard fail
    if not user_areas:
        return True, "Note: Your study areas aren't specified - consider updating your profile", 0.5
    
    # Normalize user areas for comparison
    user_set = set(area.lower().strip() for area in user_areas if area)
    
    # Check for any overlap
    overlap = user_set.intersection(scholarship_set)
    if overlap:
        # Calculate overlap percentage
        overlap_score = len(overlap) / len(scholarship_set)
        return True, None, min(1.0, overlap_score + 0.2)  # Boost partial matches slightly
    
    # No overlap - still eligible but with 0 study area score (will affect hybrid score)
    return False, f"Study area mismatch: Scholarship requires {', '.join(scholarship_areas)} but you're interested in {', '.join(user_areas)}", 0.0


def is_scholarship_expired(deadline: str) -> bool:
    """Check if scholarship deadline has passed."""
    if not deadline:
        return False
    try:
        from datetime import datetime
        deadline_date = datetime.strptime(str(deadline), "%Y-%m-%d").date()
        return deadline_date < datetime.now().date()
    except (ValueError, TypeError):
        return False


# ============================================================================
# CANDIDATE PERSONA GENERATION (GPT-4o)
# Creates a "Semantic Resume" for better embedding matching
# ============================================================================

def generate_candidate_persona(profile: dict) -> str:
    """
    Use GPT-4o to generate a structured Semantic Resume from user profile.
    Returns a structured persona string for embedding.
    """
    try:
        bio = profile.get("bio_achievements", "")
        education_level = profile.get("education_level", "")
        study_areas = profile.get("study_areas", [])
        state = profile.get("state", "")
        cgpa = profile.get("cgpa")
        spm_as = profile.get("spm_as")
        household_income = profile.get("household_income", "")
        is_bumiputera = profile.get("is_bumiputera", False)
        
        # Build context for GPT-4o
        context_parts = []
        if education_level:
            context_parts.append(f"Education Level: {education_level}")
        if study_areas:
            context_parts.append(f"Study Areas: {', '.join(study_areas)}")
        if state:
            context_parts.append(f"State: {state}")
        if cgpa:
            context_parts.append(f"CGPA: {cgpa}")
        if spm_as:
            context_parts.append(f"SPM A's: {spm_as}")
        if household_income:
            context_parts.append(f"Income Bracket: {household_income}")
        if is_bumiputera:
            context_parts.append("Bumiputera Status: Yes")
        
        context = "\n".join(context_parts)
        
        prompt = f"""Based on this student profile, create a structured "Semantic Resume" that captures their essence for scholarship matching.

PROFILE DATA:
{context}

BIO/ACHIEVEMENTS:
{bio}

OUTPUT FORMAT (fill in based on the profile):
"A [Education Level] student from [State] with a [CGPA level - high/good/moderate] academic background, focused on [Study Areas/Goals]. [Key achievements or characteristics]. [Financial or demographic context if relevant]."

Create a concise, impactful 1-2 sentence persona that captures the student's profile for scholarship matching. Focus on:
1. Educational stage and aspirations
2. Academic strengths
3. Key achievements or leadership qualities
4. Any special circumstances (financial need, demographic)

Output ONLY the persona string, nothing else."""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )
        
        persona = response.choices[0].message.content.strip()
        return persona if persona else create_fallback_persona(profile)
    except Exception as e:
        print(f"Error generating persona: {e}")
        return create_fallback_persona(profile)


def create_fallback_persona(profile: dict) -> str:
    """Create a simple persona when GPT-4o is unavailable."""
    parts = []
    
    education_level = profile.get("education_level", "")
    if education_level:
        parts.append(f"A {education_level} student")
    else:
        parts.append("A student")
    
    state = profile.get("state", "")
    if state:
        parts.append(f"from {state}")
    
    cgpa = profile.get("cgpa")
    if cgpa:
        if cgpa >= 3.5:
            parts.append("with excellent academic standing")
        elif cgpa >= 3.0:
            parts.append("with good academic performance")
        else:
            parts.append("with developing academic performance")
    
    study_areas = profile.get("study_areas", [])
    if study_areas:
        parts.append(f"focused on {', '.join(study_areas[:2])}")
    
    bio = profile.get("bio_achievements", "")
    if bio and len(bio) > 20:
        parts.append(f". {bio[:150]}")
    
    household_income = profile.get("household_income", "")
    if household_income == "B40":
        parts.append(". Demonstrates financial need")
    
    return " ".join(parts)


# ============================================================================
# HYBRID SCORING ALGORITHM
# Score = (0.5 × Similarity) + (0.3 × Academic_Weight) + (0.2 × SocioEconomic_Weight)
# ============================================================================

def calculate_academic_weight(profile: dict, scholarship: dict) -> float:
    """
    Calculate academic weight based on CGPA compared to scholarship requirements.
    Returns a normalized score between 0 and 1.
    """
    user_cgpa = profile.get("cgpa")
    min_cgpa = scholarship.get("min_cgpa")
    
    if user_cgpa is None:
        return 0.5  # Neutral if no CGPA provided
    
    if min_cgpa is None:
        # No minimum required - score based on absolute CGPA
        return min(user_cgpa / 4.0, 1.0)
    
    # Calculate how much user exceeds the minimum
    if user_cgpa >= min_cgpa:
        # Bonus for exceeding requirement
        excess = user_cgpa - min_cgpa
        base_score = 0.7  # Base for meeting requirement
        bonus = min(excess / 0.5, 0.3)  # Up to 0.3 bonus for exceeding by 0.5+
        return min(base_score + bonus, 1.0)
    else:
        # Below requirement - reduced score
        deficit = min_cgpa - user_cgpa
        return max(0.5 - (deficit * 0.5), 0.0)


def calculate_socioeconomic_weight(profile: dict, scholarship: dict) -> float:
    """
    Calculate socioeconomic weight based on B40 status and need-based scholarships.
    Returns a normalized score between 0 and 1.
    """
    user_income = profile.get("household_income", "")
    scholarship_income_max = scholarship.get("household_income_max")
    is_bumiputera = profile.get("is_bumiputera", False)
    scholarship_bumi_only = scholarship.get("is_bumiputera_only", False)
    
    score = 0.5  # Base score
    
    # B40 bonus for need-based scholarships
    if user_income == "B40":
        if scholarship_income_max is not None and scholarship_income_max <= 5000:
            score += 0.3  # Strong match for need-based
        else:
            score += 0.1  # Small bonus for B40 status
    elif user_income == "M40":
        score += 0.05  # Slight bonus for M40
    
    # Bumiputera match bonus
    if scholarship_bumi_only and is_bumiputera:
        score += 0.15  # Bonus for matching bumiputera requirement
    
    return min(score, 1.0)


def calculate_hybrid_score(
    similarity_score: float,
    profile: dict,
    scholarship: dict
) -> tuple[float, dict]:
    """
    Calculate the final hybrid match score using weighted formula.
    Score = (0.5 × Similarity) + (0.3 × Academic_Weight) + (0.2 × SocioEconomic_Weight)
    
    Returns: (final_score, score_breakdown_dict)
    """
    academic_weight = calculate_academic_weight(profile, scholarship)
    socioeconomic_weight = calculate_socioeconomic_weight(profile, scholarship)
    
    # Apply the weighted formula
    weighted_similarity = similarity_score * 0.5
    weighted_academic = academic_weight * 0.3
    weighted_socioeconomic = socioeconomic_weight * 0.2
    
    final_score = weighted_similarity + weighted_academic + weighted_socioeconomic
    
    breakdown = {
        "similarity_component": round(weighted_similarity * 100, 1),
        "academic_component": round(weighted_academic * 100, 1),
        "socioeconomic_component": round(weighted_socioeconomic * 100, 1),
        "raw_similarity": round(similarity_score * 100, 1),
        "academic_weight": round(academic_weight * 100, 1),
        "socioeconomic_weight": round(socioeconomic_weight * 100, 1)
    }
    
    return final_score, breakdown


def generate_match_reasons(profile: dict, scholarship: dict, is_eligible: bool) -> List[str]:
    """
    Generate detailed, human-readable match reasons explaining why this scholarship matches.
    Provides specific values when available for better transparency.
    """
    reasons = []
    
    # Education level match with specifics
    user_edu = profile.get("education_level", "")
    scholarship_edu = scholarship.get("education_level", "")
    if is_eligible and user_edu and scholarship_edu:
        reasons.append(f"Your {user_edu} level qualifies for {scholarship_edu} scholarships")
    
    # Study area match with specifics
    user_areas = profile.get("study_areas", [])
    scholarship_areas = scholarship.get("study_areas", [])
    if user_areas and scholarship_areas:
        user_set = set(a.lower() for a in user_areas)
        scholarship_set = set(a.lower() for a in scholarship_areas if a.lower() != "general")
        overlap = user_set.intersection(scholarship_set)
        if overlap:
            matched_areas = [a.title() for a in list(overlap)[:2]]
            if len(matched_areas) == 1:
                reasons.append(f"Your {matched_areas[0]} field matches this scholarship")
            else:
                reasons.append(f"Your interests in {' and '.join(matched_areas)} align with this scholarship")
    
    # CGPA match with specifics
    user_cgpa = profile.get("cgpa")
    min_cgpa = scholarship.get("min_cgpa")
    if user_cgpa and min_cgpa:
        if user_cgpa >= min_cgpa + 0.5:
            reasons.append(f"Your CGPA ({user_cgpa:.2f}) significantly exceeds minimum ({min_cgpa:.2f})")
        elif user_cgpa >= min_cgpa + 0.2:
            reasons.append(f"Your CGPA ({user_cgpa:.2f}) comfortably exceeds minimum ({min_cgpa:.2f})")
        elif user_cgpa >= min_cgpa:
            reasons.append(f"Your CGPA ({user_cgpa:.2f}) meets the minimum requirement ({min_cgpa:.2f})")
    
    # SPM A's match with specifics
    user_spm = profile.get("spm_as")
    min_spm = scholarship.get("min_spm_as")
    if user_spm and min_spm:
        if user_spm >= min_spm + 2:
            reasons.append(f"Your {user_spm} SPM A's exceed the requirement ({min_spm})")
        elif user_spm >= min_spm:
            reasons.append(f"Your {user_spm} SPM A's meet the requirement ({min_spm})")
    
    # B40 status match with specifics
    income_bracket = profile.get("household_income", "")
    income_max = scholarship.get("household_income_max")
    if income_bracket == "B40" and income_max:
        reasons.append(f"Prioritizes B40 households (income under RM {int(income_max):,}/month)")
    elif income_bracket in ["B40", "M40"] and income_max and income_max >= 5000:
        reasons.append("Income bracket qualifies for this need-based scholarship")
    
    # Bumiputera match
    if scholarship.get("is_bumiputera_only") and profile.get("is_bumiputera"):
        reasons.append("Open to Bumiputera applicants like you")
    
    # State match with specifics
    user_state = profile.get("state")
    state_req = scholarship.get("state_restriction")
    if state_req and user_state == state_req:
        reasons.append(f"Reserved for {user_state} residents")
    elif not state_req:
        reasons.append("Open to students from all Malaysian states")
    
    # English proficiency match
    user_muet = profile.get("muet_band")
    user_ielts = profile.get("ielts_score")
    min_muet = scholarship.get("min_muet")
    min_ielts = scholarship.get("min_ielts")
    if user_muet and min_muet and user_muet >= min_muet:
        reasons.append(f"Your MUET Band {int(user_muet)} meets requirement (Band {int(min_muet)})")
    elif user_ielts and min_ielts and user_ielts >= min_ielts:
        reasons.append(f"Your IELTS {user_ielts} meets requirement ({min_ielts})")
    
    # Semantic profile match (fallback or addition)
    if len(reasons) < 2:
        reasons.append("Your profile description aligns with this scholarship's goals")
    
    return reasons[:5]  # Limit to top 5 most relevant reasons


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
def create_user_profile(
    profile: UserProfileCreate,
    user: Optional[AuthUser] = Depends(get_optional_user)
):
    """Create a new user profile and generate embedding.
    
    If user is authenticated, links profile to their auth_user_id.
    This allows profiles to persist across sessions.
    """
    try:
        data = profile.model_dump()
        
        # Link to authenticated user if available
        print(f"[Profile] Creating profile, user authenticated: {user is not None}")
        if user:
            print(f"[Profile] Linking profile to auth_user_id: {user.user_id}")
            data["auth_user_id"] = user.user_id
        else:
            print("[Profile] WARNING: No authenticated user, profile will not be linked to account")
        
        # Generate embedding from profile data
        profile_text = create_profile_text(data)
        embedding = generate_embedding(profile_text)
        data["embedding"] = embedding
        
        # Convert income bracket to numeric RM value for matching
        if data.get("household_income"):
            data["household_income_value"] = get_income_rm_value(data["household_income"])
        
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


@app.get("/profiles/me/current", response_model=UserProfileResponse)
def get_my_profile(user: AuthUser = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    result = supabase.table("user_profiles").select("*").eq("auth_user_id", user.user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding first.")
    
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
def match_with_profile(
    request: UserProfileMatchRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    STRICT MODE Magic Match - Match scholarships using stored profile.
    
    **PREMIUM FEATURE** - Requires active premium subscription.
    
    Applies strict eligibility filters in this order:
    1. Expired scholarship exclusion
    2. Education pathway alignment
    3. Study area overlap (0% if no match)
    4. CGPA, SPM A's, income, state, Bumiputera, English requirements
    
    Then calculates hybrid score:
    Score = (0.5 x Similarity) + (0.3 x Academic) + (0.2 x SocioEconomic)
    """
    # Check premium subscription
    if not is_premium_user(user.user_id):
        raise HTTPException(
            status_code=403, 
            detail="AI Matching is a premium feature. Please upgrade to access personalized scholarship matching."
        )
    
    # Get profile from database
    profile_result = supabase.table("user_profiles").select("*").eq("id", request.profile_id).execute()
    
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = profile_result.data[0]
    
    if not profile.get("embedding"):
        raise HTTPException(status_code=400, detail="Profile has no embedding. Please recreate your profile.")
    
    # Convert household income bracket to RM value for comparison
    # First try to use stored numeric value, fallback to bracket conversion
    household_income_rm = profile.get("household_income_value") or get_income_rm_value(profile.get("household_income", ""))
    
    try:
        # Handle embedding format - it may come as string or list from Supabase
        embedding_data = profile["embedding"]
        if isinstance(embedding_data, str):
            embedding_str = embedding_data
        elif isinstance(embedding_data, list):
            embedding_str = "[" + ",".join(map(str, embedding_data)) + "]"
        else:
            raise HTTPException(status_code=500, detail="Invalid embedding format in profile")
        
        result = supabase.rpc(
            "match_scholarships",
            {
                "query_embedding": embedding_str,
                "match_count": request.limit * 5  # Fetch more to account for filtering
            }
        ).execute()
        
        if not result.data:
            return []
        
        matches = []
        for row in result.data:
            is_eligible = True
            ineligibility_reasons = []
            eligibility_badges = {}
            
            # ============ STRICT MODE GATEKEEPER FILTERS ============
            
            # 1. EXPIRED SCHOLARSHIP CHECK
            if is_scholarship_expired(row.get("deadline")):
                continue  # Skip expired scholarships entirely
            
            # 2. EDUCATION PATHWAY CHECK (Strict)
            scholarship_edu_level = parse_postgres_array(row.get("education_level"))
            edu_eligible, edu_reason = check_education_pathway_eligibility(
                profile.get("education_level"),
                scholarship_edu_level
            )
            if not edu_eligible:
                is_eligible = False
                ineligibility_reasons.append(edu_reason)
                eligibility_badges["education"] = "Mismatch"
            else:
                eligibility_badges["education"] = "Match"
            
            # 3. STUDY AREA OVERLAP CHECK (Generic Penalty instead of hard fail)
            study_eligible, study_reason, study_overlap_score = check_study_area_overlap(
                profile.get("study_areas", []),
                row.get("study_areas", [])
            )
            if not study_eligible:
                # No overlap - mark as ineligible but include in results with reason
                is_eligible = False
                ineligibility_reasons.append(study_reason)
                eligibility_badges["study_area"] = "Mismatch"
            elif study_overlap_score < 1.0:
                # Partial match or generic penalty - still eligible but note it
                if study_reason:
                    ineligibility_reasons.append(study_reason)
                eligibility_badges["study_area"] = "Partial" if study_overlap_score > 0.5 else "Generic"
            else:
                eligibility_badges["study_area"] = "Match"
            
            # ============ STANDARD ELIGIBILITY FILTERS ============
            
            # 4. CGPA check
            if profile.get("cgpa") is not None and row.get("min_cgpa") is not None:
                if profile["cgpa"] < row["min_cgpa"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Requires minimum CGPA of {row['min_cgpa']}")
                    eligibility_badges["cgpa"] = "Below Required"
                else:
                    eligibility_badges["cgpa"] = "Match"
            
            # 5. SPM A's check
            if profile.get("spm_as") is not None and row.get("min_spm_as") is not None:
                if profile["spm_as"] < row["min_spm_as"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Requires minimum {row['min_spm_as']} A's in SPM")
                    eligibility_badges["spm"] = "Below Required"
                else:
                    eligibility_badges["spm"] = "Match"
            
            # 6. Household income check (convert bracket to RM)
            if household_income_rm is not None and row.get("household_income_max") is not None:
                if household_income_rm > row["household_income_max"]:
                    is_eligible = False
                    ineligibility_reasons.append(f"Household income exceeds RM {row['household_income_max']:,.0f} limit")
                    eligibility_badges["income"] = "Exceeds Limit"
                else:
                    eligibility_badges["income"] = "Match"
            
            # 7. State restriction check
            if row.get("state_restriction"):
                if profile.get("state") and profile["state"] == row["state_restriction"]:
                    eligibility_badges["state"] = "Match"
                elif profile.get("state"):
                    is_eligible = False
                    ineligibility_reasons.append(f"Restricted to {row['state_restriction']} residents")
                    eligibility_badges["state"] = "Mismatch"
            
            # 8. Bumiputera check
            if row.get("is_bumiputera_only"):
                if profile.get("is_bumiputera"):
                    eligibility_badges["bumiputera"] = "Match"
                else:
                    is_eligible = False
                    ineligibility_reasons.append("Restricted to Bumiputera applicants")
                    eligibility_badges["bumiputera"] = "Required"
            
            # 9. English proficiency check using equivalence engine
            english_eligible, english_reason = check_english_eligibility(profile, row)
            if not english_eligible:
                is_eligible = False
                if english_reason:
                    ineligibility_reasons.append(english_reason)
                eligibility_badges["english"] = "Below Required"
            elif row.get("min_muet") or row.get("min_ielts") or row.get("min_spm_english"):
                eligibility_badges["english"] = "Match"
            
            # ============ HYBRID SCORING ============
            
            raw_similarity = row.get("similarity", 0)
            
            if is_eligible:
                # Calculate hybrid score for eligible candidates
                hybrid_score, score_breakdown = calculate_hybrid_score(raw_similarity, profile, row)
                match_score = round(hybrid_score * 100, 1)
                match_reasons = generate_match_reasons(profile, row, is_eligible)
            else:
                # Ineligible candidates get 0% match score
                match_score = 0.0
                score_breakdown = None
                match_reasons = None
            
            matches.append(ScholarshipMatchResponse(
                id=row["id"],
                title=row["title"],
                provider=row["provider"],
                amount=row["amount"],
                deadline=row["deadline"],
                education_level=parse_postgres_array(row.get("education_level")),
                url=row.get("url"),
                tags=parse_postgres_array(row.get("tags")),
                study_areas=parse_postgres_array(row.get("study_areas")),
                min_cgpa=row.get("min_cgpa"),
                min_spm_as=row.get("min_spm_as"),
                household_income_max=row.get("household_income_max"),
                state_restriction=row.get("state_restriction"),
                is_bumiputera_only=row.get("is_bumiputera_only", False),
                min_muet=row.get("min_muet"),
                min_ielts=row.get("min_ielts"),
                min_spm_english=row.get("min_spm_english"),
                similarity_score=raw_similarity if is_eligible else 0,
                match_score=match_score,
                is_eligible=is_eligible,
                ineligibility_reasons=ineligibility_reasons if ineligibility_reasons else None,
                match_reasons=match_reasons,
                score_breakdown=score_breakdown,
                eligibility_badges=eligibility_badges
            ))
        
        # Sort: eligible first (by hybrid match_score), then ineligible
        matches.sort(key=lambda x: (not x.is_eligible, -(x.match_score or 0)))
        
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
                education_level=parse_postgres_array(row.get("education_level")),
                url=row.get("url"),
                tags=parse_postgres_array(row.get("tags")),
                study_areas=parse_postgres_array(row.get("study_areas")),
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
def chat_with_coach(
    request: ChatRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    Socratic Mentor chat for essay guidance.
    
    **PREMIUM FEATURE** - Requires active premium subscription.
    """
    # Check premium subscription
    if not is_premium_user(user.user_id):
        raise HTTPException(
            status_code=403, 
            detail="Socratic Mentor is a premium feature. Please upgrade to access AI-powered essay guidance."
        )
    
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
- study_areas: Array from {STUDY_AREAS}. Set to null if not specified (open to all fields)
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
async def scrape_scholarship_urls(
    request: ScrapeRequest,
    user: AuthUser = Depends(require_admin)
):
    """Scrape scholarship data from URLs. Requires admin authentication."""
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
        if study_areas and len(study_areas) > 0:
            study_areas = [area for area in study_areas if area in STUDY_AREAS]
            if not study_areas:
                study_areas = None  # Keep as null if no valid areas
        else:
            study_areas = None  # Allow null - open to all study areas
        
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
def list_drafts(
    status: Optional[str] = Query("pending", description="Filter by status: pending, approved, rejected"),
    user: AuthUser = Depends(require_admin)
):
    """List scholarship drafts. Requires admin authentication."""
    try:
        q = supabase.table("scholarship_drafts").select("*")
        if status:
            q = q.eq("status", status)
        q = q.order("id", desc=True)
        
        result = q.execute()
        return [normalize_draft_data(d) for d in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch drafts: {str(e)}")


@app.put("/admin/drafts/{draft_id}", response_model=DraftResponse)
def update_draft(
    draft_id: int, 
    update_data: DraftUpdateRequest,
    user: AuthUser = Depends(require_admin)
):
    """Update a scholarship draft. Requires admin authentication."""
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
                update_dict["study_areas"] = areas if areas else None
            else:
                update_dict["study_areas"] = None  # Allow null - open to all fields
        
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
            return normalize_draft_data(draft_result.data[0])
        
        result = supabase.table("scholarship_drafts").update(update_dict).eq("id", draft_id).execute()
        
        if result.data:
            return normalize_draft_data(result.data[0])
        raise HTTPException(status_code=500, detail="Failed to update draft")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update draft: {str(e)}")


@app.post("/admin/drafts/{draft_id}/publish", response_model=PublishResponse)
def publish_draft(
    draft_id: int,
    user: AuthUser = Depends(require_admin)
):
    """Publish a draft to scholarships. Requires admin authentication."""
    try:
        draft_result = supabase.table("scholarship_drafts").select("*").eq("id", draft_id).execute()
        
        if not draft_result.data:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        draft = draft_result.data[0]
        
        if draft["status"] != "pending":
            raise HTTPException(status_code=400, detail=f"Draft is already {draft['status']}")
        
        # Parse education_level from draft (may be comma-separated string)
        education_level = parse_education_level_string(draft.get("education_level"))
        # Convert null to empty array for scholarships table (NOT NULL constraint)
        education_level = education_level if education_level else []
        
        scholarship_data = {
            "title": draft["title"] or "Untitled Scholarship",
            "provider": draft["provider"] or "Unknown Provider",
            "amount": draft["amount"] or "Contact provider",
            "deadline": draft["deadline"] or "2025-12-31",
            "education_level": education_level,  # Empty array = open to all
            "url": draft["url"],
            "tags": [],
            "study_areas": draft.get("study_areas"),  # Allow null - matches all areas
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
def reject_draft(
    draft_id: int,
    user: AuthUser = Depends(require_admin)
):
    """Reject a draft. Requires admin authentication."""
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


# ============================================================================
# SUBSCRIPTION / PREMIUM TIER ENDPOINTS
# ============================================================================

def get_user_subscription(auth_user_id: str) -> dict:
    """Helper function to get or create a user's subscription record."""
    result = supabase.table("subscriptions").select("*").eq("auth_user_id", auth_user_id).execute()
    
    if result.data:
        sub = result.data[0]
        # Check if subscription is expired
        if sub.get("expires_at"):
            expires_at = datetime.fromisoformat(sub["expires_at"].replace("Z", "+00:00"))
            if expires_at < datetime.now(expires_at.tzinfo):
                # Subscription expired - update status
                supabase.table("subscriptions").update({
                    "status": "expired",
                    "tier": "free"
                }).eq("id", sub["id"]).execute()
                sub["status"] = "expired"
                sub["tier"] = "free"
        return sub
    
    # Create a new free subscription for this user
    new_sub = {
        "auth_user_id": auth_user_id,
        "tier": "free",
        "status": "active"
    }
    result = supabase.table("subscriptions").insert(new_sub).execute()
    return result.data[0] if result.data else new_sub


def is_premium_user(auth_user_id: str) -> bool:
    """Check if a user has an active premium subscription."""
    sub = get_user_subscription(auth_user_id)
    return sub.get("tier") == "premium" and sub.get("status") == "active"


@app.get("/api/subscription/status", response_model=SubscriptionResponse)
def get_subscription_status(user: AuthUser = Depends(get_current_user)):
    """Get the current user's subscription status."""
    sub = get_user_subscription(user.user_id)
    
    is_premium = sub.get("tier") == "premium" and sub.get("status") == "active"
    
    return SubscriptionResponse(
        id=sub.get("id", 0),
        auth_user_id=sub.get("auth_user_id", user.user_id),
        tier=sub.get("tier", "free"),
        status=sub.get("status", "active"),
        expires_at=sub.get("expires_at"),
        payment_reference=sub.get("payment_reference"),
        is_premium=is_premium
    )


@app.get("/api/subscription/check-feature/{feature_name}", response_model=FeatureAccessResponse)
def check_feature_access(
    feature_name: str,
    user: AuthUser = Depends(get_current_user)
):
    """Check if the user has access to a specific feature.
    
    Premium features:
    - ai_matching: AI-powered scholarship matching
    - ai_mentor: Socratic Mentor chat assistance
    - priority_support: Priority customer support
    """
    PREMIUM_FEATURES = ["ai_matching", "ai_mentor", "priority_support"]
    
    sub = get_user_subscription(user.user_id)
    tier = sub.get("tier", "free")
    is_premium = tier == "premium" and sub.get("status") == "active"
    
    if feature_name in PREMIUM_FEATURES:
        if is_premium:
            return FeatureAccessResponse(
                has_access=True,
                tier=tier,
                message="Feature available",
                upgrade_required=False
            )
        else:
            return FeatureAccessResponse(
                has_access=False,
                tier=tier,
                message=f"'{feature_name}' is a premium feature. Upgrade to access.",
                upgrade_required=True
            )
    
    # Feature is free for all
    return FeatureAccessResponse(
        has_access=True,
        tier=tier,
        message="Feature available",
        upgrade_required=False
    )


TOYYIBPAY_SECRET_KEY = os.getenv("TOYYIBPAY_SECRET_KEY", "")
TOYYIBPAY_CATEGORY_CODE = os.getenv("TOYYIBPAY_CATEGORY_CODE", "")
TOYYIBPAY_API_URL = os.getenv("TOYYIBPAY_API_URL", "https://toyyibpay.com")
PREMIUM_PRICE_RM = 10
PREMIUM_PRICE_CENTS = PREMIUM_PRICE_RM * 100


@app.post("/api/subscription/create-bill")
async def create_toyyibpay_bill(
    request: Request,
    user: AuthUser = Depends(get_current_user)
):
    """
    Create a ToyyibPay bill for premium subscription.
    Returns the payment URL for the user to complete payment.
    """
    if not TOYYIBPAY_SECRET_KEY or not TOYYIBPAY_CATEGORY_CODE:
        raise HTTPException(status_code=500, detail="Payment system not configured")

    body = await request.json()
    bill_name = body.get("bill_name", "Ascendia Premium")
    bill_email = body.get("email", user.email or "")
    bill_phone = body.get("phone", "")
    bill_name_customer = body.get("name", "")

    app_url = os.getenv("REPLIT_DEV_DOMAIN", "")
    if app_url and not app_url.startswith("http"):
        app_url = f"https://{app_url}"
    
    deployed_url = os.getenv("REPLIT_DEPLOYMENT_URL", "")
    if deployed_url and not deployed_url.startswith("http"):
        deployed_url = f"https://{deployed_url}"

    public_url = os.getenv("PUBLIC_APP_URL", "")
    base_url = public_url or deployed_url or app_url

    if not base_url:
        raise HTTPException(status_code=500, detail="Application URL not configured. Cannot create payment bill.")

    return_url = f"{base_url}/payment-status"
    callback_url = f"{base_url}/api/subscription/webhook/toyyibpay"

    bill_data = {
        "userSecretKey": TOYYIBPAY_SECRET_KEY,
        "categoryCode": TOYYIBPAY_CATEGORY_CODE,
        "billName": bill_name[:30],
        "billDescription": "Ascendia Premium 1 Month"[:100],
        "billPriceSetting": 1,
        "billPayorInfo": 1,
        "billAmount": str(PREMIUM_PRICE_CENTS),
        "billReturnUrl": return_url,
        "billCallbackUrl": callback_url,
        "billExternalReferenceNo": user.user_id,
        "billTo": bill_name_customer[:100] if bill_name_customer else bill_email[:100],
        "billEmail": bill_email,
        "billPhone": bill_phone or "0000000000",
        "billPaymentChannel": "0",
        "billChargeToCustomer": "2",
    }

    print(f"[ToyyibPay] Creating bill for user {user.user_id}, callback: {callback_url}, return: {return_url}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TOYYIBPAY_API_URL}/index.php/api/createBill",
                data=bill_data,
                timeout=30.0
            )
            
            print(f"[ToyyibPay] API response status: {response.status_code}")
            print(f"[ToyyibPay] API response body: {response.text}")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"ToyyibPay API error: {response.status_code}"
                )
            
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0 and "BillCode" in result[0]:
                bill_code = result[0]["BillCode"]
                payment_url = f"{TOYYIBPAY_API_URL}/{bill_code}"
                return {
                    "bill_code": bill_code,
                    "payment_url": payment_url,
                }
            else:
                print(f"[ToyyibPay] Unexpected response: {result}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Unexpected response from ToyyibPay: {result}"
                )
    except httpx.RequestError as e:
        print(f"[ToyyibPay] Request error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to connect to ToyyibPay: {str(e)}")


@app.api_route("/api/subscription/webhook/toyyibpay", methods=["GET", "POST"])
async def toyyibpay_webhook(request: Request):
    """
    Webhook endpoint for ToyyibPay payment callbacks.
    ToyyibPay may send data as query parameters (GET) or form-encoded POST body.
    This handler supports both formats.
    
    Status codes from ToyyibPay:
    - '1': Success
    - '2': Pending
    - '3': Failed
    """
    query_params = dict(request.query_params)
    
    form_params = {}
    if request.method == "POST":
        try:
            form_data = await request.form()
            form_params = dict(form_data)
        except Exception:
            pass
    
    params = {**query_params, **form_params}
    
    print(f"[ToyyibPay Webhook] Raw query_params: {query_params}")
    print(f"[ToyyibPay Webhook] Raw form_params: {form_params}")
    print(f"[ToyyibPay Webhook] Merged params: {params}")
    
    refno = params.get("refno", "")
    status = params.get("status", "")
    billcode = params.get("billcode", "")
    order_id = params.get("order_id", "")
    amount = params.get("amount", "")
    transaction_id = params.get("transaction_id", "")
    
    print(f"[ToyyibPay Webhook] Parsed: billcode={billcode}, status={status}, order_id={order_id}, refno={refno}")
    
    if str(status) != "1":
        print(f"[ToyyibPay Webhook] Payment not successful, status: {status}")
        return {"status": "ignored", "message": "Payment not successful"}
    
    auth_user_id = order_id
    
    if not auth_user_id:
        print("[ToyyibPay Webhook] No order_id (auth_user_id) received")
        return {"status": "error", "message": "Missing order_id"}
    
    if not billcode:
        print("[ToyyibPay Webhook] No billcode received")
        return {"status": "error", "message": "Missing billcode"}
    
    try:
        async with httpx.AsyncClient() as client:
            verify_response = await client.post(
                f"{TOYYIBPAY_API_URL}/index.php/api/getBillTransactions",
                data={"billCode": billcode, "billpaymentStatus": "1"},
                timeout=15.0
            )
            if verify_response.status_code == 200:
                txns = verify_response.json()
                if isinstance(txns, list) and len(txns) > 0:
                    verified_ref = txns[0].get("billExternalReferenceNo", "")
                    if verified_ref and verified_ref != auth_user_id:
                        print(f"[ToyyibPay Webhook] order_id mismatch: callback={auth_user_id}, verified={verified_ref}")
                        auth_user_id = verified_ref
                    print(f"[ToyyibPay Webhook] Payment verified via ToyyibPay API for billcode: {billcode}")
                else:
                    print(f"[ToyyibPay Webhook] Warning: No successful transactions found for billcode: {billcode}, proceeding anyway")
            else:
                print(f"[ToyyibPay Webhook] Warning: Could not verify with ToyyibPay API (status {verify_response.status_code}), proceeding with callback data")
    except Exception as verify_err:
        print(f"[ToyyibPay Webhook] Warning: Verification request failed: {verify_err}, proceeding with callback data")
    
    try:
        expires_at = datetime.now() + timedelta(days=30)
        
        existing = supabase.table("subscriptions").select("id").eq("auth_user_id", auth_user_id).execute()
        
        subscription_data = {
            "tier": "premium",
            "status": "active",
            "expires_at": expires_at.isoformat(),
            "payment_reference": billcode,
            "payment_provider": "toyyibpay",
            "amount_paid": float(amount) if amount else PREMIUM_PRICE_RM,
            "updated_at": datetime.now().isoformat()
        }
        
        if existing.data:
            supabase.table("subscriptions").update(subscription_data).eq("auth_user_id", auth_user_id).execute()
        else:
            subscription_data["auth_user_id"] = auth_user_id
            supabase.table("subscriptions").insert(subscription_data).execute()
        
        print(f"[ToyyibPay Webhook] Subscription activated for user: {auth_user_id}")
        return {"status": "success", "message": "Subscription activated"}
        
    except Exception as e:
        print(f"[ToyyibPay Webhook] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process webhook: {str(e)}")


@app.post("/api/subscription/activate-manual")
def activate_subscription_manual(
    request: SubscriptionCreateRequest,
    user: AuthUser = Depends(require_admin)
):
    """
    Manually activate a subscription (admin only).
    Useful for testing or manual upgrades.
    """
    # For manual activation, use the payment_reference to find the user
    # or we could accept auth_user_id directly
    
    expires_at = datetime.now() + timedelta(days=30 * request.duration_months)
    
    subscription_data = {
        "tier": "premium",
        "status": "active",
        "expires_at": expires_at.isoformat(),
        "payment_reference": request.payment_reference,
        "payment_provider": "manual",
        "amount_paid": request.amount_paid,
        "currency": "MYR",
        "updated_at": datetime.now().isoformat()
    }
    
    return {
        "message": "Use this endpoint with auth_user_id to manually activate subscriptions",
        "data": subscription_data
    }


@app.post("/api/subscription/activate/{auth_user_id}")
def activate_user_subscription(
    auth_user_id: str,
    duration_months: int = 1,
    user: AuthUser = Depends(require_admin)
):
    """
    Activate premium subscription for a specific user (admin only).
    """
    expires_at = datetime.now() + timedelta(days=30 * duration_months)
    
    existing = supabase.table("subscriptions").select("id").eq("auth_user_id", auth_user_id).execute()
    
    subscription_data = {
        "tier": "premium",
        "status": "active",
        "expires_at": expires_at.isoformat(),
        "payment_provider": "admin_activated",
        "updated_at": datetime.now().isoformat()
    }
    
    if existing.data:
        supabase.table("subscriptions").update(subscription_data).eq("auth_user_id", auth_user_id).execute()
    else:
        subscription_data["auth_user_id"] = auth_user_id
        subscription_data["created_at"] = datetime.now().isoformat()
        supabase.table("subscriptions").insert(subscription_data).execute()
    
    return {
        "message": f"Premium subscription activated for {duration_months} month(s)",
        "expires_at": expires_at.isoformat()
    }


@app.post("/api/subscription/deactivate/{auth_user_id}")
def deactivate_user_subscription(
    auth_user_id: str,
    user: AuthUser = Depends(require_admin)
):
    """
    Deactivate premium subscription for a specific user (admin only).
    Reverts the user to the free tier.
    """
    existing = supabase.table("subscriptions").select("id").eq("auth_user_id", auth_user_id).execute()
    
    if not existing.data:
        raise HTTPException(status_code=404, detail="No subscription found for this user")
    
    supabase.table("subscriptions").update({
        "tier": "free",
        "status": "cancelled",
        "updated_at": datetime.now().isoformat()
    }).eq("auth_user_id", auth_user_id).execute()
    
    return {"message": "Subscription deactivated, user reverted to free tier"}


@app.get("/api/admin/users")
def list_users_with_subscriptions(
    user: AuthUser = Depends(require_admin)
):
    """
    List all auth users with their subscription status (admin only).
    Uses Supabase admin API to list users.
    """
    try:
        users_response = supabase.auth.admin.list_users()
        users_list = users_response if isinstance(users_response, list) else getattr(users_response, 'users', [])
        
        all_subs = supabase.table("subscriptions").select("*").execute()
        sub_map = {}
        for s in (all_subs.data or []):
            sub_map[s["auth_user_id"]] = s
        
        result = []
        for u in users_list:
            uid = u.id if hasattr(u, 'id') else u.get('id', '')
            email = u.email if hasattr(u, 'email') else u.get('email', '')
            created = u.created_at if hasattr(u, 'created_at') else u.get('created_at', '')
            
            sub = sub_map.get(uid, None)
            tier = sub.get("tier", "free") if sub else "free"
            status = sub.get("status", "none") if sub else "none"
            expires_at = sub.get("expires_at") if sub else None
            
            if tier == "premium" and status == "active" and expires_at:
                try:
                    exp = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
                    if exp < datetime.now(exp.tzinfo):
                        tier = "free"
                        status = "expired"
                except Exception:
                    pass
            
            result.append({
                "id": uid,
                "email": email,
                "created_at": str(created),
                "tier": tier,
                "subscription_status": status,
                "expires_at": str(expires_at) if expires_at else None,
            })
        
        result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {"users": result, "total": len(result)}
    except Exception as e:
        print(f"[Admin Users] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")

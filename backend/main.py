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
    PublishResponse,
    ScholarshipList
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
    ]
    if scholarship.get("tags"):
        parts.extend(scholarship["tags"])
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
            "tags": ["full-ride", "overseas", "merit-based"]
        },
        {
            "title": "Maybank Group Scholarship Programme",
            "provider": "Maybank Foundation",
            "amount": "RM 40,000/year",
            "deadline": "2025-04-15",
            "education_level": "Undergraduate",
            "url": "https://www.maybank.com/scholarship",
            "tags": ["banking", "finance", "local"]
        },
        {
            "title": "JPA PIDN Scholarship",
            "provider": "Public Service Department",
            "amount": "Full Coverage",
            "deadline": "2025-05-01",
            "education_level": "Degree",
            "url": "https://www.jpa.gov.my/",
            "tags": ["government", "full-coverage", "bonded"]
        },
        {
            "title": "Shell Malaysia Scholarship",
            "provider": "Shell Malaysia",
            "amount": "RM 12,000 + Internship",
            "deadline": "2025-02-28",
            "education_level": "Undergraduate",
            "url": "https://www.shell.com.my/careers/scholarships.html",
            "tags": ["engineering", "oil-gas", "internship"]
        },
        {
            "title": "The Star Education Fund",
            "provider": "The Star",
            "amount": "Tuition Fee Waiver",
            "deadline": "2025-06-30",
            "education_level": "Diploma/Degree",
            "url": "https://www.thestar.com.my/education",
            "tags": ["media", "journalism", "local"]
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
    profile_text = request.bio
    if request.education_level:
        profile_text += f" Education level: {request.education_level}."
    if request.field_of_study:
        profile_text += f" Field of study: {request.field_of_study}."
    
    try:
        embedding = generate_embedding(profile_text)
        return ProfileSyncResponse(
            embedding=embedding,
            message="Profile embedding generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


@app.post("/scholarships/match", response_model=List[ScholarshipMatchResponse])
def match_scholarships(request: MatchRequest):
    try:
        embedding_str = "[" + ",".join(map(str, request.embedding)) + "]"
        
        result = supabase.rpc(
            "match_scholarships",
            {
                "query_embedding": embedding_str,
                "match_count": request.limit
            }
        ).execute()
        
        if not result.data:
            return []
        
        matches = []
        for row in result.data:
            matches.append(ScholarshipMatchResponse(
                id=row["id"],
                title=row["title"],
                provider=row["provider"],
                amount=row["amount"],
                deadline=row["deadline"],
                education_level=row["education_level"],
                url=row.get("url"),
                tags=row.get("tags"),
                similarity_score=row.get("similarity", 0)
            ))
        
        return matches
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


SCRAPER_SYSTEM_PROMPT = """You are a scholarship data extraction expert. Extract scholarship information from the provided webpage content.

RULES:
1. If multiple distinct scholarships exist on the page, extract EACH separately
2. If information is missing or unclear, use null - NEVER hallucinate or guess
3. For each piece of data, include a source_quote - the exact sentence or phrase from the text that proves this data
4. Deadline should be in YYYY-MM-DD format if possible, otherwise use the exact text
5. Amount should include currency (RM, USD, etc.)
6. education_level should be one of: SPM, STPM, Diploma, Undergraduate, Postgraduate, PhD, or the exact text if different

Focus on extracting:
- title: The scholarship name
- provider: The organization offering it
- amount: Monetary value or coverage description
- deadline: Application deadline
- education_level: Required/target education level
- description: Brief description of the scholarship
- source_quote: The specific text from the page that confirms this scholarship exists"""


@app.post("/admin/scrape", response_model=ScrapeResponse)
async def scrape_scholarship_url(request: ScrapeRequest):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client.get(request.url, headers=headers, follow_redirects=True)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Page not found (404)")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="Access forbidden (403) - website may be blocking scrapers")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch URL: HTTP {response.status_code}")
            
            html_content = response.text
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timed out - the website took too long to respond")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch URL: {str(e)}")
    
    markdown_content = md(html_content, heading_style="ATX", strip=['script', 'style', 'nav', 'footer'])
    markdown_content = markdown_content[:15000]
    
    try:
        extraction_response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SCRAPER_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract scholarship information from this webpage:\n\nURL: {request.url}\n\nContent:\n{markdown_content}"}
            ],
            response_format={"type": "json_object"},
            max_tokens=2000,
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
            
        draft_data = {
            "title": scholarship.get("title"),
            "provider": scholarship.get("provider"),
            "amount": scholarship.get("amount"),
            "deadline": scholarship.get("deadline"),
            "education_level": scholarship.get("education_level"),
            "url": request.url,
            "description": scholarship.get("description"),
            "source_quote": scholarship.get("source_quote"),
            "status": "pending"
        }
        
        try:
            supabase.table("scholarship_drafts").insert(draft_data).execute()
            drafts_created += 1
        except Exception as e:
            print(f"Failed to insert draft: {e}")
    
    if drafts_created == 0:
        return ScrapeResponse(drafts_created=0, message="No scholarships found on this page")
    
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
            "tags": []
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

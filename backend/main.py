from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from supabase_client import supabase
from schemas import ScholarshipCreate, ScholarshipResponse

app = FastAPI(title="Ascendia API", description="Malaysian Scholarship Discovery Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

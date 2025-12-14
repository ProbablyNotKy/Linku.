from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, Base, get_db, SessionLocal
from models import Scholarship
from schemas import ScholarshipCreate, ScholarshipResponse
from seed import seed_database

app = FastAPI(title="Ascendia API", description="Malaysian Scholarship Discovery Platform")

# CORS Middleware - Allow frontend on port 5000 to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Ascendia API - Malaysian Scholarship Discovery Platform"}

@app.post("/scholarships/", response_model=ScholarshipResponse)
def create_scholarship(scholarship: ScholarshipCreate, db: Session = Depends(get_db)):
    db_scholarship = Scholarship(**scholarship.model_dump())
    db.add(db_scholarship)
    db.commit()
    db.refresh(db_scholarship)
    return db_scholarship

@app.get("/scholarships/", response_model=List[ScholarshipResponse])
def list_scholarships(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    scholarships = db.query(Scholarship).offset(skip).limit(limit).all()
    return scholarships

@app.get("/scholarships/{scholarship_id}", response_model=ScholarshipResponse)
def get_scholarship(scholarship_id: int, db: Session = Depends(get_db)):
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if scholarship is None:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return scholarship

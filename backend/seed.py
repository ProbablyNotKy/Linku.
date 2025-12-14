from datetime import date
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Scholarship

SEED_DATA = [
    {
        "title": "Yayasan Khazanah Global Scholarship",
        "provider": "Yayasan Khazanah",
        "amount": "Full Ride + Allowance",
        "deadline": date(2024, 5, 30),
        "education_level": "Undergraduate",
        "tags": ["Merit", "Overseas", "Leadership"],
        "url": "https://www.yayasankhazanah.com.my"
    },
    {
        "title": "Maybank Group Scholarship Programme",
        "provider": "Maybank",
        "amount": "RM 40,000 / year",
        "deadline": date(2024, 4, 15),
        "education_level": "Undergraduate",
        "tags": ["Finance", "Tech", "B40 Priority"],
        "url": "https://maybank.com/scholarship"
    },
    {
        "title": "JPA PIDN Scholarship",
        "provider": "Jabatan Perkhidmatan Awam (JPA)",
        "amount": "Full Coverage",
        "deadline": date(2024, 6, 1),
        "education_level": "Degree",
        "tags": ["Government", "Bumiputera", "Local University"],
        "url": "https://esilav2.jpa.gov.my"
    },
    {
        "title": "Shell Malaysia Scholarship",
        "provider": "Shell",
        "amount": "RM 12,000 + Internship",
        "deadline": date(2024, 7, 20),
        "education_level": "Undergraduate",
        "tags": ["Engineering", "STEM", "Corporate"],
        "url": "https://shell.com.my"
    },
    {
        "title": "The Star Education Fund",
        "provider": "The Star Media Group",
        "amount": "Tuition Fee Waiver",
        "deadline": date(2024, 8, 30),
        "education_level": "Diploma/Degree",
        "tags": ["Media", "Business", "Arts"],
        "url": "https://thestar.com.my/edufund"
    }
]

def seed_database(db: Session) -> int:
    """Seed the database with initial scholarship data if empty.
    
    Returns the number of scholarships inserted.
    """
    existing_count = db.query(Scholarship).count()
    
    if existing_count > 0:
        print(f"Database already has {existing_count} scholarships. Skipping seed.")
        return 0
    
    for scholarship_data in SEED_DATA:
        scholarship = Scholarship(**scholarship_data)
        db.add(scholarship)
    
    db.commit()
    print(f"Seeded {len(SEED_DATA)} scholarships into the database.")
    return len(SEED_DATA)

def run_seed():
    """Run the seed script manually."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = seed_database(db)
        return count
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()

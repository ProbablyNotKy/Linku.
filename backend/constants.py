"""
Shared constants for Ascendia - Malaysian Scholarship Discovery Platform.
These constants are the source of truth and should be kept in sync with shared/constants.ts
"""

MALAYSIAN_STATES = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
    "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah",
    "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur",
    "Labuan", "Putrajaya"
]

INCOME_BRACKETS = {
    "B40": {
        "label": "B40 (Below RM 4,850/month)",
        "short_label": "B40",
        "max_monthly": 4850,
        "max_annual": 58200,
        "rm_value": 5250,  # Upper limit in RM for eligibility matching
    },
    "M40": {
        "label": "M40 (RM 4,850 - 10,959/month)",
        "short_label": "M40",
        "max_monthly": 10959,
        "max_annual": 131508,
        "rm_value": 10959,
    },
    "T20": {
        "label": "T20 (Above RM 10,959/month)",
        "short_label": "T20",
        "max_monthly": None,
        "max_annual": None,
        "rm_value": 50000,  # High value for T20 (essentially no upper limit)
    },
}

def get_income_rm_value(bracket: str) -> float | None:
    """Convert income bracket label to numeric RM value for matching."""
    bracket_data = INCOME_BRACKETS.get(bracket)
    return bracket_data["rm_value"] if bracket_data else None


def get_income_bracket_list():
    """Get list of income brackets for API responses."""
    return [
        {"value": key, "label": data["label"], "rm_value": data["rm_value"]}
        for key, data in INCOME_BRACKETS.items()
    ]


STUDY_AREAS = [
    "STEM", "Engineering", "Medicine", "Health Sciences", "Business",
    "Accounting", "Law", "Education", "Arts & Humanities", "Social Sciences",
    "Agriculture", "Architecture", "IT & Computer Science", "Aviation",
    "Islamic Studies", "General"
]

EDUCATION_LEVELS = [
    {"value": "SPM", "label": "SPM"},
    {"value": "STPM", "label": "STPM"},
    {"value": "Diploma", "label": "Diploma"},
    {"value": "Undergraduate", "label": "Undergraduate / Degree"},
    {"value": "Postgraduate", "label": "Postgraduate / Masters"},
    {"value": "PhD", "label": "PhD"},
]

INSTITUTION_TYPES = [
    {"value": "IPTA", "label": "IPTA (Public)"},
    {"value": "IPTS", "label": "IPTS (Private)"},
    {"value": "Both", "label": "Both IPTA & IPTS"},
]

SPM_ENGLISH_GRADES = ["A+", "A", "A-", "B+", "B", "C+", "C", "D", "E", "G"]

MUET_BANDS = [1, 2, 3, 4, 5]

# Education level hierarchy for pathway matching
EDUCATION_HIERARCHY = {
    "SPM": 1,
    "STPM": 2,
    "Diploma": 3,
    "Undergraduate": 4,
    "Degree": 4,  # Alias
    "Bachelor": 4,  # Alias
    "Postgraduate": 5,
    "Masters": 5,  # Alias
    "PhD": 6,
}

def get_education_level_rank(level: str) -> int:
    """Get numeric rank for education level for comparison."""
    return EDUCATION_HIERARCHY.get(level, 0)

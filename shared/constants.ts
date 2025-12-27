export const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Labuan",
  "Putrajaya",
] as const;

export type MalaysianState = typeof MALAYSIAN_STATES[number];

export const INCOME_BRACKETS = {
  B40: {
    label: "B40 (Below RM 4,850/month)",
    shortLabel: "B40",
    maxMonthly: 4850,
    maxAnnual: 58200,
    rmValue: 5250,
  },
  M40: {
    label: "M40 (RM 4,850 - 10,959/month)",
    shortLabel: "M40",
    maxMonthly: 10959,
    maxAnnual: 131508,
    rmValue: 10959,
  },
  T20: {
    label: "T20 (Above RM 10,959/month)",
    shortLabel: "T20",
    maxMonthly: null,
    maxAnnual: null,
    rmValue: 50000,
  },
} as const;

export type IncomeBracket = keyof typeof INCOME_BRACKETS;

export const INCOME_BRACKET_LIST = Object.entries(INCOME_BRACKETS).map(([key, value]) => ({
  value: key as IncomeBracket,
  label: value.label,
  rmValue: value.rmValue,
}));

export function getIncomeRmValue(bracket: string): number | null {
  const bracketData = INCOME_BRACKETS[bracket as IncomeBracket];
  return bracketData ? bracketData.rmValue : null;
}

export const STUDY_AREAS = [
  "STEM",
  "Engineering",
  "Medicine",
  "Health Sciences",
  "Business",
  "Accounting",
  "Law",
  "Education",
  "Arts & Humanities",
  "Social Sciences",
  "Agriculture",
  "Architecture",
  "IT & Computer Science",
  "Aviation",
  "Islamic Studies",
  "General",
] as const;

export type StudyArea = typeof STUDY_AREAS[number];

export const EDUCATION_LEVELS = [
  { value: "SPM", label: "SPM" },
  { value: "STPM", label: "STPM" },
  { value: "Diploma", label: "Diploma" },
  { value: "Undergraduate", label: "Undergraduate / Degree" },
  { value: "Postgraduate", label: "Postgraduate / Masters" },
  { value: "PhD", label: "PhD" },
] as const;

export type EducationLevel = typeof EDUCATION_LEVELS[number]["value"];

export const SPM_ENGLISH_GRADES = ["A+", "A", "A-", "B+", "B", "C+", "C", "D", "E", "G"] as const;

export type SpmEnglishGrade = typeof SPM_ENGLISH_GRADES[number];

export const MUET_BANDS = [1, 2, 3, 4, 5] as const;

export type MuetBand = typeof MUET_BANDS[number];

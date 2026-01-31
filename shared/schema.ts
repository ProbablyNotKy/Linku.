import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export constants from centralized constants file
export {
  MALAYSIAN_STATES,
  STUDY_AREAS,
  EDUCATION_LEVELS,
  SPM_ENGLISH_GRADES,
  INCOME_BRACKETS,
  INCOME_BRACKET_LIST,
  getIncomeRmValue,
  MUET_BANDS,
} from "./constants";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Scholarship type matching FastAPI backend
export interface Scholarship {
  id: number;
  title: string;
  provider: string;
  amount: string;
  deadline?: string | null;  // Made optional for Rolling/TBA scholarships
  education_level: string[] | null;  // Array of levels, null = open to all
  url?: string;
  tags?: string[];
  study_areas?: string[];
  min_cgpa?: number | null;
  min_spm_as?: number | null;
  household_income_max?: number | null;
  state_restriction?: string | null;
  is_bumiputera_only?: boolean;
  ai_matching_context?: string | null;
  detailed_description?: string | null;  // Rich text/markdown description
  // English proficiency requirements
  min_muet?: number | null;
  min_ielts?: number | null;
  min_spm_english?: string | null;
  // New fields for enhanced UI
  email?: string | null;
  scholarship_type?: string | null;  // e.g., "Scholarship", "Grant", "Fellowship"
  place_of_study?: string[] | null;  // e.g., ["Local", "Overseas"]
  banner_image_url?: string | null;
  // Deadline flexibility fields
  deadline_type?: string | null;  // Fixed, Estimated, Rolling, TBA
  opens_at?: string | null;  // When applications typically open
}

// Score breakdown for hybrid matching
export interface ScoreBreakdown {
  similarity_component: number;
  academic_component: number;
  socioeconomic_component: number;
  raw_similarity: number;
  academic_weight: number;
  socioeconomic_weight: number;
}

// Eligibility badges for UI display
export interface EligibilityBadges {
  education?: string;
  study_area?: string;
  cgpa?: string;
  spm?: string;
  income?: string;
  state?: string;
  bumiputera?: string;
  english?: string;
}

// Scholarship match result with eligibility info and hybrid scoring
export interface ScholarshipMatch extends Scholarship {
  similarity_score: number;
  match_score?: number;  // Hybrid score (0-100%)
  is_eligible: boolean;
  ineligibility_reasons?: string[];
  // Match breakdown for UI
  match_reasons?: string[];  // Human-readable match reasons
  score_breakdown?: ScoreBreakdown;  // Detailed score components
  eligibility_badges?: EligibilityBadges;  // Badge status per criteria
}

// Draft scholarship from scraper
export interface ScholarshipDraft {
  id: number;
  title?: string;
  provider?: string;
  amount?: string;
  deadline?: string;
  education_level?: string[] | null;  // Array of levels, null = open to all
  url?: string;
  description?: string;
  source_quote?: string;
  status: string;
  study_areas?: string[];
  min_cgpa?: number | null;
  min_spm_as?: number | null;
  household_income_max?: number | null;
  state_restriction?: string | null;
  is_bumiputera_only?: boolean;
  ai_matching_context?: string | null;
  // English proficiency requirements
  min_muet?: number | null;
  min_ielts?: number | null;
  min_spm_english?: string | null;
}

// Student profile for matching
export interface StudentProfile {
  bio: string;
  education_level?: string;
  field_of_study?: string;
  cgpa?: number | null;
  spm_as?: number | null;
  household_income?: number | null;
  state?: string | null;
  intended_study_areas?: string[];
  is_bumiputera?: boolean;
  embedding?: number[];
  // English proficiency scores
  muet_band?: number | null;
  ielts_score?: number | null;
  spm_english_grade?: string | null;
}

// SPM_ENGLISH_GRADES is now exported from constants.ts

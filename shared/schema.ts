import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Malaysian states
export const MALAYSIAN_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah",
  "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur",
  "Labuan", "Putrajaya"
] as const;

// Standard Malaysian study areas
export const STUDY_AREAS = [
  "STEM", "Engineering", "Medicine", "Health Sciences", "Business",
  "Accounting", "Law", "Education", "Arts & Humanities", "Social Sciences",
  "Agriculture", "Architecture", "IT & Computer Science", "Aviation",
  "Islamic Studies", "General"
] as const;

// Scholarship type matching FastAPI backend
export interface Scholarship {
  id: number;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  education_level: string;
  url?: string;
  tags?: string[];
  study_areas?: string[];
  min_cgpa?: number | null;
  min_spm_as?: number | null;
  household_income_max?: number | null;
  state_restriction?: string | null;
  is_bumiputera_only?: boolean;
  ai_matching_context?: string | null;
}

// Scholarship match result with eligibility info
export interface ScholarshipMatch extends Scholarship {
  similarity_score: number;
  is_eligible: boolean;
  ineligibility_reasons?: string[];
}

// Draft scholarship from scraper
export interface ScholarshipDraft {
  id: number;
  title?: string;
  provider?: string;
  amount?: string;
  deadline?: string;
  education_level?: string;
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
}

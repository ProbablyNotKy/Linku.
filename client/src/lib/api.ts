import { Scholarship, ScholarshipMatch, ScholarshipDraft, StudentProfile, MALAYSIAN_STATES, STUDY_AREAS } from "@shared/schema";

export { MALAYSIAN_STATES, STUDY_AREAS };

export interface FetchScholarshipsParams {
  query?: string;
  level?: string;
}

export async function fetchScholarships(params?: FetchScholarshipsParams): Promise<Scholarship[]> {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.append("query", params.query);
  if (params?.level) searchParams.append("level", params.level);
  
  const queryString = searchParams.toString();
  const url = `/api/scholarships${queryString ? `?${queryString}` : ""}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scholarships: ${response.status}`);
  }

  return response.json();
}

export async function fetchScholarshipById(id: number): Promise<Scholarship> {
  const response = await fetch(`/api/scholarships/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scholarship: ${response.status}`);
  }

  return response.json();
}

export interface ScholarshipCreate {
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

export async function createScholarship(data: ScholarshipCreate): Promise<Scholarship> {
  const response = await fetch("/api/scholarships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create scholarship: ${error}`);
  }
  return response.json();
}

export async function updateScholarship(id: number, data: ScholarshipCreate): Promise<Scholarship> {
  const response = await fetch(`/api/scholarships/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update scholarship: ${error}`);
  }
  return response.json();
}

export async function deleteScholarship(id: number): Promise<void> {
  const response = await fetch(`/api/scholarships/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete scholarship: ${error}`);
  }
}

export interface ProfileSyncRequest {
  bio: string;
  education_level?: string;
  field_of_study?: string;
  cgpa?: number | null;
  spm_as?: number | null;
  household_income?: number | null;
  state?: string | null;
  intended_study_areas?: string[];
  is_bumiputera?: boolean;
}

export interface ProfileSyncResponse {
  embedding: number[];
  message: string;
}

export async function syncProfile(data: ProfileSyncRequest): Promise<ProfileSyncResponse> {
  const response = await fetch("/api/profile/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sync profile: ${error}`);
  }
  return response.json();
}

export interface MatchRequest {
  embedding: number[];
  limit?: number;
  cgpa?: number | null;
  spm_as?: number | null;
  household_income?: number | null;
  state?: string | null;
  intended_study_areas?: string[];
  is_bumiputera?: boolean;
}

export async function matchScholarships(request: MatchRequest): Promise<ScholarshipMatch[]> {
  const response = await fetch("/api/scholarships/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to match scholarships: ${error}`);
  }
  return response.json();
}

export async function vectorizeScholarships(): Promise<{ processed: number; message: string }> {
  const response = await fetch("/api/scholarships/vectorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to vectorize scholarships: ${error}`);
  }
  return response.json();
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  conversation_history: ChatMessage[];
}

export async function chatWithCoach(message: string, history?: ChatMessage[]): Promise<ChatResponse> {
  const response = await fetch("/api/chat/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversation_history: history }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get coach response: ${error}`);
  }
  return response.json();
}

export interface ScrapeResponse {
  drafts_created: number;
  message: string;
}

export async function scrapeUrls(urls: string[]): Promise<ScrapeResponse> {
  const response = await fetch("/api/admin/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to scrape URLs: ${response.status}`);
  }
  return response.json();
}

export interface Draft {
  id: number;
  title: string | null;
  provider: string | null;
  amount: string | null;
  deadline: string | null;
  education_level: string | null;
  url: string | null;
  description: string | null;
  source_quote: string | null;
  status: string;
  study_areas?: string[] | null;
  min_cgpa?: number | null;
  min_spm_as?: number | null;
  household_income_max?: number | null;
  state_restriction?: string | null;
  is_bumiputera_only?: boolean | null;
  ai_matching_context?: string | null;
}

export interface DraftUpdate {
  title?: string;
  provider?: string;
  amount?: string;
  deadline?: string;
  education_level?: string;
  url?: string;
  description?: string;
  study_areas?: string[];
  min_cgpa?: number | null;
  min_spm_as?: number | null;
  household_income_max?: number | null;
  state_restriction?: string | null;
  is_bumiputera_only?: boolean;
  ai_matching_context?: string;
}

export async function fetchDrafts(status: string = "pending"): Promise<Draft[]> {
  const response = await fetch(`/api/admin/drafts?status=${status}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch drafts: ${response.status}`);
  }
  return response.json();
}

export async function updateDraft(id: number, data: DraftUpdate): Promise<Draft> {
  const response = await fetch(`/api/admin/drafts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to update draft: ${response.status}`);
  }
  return response.json();
}

export interface PublishResponse {
  scholarship_id: number;
  message: string;
}

export async function publishDraft(id: number): Promise<PublishResponse> {
  const response = await fetch(`/api/admin/drafts/${id}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to publish draft: ${response.status}`);
  }
  return response.json();
}

export async function rejectDraft(id: number): Promise<void> {
  const response = await fetch(`/api/admin/drafts/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to reject draft: ${response.status}`);
  }
}

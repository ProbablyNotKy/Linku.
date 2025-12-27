import { 
  Scholarship, 
  ScholarshipMatch, 
  ScholarshipDraft, 
  StudentProfile, 
  MALAYSIAN_STATES, 
  STUDY_AREAS,
  SPM_ENGLISH_GRADES,
  INCOME_BRACKET_LIST,
  EDUCATION_LEVELS,
  MUET_BANDS,
  getIncomeRmValue,
} from "@shared/schema";

export { 
  MALAYSIAN_STATES, 
  STUDY_AREAS, 
  SPM_ENGLISH_GRADES, 
  INCOME_BRACKET_LIST, 
  EDUCATION_LEVELS, 
  MUET_BANDS,
  getIncomeRmValue,
};

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
  min_muet?: number | null;
  min_ielts?: number | null;
  min_spm_english?: string | null;
}

export async function createScholarship(data: ScholarshipCreate, accessToken?: string): Promise<Scholarship> {
  const response = await fetch("/api/scholarships", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create scholarship: ${error}`);
  }
  return response.json();
}

export async function updateScholarship(id: number, data: ScholarshipCreate, accessToken?: string): Promise<Scholarship> {
  const response = await fetch(`/api/scholarships/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update scholarship: ${error}`);
  }
  return response.json();
}

export async function deleteScholarship(id: number, accessToken?: string): Promise<void> {
  const response = await fetch(`/api/scholarships/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
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

export async function scrapeUrls(urls: string[], accessToken?: string): Promise<ScrapeResponse> {
  const response = await fetch("/api/admin/scrape", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
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
  education_level: string[] | null;  // Array of levels, null = open to all
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
  min_muet?: number | null;
  min_ielts?: number | null;
  min_spm_english?: string | null;
}

export interface DraftUpdate {
  title?: string;
  provider?: string;
  amount?: string;
  deadline?: string;
  education_level?: string[] | null;  // Array of levels, null = open to all
  url?: string;
  description?: string;
  study_areas?: string[];
  min_cgpa?: number | null;
  min_spm_as?: number | null;
  household_income_max?: number | null;
  state_restriction?: string | null;
  is_bumiputera_only?: boolean;
  ai_matching_context?: string;
  min_muet?: number | null;
  min_ielts?: number | null;
  min_spm_english?: string | null;
}

export async function fetchDrafts(status: string = "pending", accessToken?: string): Promise<Draft[]> {
  const response = await fetch(`/api/admin/drafts?status=${status}`, {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch drafts: ${response.status}`);
  }
  return response.json();
}

export async function updateDraft(id: number, data: DraftUpdate, accessToken?: string): Promise<Draft> {
  const response = await fetch(`/api/admin/drafts/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(accessToken),
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

export async function publishDraft(id: number, accessToken?: string): Promise<PublishResponse> {
  const response = await fetch(`/api/admin/drafts/${id}/publish`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to publish draft: ${response.status}`);
  }
  return response.json();
}

export async function rejectDraft(id: number, accessToken?: string): Promise<void> {
  const response = await fetch(`/api/admin/drafts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to reject draft: ${response.status}`);
  }
}

// User Profile types and functions
export interface UserProfileCreate {
  education_level: string;
  cgpa?: number | null;
  spm_as?: number | null;
  household_income: string;  // B40, M40, T20
  state: string;
  is_bumiputera: boolean;
  study_areas: string[];
  bio_achievements: string;
  muet_band?: number | null;
  ielts_score?: number | null;
  spm_english_grade?: string | null;
}

export interface UserProfileResponse {
  id: string;
  education_level: string | null;
  cgpa: number | null;
  spm_as: number | null;
  household_income: string | null;
  state: string | null;
  is_bumiputera: boolean;
  study_areas: string[] | null;
  bio_achievements: string | null;
  has_embedding: boolean;
  muet_band: number | null;
  ielts_score: number | null;
  spm_english_grade: string | null;
}

// SPM_ENGLISH_GRADES is now exported from @shared/schema

// Helper to get auth headers if user is authenticated
export function getAuthHeaders(accessToken?: string): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}

export async function createUserProfile(
  data: UserProfileCreate, 
  accessToken?: string
): Promise<UserProfileResponse> {
  const response = await fetch("/api/profiles", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to create profile: ${response.status}`);
  }
  return response.json();
}

export async function getUserProfile(profileId: string): Promise<UserProfileResponse> {
  const response = await fetch(`/api/profiles/${profileId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to get profile: ${response.status}`);
  }
  return response.json();
}

export async function getMyProfile(accessToken: string): Promise<UserProfileResponse> {
  const response = await fetch("/api/profiles/me/current", {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to get profile: ${response.status}`);
  }
  return response.json();
}

export async function matchWithProfile(profileId: string, limit: number = 10): Promise<ScholarshipMatch[]> {
  const response = await fetch("/api/profiles/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile_id: profileId, limit }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to match scholarships: ${response.status}`);
  }
  return response.json();
}

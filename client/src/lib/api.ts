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
  HIGHEST_QUALIFICATIONS,
  INTENDED_STUDY_LEVELS,
  Subscription,
  FeatureAccess,
  PremiumFeature,
} from "@shared/schema";

export { 
  MALAYSIAN_STATES, 
  STUDY_AREAS, 
  SPM_ENGLISH_GRADES, 
  INCOME_BRACKET_LIST, 
  EDUCATION_LEVELS, 
  MUET_BANDS,
  getIncomeRmValue,
  HIGHEST_QUALIFICATIONS,
  INTENDED_STUDY_LEVELS,
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
  min_muet?: number | null;
  min_ielts?: number | null;
  min_spm_english?: string | null;
  email?: string | null;
  scholarship_type?: string | null;
  place_of_study?: string[] | null;
  banner_image_url?: string | null;
  deadline_type?: string | null;  // Fixed, Estimated, Rolling, TBA
  opens_at?: string | null;  // When applications typically open
}

export async function createScholarship(data: ScholarshipCreate, accessToken?: string): Promise<Scholarship> {
  const response = await fetch("/api/scholarships", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to create scholarship"}`);
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
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to update scholarship"}`);
  }
  return response.json();
}

export async function deleteScholarship(id: number, accessToken?: string): Promise<void> {
  const response = await fetch(`/api/scholarships/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to delete scholarship"}`);
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

export async function chatWithCoach(message: string, accessToken: string, history?: ChatMessage[]): Promise<ChatResponse> {
  const response = await fetch("/api/chat/coach", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ message, conversation_history: history }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `Failed to get coach response: ${response.status}`);
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
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to scrape URLs"}`);
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
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to fetch drafts"}`);
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
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to update draft"}`);
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
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to publish draft"}`);
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
    throw new Error(`[${response.status}] ${errorData.error || errorData.detail || "Failed to reject draft"}`);
  }
}

// User Profile types and functions
export interface UserProfileCreate {
  education_level?: string | null;  // Legacy — kept for backward compat
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
  // v2 decoupled education fields
  highest_qualification?: string | null;
  intended_study_level?: string | null;
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
  highest_qualification: string | null;
  intended_study_level: string | null;
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

export async function matchWithProfile(profileId: string, accessToken: string, limit: number = 10): Promise<ScholarshipMatch[]> {
  const response = await fetch("/api/profiles/match", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ profile_id: profileId, limit }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to match scholarships: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// SUBSCRIPTION API FUNCTIONS
// ============================================================================

export async function getSubscriptionStatus(accessToken: string): Promise<Subscription> {
  const response = await fetch("/api/subscription/status", {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to get subscription status: ${response.status}`);
  }
  return response.json();
}

export async function checkFeatureAccess(
  featureName: PremiumFeature, 
  accessToken: string
): Promise<FeatureAccess> {
  const response = await fetch(`/api/subscription/check-feature/${featureName}`, {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to check feature access: ${response.status}`);
  }
  return response.json();
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  tier: string;
  subscription_status: string;
  expires_at: string | null;
}

export async function fetchAdminUsers(accessToken: string): Promise<AdminUser[]> {
  const response = await fetch("/api/admin/users", {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(`[${response.status}] Failed to fetch users`);
  }
  const data = await response.json();
  return data.users || [];
}

export async function activateUserPremium(authUserId: string, accessToken: string, durationMonths: number = 1): Promise<void> {
  const response = await fetch(`/api/subscription/activate/${authUserId}?duration_months=${durationMonths}`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData.detail || `Failed to activate premium: ${response.status}`);
  }
}

export async function deactivateUserPremium(authUserId: string, accessToken: string): Promise<void> {
  const response = await fetch(`/api/subscription/deactivate/${authUserId}`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData.detail || `Failed to deactivate premium: ${response.status}`);
  }
}

// ============================================================================
// TOYYIBPAY PAYMENT FUNCTIONS
// ============================================================================

export interface CreateBillParams {
  email: string;
  name: string;
  phone: string;
}

export interface CreateBillResponse {
  bill_code: string;
  payment_url: string;
}

export async function createPaymentBill(
  params: CreateBillParams,
  accessToken: string
): Promise<CreateBillResponse> {
  const response = await fetch("/api/subscription/create-bill", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorData.detail || `Failed to create payment: ${response.status}`);
  }
  return response.json();
}

export interface BulkUploadResult {
  inserted: number;
  errors: string[];
}

export async function bulkUploadScholarships(
  rows: Record<string, string | undefined>[],
  accessToken: string
): Promise<BulkUploadResult> {
  const response = await fetch("/api/admin/bulk-upload", {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ scholarships: rows }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `Upload failed: ${response.status}`);
  }
  return response.json();
}

export { type Subscription, type FeatureAccess, type PremiumFeature };

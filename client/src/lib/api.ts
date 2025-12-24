import { Scholarship } from "@shared/schema";

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

export interface ScholarshipMatch extends Scholarship {
  similarity_score: number;
}

export async function matchScholarships(embedding: number[], limit: number = 5): Promise<ScholarshipMatch[]> {
  const response = await fetch("/api/scholarships/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embedding, limit }),
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

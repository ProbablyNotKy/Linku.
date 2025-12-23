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

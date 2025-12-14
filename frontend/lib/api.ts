import { Scholarship } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function fetchScholarships(): Promise<Scholarship[]> {
  const response = await fetch(`${API_BASE_URL}/scholarships/`, {
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
  const response = await fetch(`${API_BASE_URL}/scholarships/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/scholarships/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create scholarship: ${error}`);
  }

  return response.json();
}

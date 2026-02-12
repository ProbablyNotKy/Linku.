import { Scholarship } from "@/types";

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    console.log("[API] Using env URL:", envUrl);
    return envUrl;
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      console.log("[API] Development mode - using localhost:8000");
      return "http://127.0.0.1:8000";
    }
    
    const productionUrl = `${protocol}//${hostname}`;
    console.log("[API] Production mode - using:", productionUrl);
    return productionUrl;
  }
  
  console.log("[API] SSR fallback - using localhost:8000");
  return "http://127.0.0.1:8000";
}

export async function fetchScholarships(): Promise<Scholarship[]> {
  const API_BASE_URL = getApiBaseUrl();
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
  const API_BASE_URL = getApiBaseUrl();
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
  amount?: string;
  deadline: string;
  education_level: string;
  institution_type?: string;
  url?: string;
  tags?: string[];
}

export async function createScholarship(data: ScholarshipCreate): Promise<Scholarship> {
  const API_BASE_URL = getApiBaseUrl();
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

export async function updateScholarship(id: number, data: ScholarshipCreate): Promise<Scholarship> {
  const API_BASE_URL = getApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/scholarships/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update scholarship: ${error}`);
  }

  return response.json();
}

export async function deleteScholarship(id: number): Promise<void> {
  const API_BASE_URL = getApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/scholarships/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete scholarship: ${error}`);
  }
}

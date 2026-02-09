import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

const FASTAPI_URL = "http://127.0.0.1:8000";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/scholarships", async (req, res) => {
    try {
      const params = new URLSearchParams();
      if (req.query.query) params.append("query", req.query.query as string);
      if (req.query.level) params.append("level", req.query.level as string);
      const queryString = params.toString();
      const url = `${FASTAPI_URL}/scholarships/${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FastAPI error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching scholarships:", error);
      res.status(500).json({ error: "Failed to fetch scholarships" });
    }
  });

  app.get("/api/scholarships/:id", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/scholarships/${req.params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Scholarship not found" });
        }
        throw new Error(`FastAPI error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching scholarship:", error);
      res.status(500).json({ error: "Failed to fetch scholarship" });
    }
  });

  app.post("/api/scholarships", async (req, res) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/scholarships/`, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to create scholarship" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error creating scholarship:", error);
      res.status(500).json({ error: "Failed to create scholarship" });
    }
  });

  app.put("/api/scholarships/:id", async (req, res) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/scholarships/${req.params.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Scholarship not found" });
        }
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to update scholarship" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error updating scholarship:", error);
      res.status(500).json({ error: "Failed to update scholarship" });
    }
  });

  app.delete("/api/scholarships/:id", async (req, res) => {
    try {
      const headers: Record<string, string> = {};
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/scholarships/${req.params.id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Scholarship not found" });
        }
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to delete scholarship" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scholarship:", error);
      res.status(500).json({ error: "Failed to delete scholarship" });
    }
  });

  app.post("/api/profile/sync", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/profile/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`FastAPI error: ${response.status} - ${error}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error syncing profile:", error);
      res.status(500).json({ error: "Failed to sync profile" });
    }
  });

  app.post("/api/scholarships/match", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/scholarships/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`FastAPI error: ${response.status} - ${error}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error matching scholarships:", error);
      res.status(500).json({ error: "Failed to match scholarships" });
    }
  });

  app.post("/api/scholarships/vectorize", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/scholarships/vectorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`FastAPI error: ${response.status} - ${error}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error vectorizing scholarships:", error);
      res.status(500).json({ error: "Failed to vectorize scholarships" });
    }
  });

  app.post("/api/chat/coach", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/chat/coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`FastAPI error: ${response.status} - ${error}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error with coach chat:", error);
      res.status(500).json({ error: "Failed to get coach response" });
    }
  });

  app.post("/api/admin/scrape", async (req, res) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/admin/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to scrape URL" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error scraping URL:", error);
      res.status(500).json({ error: "Failed to scrape URL" });
    }
  });

  app.get("/api/admin/drafts", async (req, res) => {
    try {
      const params = new URLSearchParams();
      if (req.query.status) params.append("status", req.query.status as string);
      const queryString = params.toString();
      const url = `${FASTAPI_URL}/admin/drafts${queryString ? `?${queryString}` : ""}`;
      
      const headers: Record<string, string> = {};
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to fetch drafts" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  app.put("/api/admin/drafts/:id", async (req, res) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/admin/drafts/${req.params.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to update draft" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error updating draft:", error);
      res.status(500).json({ error: "Failed to update draft" });
    }
  });

  app.post("/api/admin/drafts/:id/publish", async (req, res) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/admin/drafts/${req.params.id}/publish`, {
        method: "POST",
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to publish draft" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error publishing draft:", error);
      res.status(500).json({ error: "Failed to publish draft" });
    }
  });

  app.delete("/api/admin/drafts/:id", async (req, res) => {
    try {
      const headers: Record<string, string> = {};
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/admin/drafts/${req.params.id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to reject draft" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error rejecting draft:", error);
      res.status(500).json({ error: "Failed to reject draft" });
    }
  });

  // User Profile endpoints
  app.post("/api/profiles", async (req, res) => {
    try {
      // Forward Authorization header to link profile to authenticated user
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/profiles/`, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to create profile" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/profiles/${req.params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Profile not found" });
        }
        throw new Error(`FastAPI error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles/match", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/profiles/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to match scholarships" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error matching scholarships with profile:", error);
      res.status(500).json({ error: "Failed to match scholarships" });
    }
  });

  // Admin user management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const headers: Record<string, string> = {};
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/api/admin/users`, { headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to fetch users" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Subscription endpoints
  app.get("/api/subscription/status", async (req, res) => {
    try {
      const headers: Record<string, string> = {};
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/api/subscription/status`, { headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to get subscription status" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  app.get("/api/subscription/check-feature/:featureName", async (req, res) => {
    try {
      const headers: Record<string, string> = {};
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/api/subscription/check-feature/${req.params.featureName}`, { headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to check feature access" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error checking feature access:", error);
      res.status(500).json({ error: "Failed to check feature access" });
    }
  });

  app.post("/api/subscription/activate/:authUserId", async (req, res) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const params = new URLSearchParams();
      if (req.query.duration_months) params.append("duration_months", req.query.duration_months as string);
      const queryString = params.toString();
      const response = await fetch(`${FASTAPI_URL}/api/subscription/activate/${req.params.authUserId}${queryString ? `?${queryString}` : ""}`, {
        method: "POST",
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to activate subscription" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error activating subscription:", error);
      res.status(500).json({ error: "Failed to activate subscription" });
    }
  });

  app.post("/api/subscription/deactivate/:authUserId", async (req, res) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization;
      }
      const response = await fetch(`${FASTAPI_URL}/api/subscription/deactivate/${req.params.authUserId}`, {
        method: "POST",
        headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        return res.status(response.status).json({ error: errorData.detail || "Failed to deactivate subscription" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error deactivating subscription:", error);
      res.status(500).json({ error: "Failed to deactivate subscription" });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  return httpServer;
}

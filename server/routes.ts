import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const FASTAPI_URL = "http://127.0.0.1:8000";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/scholarships", async (req, res) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/scholarships/`);
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
      const response = await fetch(`${FASTAPI_URL}/scholarships/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) {
        throw new Error(`FastAPI error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error creating scholarship:", error);
      res.status(500).json({ error: "Failed to create scholarship" });
    }
  });

  return httpServer;
}

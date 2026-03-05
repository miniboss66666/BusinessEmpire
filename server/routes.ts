import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.examples.hello.path, (req, res) => {
    res.json({ message: "Welcome to your empty template!" });
  });

  return httpServer;
}
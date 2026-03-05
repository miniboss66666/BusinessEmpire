import { type InsertExample, type Example } from "@shared/schema";

export interface IStorage {
  // Modify the interface with any CRUD methods
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
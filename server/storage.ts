import { gameSessions, type GameSession, type InsertSession } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createSession(session: InsertSession): Promise<GameSession>;
  getSession(id: number): Promise<GameSession | undefined>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<GameSession>;
}

export class DatabaseStorage implements IStorage {
  async createSession(insertSession: InsertSession): Promise<GameSession> {
    const [session] = await db
      .insert(gameSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(id: number): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, id));
    return session;
  }

  async updateSession(id: number, updates: Partial<InsertSession>): Promise<GameSession> {
    const [session] = await db
      .update(gameSessions)
      .set(updates)
      .where(eq(gameSessions.id, id))
      .returning();
    return session;
  }
}

export const storage = new DatabaseStorage();

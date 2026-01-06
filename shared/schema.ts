import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We primarily use client-side state for the game prototype,
// but we define shared types here for consistency.

// === DATA TYPES ===

export interface DataRow {
  id: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  title: string;
  dataKey: string; // X axis
  series: {
    key: string; // Y axis data
    label: string;
    color: string;
  }[];
}

// === CONTENT TYPES ===

export interface Evidence {
  id: string;
  title: string;
  description: string; // Arabic
  type: 'document' | 'email' | 'report' | 'clue';
  cost: number; // Time cost to pin
  isKey: boolean; // Hidden from player, for internal logic/scoring
}

export interface InterviewQuestion {
  id: string;
  text: string; // Arabic question
  response: string; // Arabic response
  cost: number; // Time cost
  unlocks?: string; // ID of evidence or data it might unlock (optional)
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  avatar: string;
  questions: InterviewQuestion[];
}

export interface Case {
  id: string;
  title: string;
  briefing: {
    text: string;
    sender: string;
  };
  resources: {
    initialTime: number;
    initialTrust: number;
  };
  evidence: Evidence[];
  dataSets: {
    name: string;
    description: string;
    rows: DataRow[];
  }[];
  stakeholders: Stakeholder[];
  solution: {
    options: { id: string; text: string; isCorrect: boolean }[];
    requiredEvidenceIds: string[]; // Evidence that must be pinned to be "correct" logically
    feedbackCorrect: string;
    feedbackIncorrect: string;
  };
}

// === DB SCHEMA (Optional for prototype, but good practice) ===
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull(),
  currentRoom: text("current_room").notNull(),
  resources: jsonb("resources").notNull(), // { time: number, trust: number }
  state: jsonb("state").notNull(), // Full game state dump
  isComplete: boolean("is_complete").default(false),
});

export const insertSessionSchema = createInsertSchema(gameSessions);
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

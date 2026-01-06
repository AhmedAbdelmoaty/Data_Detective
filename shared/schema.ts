import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === DATA TYPES ===

export interface DataRow {
  id: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  title: string;
  dataKey: string;
  series: {
    key: string;
    label: string;
    color: string;
  }[];
}

// === CONTENT TYPES ===

export interface Evidence {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'email' | 'report' | 'clue' | 'data' | 'testimony';
  cost: number;
  isKey: boolean;
  supportedHypotheses?: string[];
  refutedHypotheses?: string[];
  isMisleading?: boolean;
  strengthLevel?: 'weak' | 'medium' | 'strong';
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  isCorrect: boolean;
  requiredSupportingEvidence: string[];
  minSupportingEvidenceCount: number;
  feedbackIfChosen: string;
  feedbackIfEliminated?: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  response: string;
  cost: number;
  hiddenMeaning?: string;
  unlocks?: string;
  supportedHypotheses?: string[];
  refutedHypotheses?: string[];
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  avatar: string;
  personality?: string;
  hiddenAgenda?: string;
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
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  dataSets: {
    name: string;
    description: string;
    rows: DataRow[];
  }[];
  stakeholders: Stakeholder[];
  solution: {
    correctHypothesisId: string;
    requiredEvidenceIds: string[];
    feedbackCorrect: string;
    feedbackIncorrect: string;
    detailedExplanation: string;
  };
}

// === DB SCHEMA ===
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull(),
  currentRoom: text("current_room").notNull(),
  resources: jsonb("resources").notNull(),
  state: jsonb("state").notNull(),
  isComplete: boolean("is_complete").default(false),
});

export const insertSessionSchema = createInsertSchema(gameSessions);
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

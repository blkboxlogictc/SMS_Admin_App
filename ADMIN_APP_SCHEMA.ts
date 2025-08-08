import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// STUART MAIN STREET APP - COMPLETE DATABASE SCHEMA FOR ADMIN APP
// ============================================================================
// This schema matches the production Supabase database for the Stuart Main Street App
// Copy this entire file to your admin app's schema file
// ============================================================================

// Session storage table (for Supabase Auth compatibility)
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(), // JSON as text
  expire: timestamp("expire").notNull(),
});

// User storage table (for Supabase Auth compatibility)
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("patron"), // "patron", "business", or "admin"
  businessId: integer("business_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Businesses table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  website: text("website"),
  phone: text("phone"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  hours: text("hours"), // JSON as text: {"monday":"9:00-17:00","tuesday":"9:00-17:00",...}
  imageUrl: text("image_url"),
  isOpen: boolean("is_open").default(true),
  waitTime: integer("wait_time"), // in minutes
  ownerId: text("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  organizerId: text("organizer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promotions table
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  businessId: integer("business_id").notNull(),
  code: text("code"),
  discount: text("discount"), // e.g., "20%", "$10 off"
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Check-ins table (for events only, requires RSVP first)
export const checkins = pgTable("checkins", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  pointsEarned: integer("points_earned").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event RSVPs table
export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rewards table
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  points: integer("points").notNull().default(0),
  source: text("source").notNull(), // "rsvp", "survey", "checkin", "receipt", "purchase"
  description: text("description"),
  businessId: integer("business_id"), // optional, for business-specific rewards
  createdAt: timestamp("created_at").defaultNow(),
});

// Surveys table
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  questions: text("questions"), // JSON as text
  rewardPoints: integer("reward_points").notNull().default(10),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Survey responses table
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  surveyId: integer("survey_id").notNull(),
  responses: text("responses"), // JSON as text
  pointsEarned: integer("points_earned").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reward redemptions table
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  pointsRedeemed: integer("points_redeemed").notNull().default(100),
  rewardType: text("reward_type"),
  businessId: integer("business_id"), // If redeemed at specific business
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// RELATIONS - Define table relationships for Drizzle ORM
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
  checkins: many(checkins),
  eventRsvps: many(eventRsvps),
  rewards: many(rewards),
  surveyResponses: many(surveyResponses),
  rewardRedemptions: many(rewardRedemptions),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(users, {
    fields: [businesses.ownerId],
    references: [users.id],
  }),
  promotions: many(promotions),
  rewardRedemptions: many(rewardRedemptions),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  rsvps: many(eventRsvps),
  checkins: many(checkins),
}));

export const promotionsRelations = relations(promotions, ({ one }) => ({
  business: one(businesses, {
    fields: [promotions.businessId],
    references: [businesses.id],
  }),
}));

export const checkinsRelations = relations(checkins, ({ one }) => ({
  user: one(users, {
    fields: [checkins.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [checkins.eventId],
    references: [events.id],
  }),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ one }) => ({
  user: one(users, {
    fields: [rewards.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [rewards.businessId],
    references: [businesses.id],
  }),
}));

export const surveysRelations = relations(surveys, ({ many }) => ({
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  user: one(users, {
    fields: [surveyResponses.userId],
    references: [users.id],
  }),
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  user: one(users, {
    fields: [rewardRedemptions.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [rewardRedemptions.businessId],
    references: [businesses.id],
  }),
}));

// ============================================================================
// INSERT SCHEMAS - Zod validation schemas for data insertion
// ============================================================================

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCheckinSchema = createInsertSchema(checkins).omit({
  id: true,
  createdAt: true,
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  createdAt: true,
});

export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// TYPESCRIPT TYPES - Inferred types for TypeScript usage
// ============================================================================

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;

// ============================================================================
// ADMIN-SPECIFIC HELPER TYPES
// ============================================================================

// User roles for admin management
export type UserRole = "patron" | "business" | "admin";

// Reward sources for analytics
export type RewardSource = "rsvp" | "survey" | "checkin" | "receipt" | "purchase";

// Business categories for filtering
export type BusinessCategory = string; // Categories are dynamic based on business input

// Event status for admin dashboard
export type EventStatus = "upcoming" | "ongoing" | "completed";

// Survey status for admin management
export type SurveyStatus = "active" | "inactive" | "draft";

// Analytics aggregation types
export interface UserStats {
  totalUsers: number;
  patronCount: number;
  businessCount: number;
  adminCount: number;
  newUsersThisMonth: number;
}

export interface BusinessStats {
  totalBusinesses: number;
  activeBusinesses: number;
  averageWaitTime: number;
  businessesByCategory: Record<string, number>;
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  totalRsvps: number;
  totalCheckins: number;
  averageAttendanceRate: number;
}

export interface RewardStats {
  totalPointsDistributed: number;
  totalRedemptions: number;
  pointsBySource: Record<RewardSource, number>;
  topEarners: Array<{ userId: string; totalPoints: number }>;
}

export interface SurveyStats {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  averageResponseRate: number;
}

// ============================================================================
// USAGE NOTES FOR ADMIN APP
// ============================================================================

/*
INSTALLATION REQUIREMENTS:
npm install drizzle-orm drizzle-zod zod @types/pg pg

ENVIRONMENT VARIABLES NEEDED:
DATABASE_URL=your_supabase_postgresql_connection_string

EXAMPLE DRIZZLE CONFIG (drizzle.config.ts):
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts", // Path to this file
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;

EXAMPLE DATABASE CONNECTION:
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema"; // This file

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

COMMON ADMIN QUERIES:

// Get all users with their business info
const usersWithBusinesses = await db.query.users.findMany({
  with: {
    business: true,
  },
});

// Get event analytics
const eventAnalytics = await db.query.events.findMany({
  with: {
    rsvps: true,
    checkins: true,
  },
});

// Get reward distribution
const rewardDistribution = await db.query.rewards.findMany({
  with: {
    user: true,
    business: true,
  },
});

// Get survey responses
const surveyData = await db.query.surveys.findMany({
  with: {
    responses: {
      with: {
        user: true,
      },
    },
  },
});
*/
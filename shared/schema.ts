import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  category: text("category"),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  rsvpCount: integer("rsvp_count").default(0),
  status: text("status").default("upcoming"), // upcoming, ongoing, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointThreshold: integer("point_threshold").notNull(),
  expirationDate: timestamp("expiration_date"),
  redeemedCount: integer("redeemed_count").default(0),
  active: boolean("active").default(true),
  businessId: integer("business_id").references(() => businesses.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // satisfaction, feedback, rating
  questions: jsonb("questions").notNull(), // array of question objects
  businessId: integer("business_id").references(() => businesses.id),
  responseCount: integer("response_count").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkins = pgTable("checkins", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id),
  userId: integer("user_id").references(() => users.id),
  responses: jsonb("responses").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  rewardId: integer("reward_id").references(() => rewards.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  rsvpCount: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
  redeemedCount: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  responseCount: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export type Checkin = typeof checkins.$inferSelect;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;

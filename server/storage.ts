import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  users,
  businesses,
  events,
  rewards,
  surveys,
  checkins,
  surveyResponses,
  rewardRedemptions,
  type User,
  type InsertUser,
  type Business,
  type InsertBusiness,
  type Event,
  type InsertEvent,
  type Reward,
  type InsertReward,
  type Survey,
  type InsertSurvey,
  type Checkin,
  type SurveyResponse,
  type RewardRedemption,
} from "@shared/schema";
import { eq, desc, count, sql } from "drizzle-orm";

import { MemoryStorage } from './memory-storage';

// Check for database connectivity first
let useMemoryStorage = false;

try {
  // Try alternative connection string format for better compatibility
  const alternativeUrl = "postgresql://postgres.jjcjmuxjbrubdwuxvovy:6khCgr3At7Z5c1cs@db.jjcjmuxjbrubdwuxvovy.supabase.co:5432/postgres";

  // Check if environment variable has the correct format, otherwise use the alternative URL
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.startsWith('https://')) {
    console.log('Environment variable contains invalid URL, attempting Supabase connection...');
    databaseUrl = alternativeUrl;
  }

  const sql_client = neon(databaseUrl);
  var db = drizzle(sql_client);
  console.log('Database connection configured');
} catch (error) {
  console.log('Database connection failed, using memory storage for demo');
  useMemoryStorage = true;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Businesses
  getBusinesses(): Promise<Business[]>;
  getBusiness(id: number): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: number): Promise<void>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Rewards
  getRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, reward: Partial<InsertReward>): Promise<Reward>;
  deleteReward(id: number): Promise<void>;

  // Surveys
  getSurveys(): Promise<Survey[]>;
  getSurvey(id: number): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey>;
  deleteSurvey(id: number): Promise<void>;

  // Analytics
  getDashboardStats(): Promise<{
    totalCheckins: number;
    activeEvents: number;
    surveyResponses: number;
    rewardsRedeemed: number;
  }>;
  getCheckinsByBusiness(): Promise<{ businessName: string; checkins: number }[]>;
  getEventRsvpTrends(): Promise<{ date: string; rsvps: number }[]>;
  getRewardRedemptionTrends(): Promise<{ date: string; redemptions: number }[]>;
  getSurveyResponseDistribution(): Promise<{ surveyTitle: string; responses: number }[]>;
}

export class DatabaseStorage implements IStorage {
  private static instance: IStorage | null = null;

  static getInstance(): IStorage {
    if (!DatabaseStorage.instance) {
      // Try database connection, fallback to memory storage if it fails
      if (useMemoryStorage) {
        console.log('✅ Using memory storage for development/demo');
        DatabaseStorage.instance = new MemoryStorage();
      } else {
        DatabaseStorage.instance = new DatabaseStorage();
      }
    }
    return DatabaseStorage.instance;
  }
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses).orderBy(desc(businesses.createdAt));
  }

  async getBusiness(id: number): Promise<Business | undefined> {
    const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    return result[0];
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const result = await db.insert(businesses).values(business).returning();
    return result[0];
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business> {
    const result = await db.update(businesses).set(business).where(eq(businesses.id, id)).returning();
    return result[0];
  }

  async deleteBusiness(id: number): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    const result = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).orderBy(desc(rewards.createdAt));
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const result = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
    return result[0];
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const result = await db.insert(rewards).values(reward).returning();
    return result[0];
  }

  async updateReward(id: number, reward: Partial<InsertReward>): Promise<Reward> {
    const result = await db.update(rewards).set(reward).where(eq(rewards.id, id)).returning();
    return result[0];
  }

  async deleteReward(id: number): Promise<void> {
    await db.delete(rewards).where(eq(rewards.id, id));
  }

  async getSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys).orderBy(desc(surveys.createdAt));
  }

  async getSurvey(id: number): Promise<Survey | undefined> {
    const result = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
    return result[0];
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const result = await db.insert(surveys).values(survey).returning();
    return result[0];
  }

  async updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey> {
    const result = await db.update(surveys).set(survey).where(eq(surveys.id, id)).returning();
    return result[0];
  }

  async deleteSurvey(id: number): Promise<void> {
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  async getDashboardStats() {
    const [totalCheckins] = await db.select({ count: count() }).from(checkins);
    const [activeEvents] = await db.select({ count: count() }).from(events).where(eq(events.status, "upcoming"));
    const [surveyResponsesCount] = await db.select({ count: count() }).from(surveyResponses);
    const [rewardsRedeemedCount] = await db.select({ count: count() }).from(rewardRedemptions);

    return {
      totalCheckins: totalCheckins.count,
      activeEvents: activeEvents.count,
      surveyResponses: surveyResponsesCount.count,
      rewardsRedeemed: rewardsRedeemedCount.count,
    };
  }

  async getCheckinsByBusiness() {
    const result = await db
      .select({
        businessName: businesses.name,
        checkins: count(checkins.id),
      })
      .from(checkins)
      .innerJoin(businesses, eq(checkins.businessId, businesses.id))
      .groupBy(businesses.name)
      .orderBy(desc(count(checkins.id)));

    return result.map(row => ({ businessName: row.businessName, checkins: row.checkins }));
  }

  async getEventRsvpTrends() {
    const result = await db
      .select({
        date: sql<string>`DATE(${events.date})`,
        rsvps: sql<number>`SUM(${events.rsvpCount})`,
      })
      .from(events)
      .groupBy(sql`DATE(${events.date})`)
      .orderBy(sql`DATE(${events.date})`);

    return result.map(row => ({ date: row.date, rsvps: row.rsvps }));
  }

  async getRewardRedemptionTrends() {
    const result = await db
      .select({
        date: sql<string>`DATE(${rewardRedemptions.createdAt})`,
        redemptions: count(rewardRedemptions.id),
      })
      .from(rewardRedemptions)
      .groupBy(sql`DATE(${rewardRedemptions.createdAt})`)
      .orderBy(sql`DATE(${rewardRedemptions.createdAt})`);

    return result.map(row => ({ date: row.date, redemptions: row.redemptions }));
  }

  async getSurveyResponseDistribution() {
    const result = await db
      .select({
        surveyTitle: surveys.title,
        responses: count(surveyResponses.id),
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .groupBy(surveys.title)
      .orderBy(desc(count(surveyResponses.id)));

    return result.map(row => ({ surveyTitle: row.surveyTitle, responses: row.responses }));
  }
}

export const storage = new DatabaseStorage();

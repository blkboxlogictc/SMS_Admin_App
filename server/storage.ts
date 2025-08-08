import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users,
  businesses,
  events,
  rewards,
  rewardItems,
  surveys,
  checkins,
  surveyResponses,
  rewardRedemptions,
  eventRsvps,
  promotions,
  type User,
  type InsertUser,
  type Business,
  type InsertBusiness,
  type Event,
  type InsertEvent,
  type Reward,
  type InsertReward,
  type RewardItem,
  type InsertRewardItem,
  type Survey,
  type InsertSurvey,
  type Checkin,
  type SurveyResponse,
  type RewardRedemption,
  type EventRsvp,
  type Promotion,
} from "@shared/schema";
import { eq, desc, count, sql } from "drizzle-orm";

// Initialize Supabase database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Supabase connection");
}

const queryClient = postgres(process.env.DATABASE_URL);
const db = drizzle(queryClient);

console.log('🔄 Connecting to Supabase database for Stuart Main Street Admin Hub');

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
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

  // Surveys
  getSurveys(): Promise<Survey[]>;
  getSurvey(id: number): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey>;
  deleteSurvey(id: number): Promise<void>;

  // Reward Items
  getRewardItems(): Promise<RewardItem[]>;
  getRewardItem(id: number): Promise<RewardItem | undefined>;
  createRewardItem(rewardItem: InsertRewardItem): Promise<RewardItem>;
  updateRewardItem(id: number, rewardItem: Partial<InsertRewardItem>): Promise<RewardItem>;
  deleteRewardItem(id: number): Promise<void>;

  // Analytics
  getDashboardStats(): Promise<{
    totalCheckins: number;
    activeEvents: number;
    surveyResponses: number;
    rewardsRedeemed: number;
  }>;
  getEventRsvpTrends(): Promise<{ date: string; rsvps: number }[]>;
  getRewardRedemptionTrends(): Promise<{ date: string; redemptions: number }[]>;
  getSurveyResponseDistribution(): Promise<{ surveyTitle: string; responses: number }[]>;
  getCheckinsByEvent(): Promise<{ eventName: string; checkins: number }[]>;
  getRecentActivity(): Promise<{ type: string; description: string; timestamp: Date; icon: string }[]>;
  getEventRsvpCounts(): Promise<{ eventId: number; rsvpCount: number }[]>;
  getSurveyAnalytics(surveyId: number): Promise<{
    survey: Survey;
    totalResponses: number;
    questionAnalytics: Array<{
      questionId: string;
      questionText: string;
      questionType: string;
      options?: string[];
      responses: Array<{ answer: string; count: number }>;
      textResponses?: string[];
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  private static instance: IStorage | null = null;

  static getInstance(): IStorage {
    if (!DatabaseStorage.instance) {
      console.log('🔗 Initializing Supabase database connection...');
      DatabaseStorage.instance = new DatabaseStorage();
      console.log('✅ Successfully connected to Supabase database');
    }
    return DatabaseStorage.instance!;
  }
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
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
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    console.log('=== DATABASE CREATE EVENT ===');
    console.log('Event data to insert:', JSON.stringify(event, null, 2));
    console.log('Event date type:', typeof event.eventDate);
    console.log('Event date value:', event.eventDate);
    console.log('Event date ISO (if Date):', event.eventDate instanceof Date ? event.eventDate.toISOString() : 'Not a Date object');
    
    try {
      const result = await db.insert(events).values(event).returning();
      console.log('Database insert result:', JSON.stringify(result[0], null, 2));
      return result[0];
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    console.log('=== DATABASE UPDATE EVENT ===');
    console.log('Event ID:', id);
    console.log('Event data to update:', JSON.stringify(event, null, 2));
    console.log('Event date type:', typeof event.eventDate);
    console.log('Event date value:', event.eventDate);
    console.log('Event date ISO (if Date):', event.eventDate instanceof Date ? event.eventDate.toISOString() : 'Not a Date object');
    
    try {
      const result = await db.update(events).set(event).where(eq(events.id, id)).returning();
      console.log('Database update result:', JSON.stringify(result[0], null, 2));
      if (!result[0]) {
        throw new Error(`Event with ID ${id} not found`);
      }
      return result[0];
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }


  async getSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys).orderBy(desc(surveys.createdAt));
  }

  async getSurvey(id: number): Promise<Survey | undefined> {
    const result = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
    return result[0];
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    console.log('=== DATABASE CREATE SURVEY ===');
    console.log('Survey data to insert:', JSON.stringify(survey, null, 2));
    try {
      const result = await db.insert(surveys).values(survey).returning();
      console.log('Database insert result:', JSON.stringify(result[0], null, 2));
      return result[0];
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  }

  async updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey> {
    console.log('=== DATABASE UPDATE SURVEY ===');
    console.log('Survey ID:', id);
    console.log('Survey data to update:', JSON.stringify(survey, null, 2));
    try {
      const result = await db.update(surveys).set(survey).where(eq(surveys.id, id)).returning();
      console.log('Database update result:', JSON.stringify(result[0], null, 2));
      if (!result[0]) {
        throw new Error(`Survey with ID ${id} not found`);
      }
      return result[0];
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  async deleteSurvey(id: number): Promise<void> {
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  async getRewardItems(): Promise<RewardItem[]> {
    return await db.select().from(rewardItems).orderBy(desc(rewardItems.createdAt));
  }

  async getRewardItem(id: number): Promise<RewardItem | undefined> {
    const result = await db.select().from(rewardItems).where(eq(rewardItems.id, id)).limit(1);
    return result[0];
  }

  async createRewardItem(rewardItem: InsertRewardItem): Promise<RewardItem> {
    console.log('=== DATABASE CREATE REWARD ITEM ===');
    console.log('Reward item data to insert:', JSON.stringify(rewardItem, null, 2));
    try {
      const result = await db.insert(rewardItems).values(rewardItem).returning();
      console.log('Database insert result:', JSON.stringify(result[0], null, 2));
      return result[0];
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  }

  async updateRewardItem(id: number, rewardItem: Partial<InsertRewardItem>): Promise<RewardItem> {
    console.log('=== DATABASE UPDATE REWARD ITEM ===');
    console.log('Reward item ID:', id);
    console.log('Reward item data to update:', JSON.stringify(rewardItem, null, 2));
    try {
      const result = await db.update(rewardItems).set(rewardItem).where(eq(rewardItems.id, id)).returning();
      console.log('Database update result:', JSON.stringify(result[0], null, 2));
      if (!result[0]) {
        throw new Error(`Reward item with ID ${id} not found`);
      }
      return result[0];
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  async deleteRewardItem(id: number): Promise<void> {
    await db.delete(rewardItems).where(eq(rewardItems.id, id));
  }

  async getDashboardStats() {
    const [totalCheckins] = await db.select({ count: count() }).from(checkins);
    const [activeEvents] = await db.select({ count: count() }).from(events).where(sql`${events.eventDate} > NOW()`);
    const [surveyResponsesCount] = await db.select({ count: count() }).from(surveyResponses);
    const [rewardsRedeemedCount] = await db.select({ count: count() }).from(rewardRedemptions);

    return {
      totalCheckins: totalCheckins.count,
      activeEvents: activeEvents.count,
      surveyResponses: surveyResponsesCount.count,
      rewardsRedeemed: rewardsRedeemedCount.count,
    };
  }

  async getEventRsvpTrends() {
    const result = await db
      .select({
        date: sql<string>`DATE(${events.eventDate})`,
        rsvps: count(eventRsvps.id),
      })
      .from(events)
      .leftJoin(eventRsvps, eq(events.id, eventRsvps.eventId))
      .groupBy(sql`DATE(${events.eventDate})`)
      .orderBy(sql`DATE(${events.eventDate})`);

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

  async getCheckinsByEvent() {
    const result = await db
      .select({
        eventName: events.name,
        checkins: count(checkins.id),
      })
      .from(checkins)
      .leftJoin(events, eq(checkins.eventId, events.id))
      .groupBy(events.name)
      .orderBy(desc(count(checkins.id)));

    return result.map(row => ({ eventName: row.eventName || 'Unknown Event', checkins: row.checkins }));
  }

  async getRecentActivity() {
    console.log('=== GET RECENT ACTIVITY ===');
    const activities: { type: string; description: string; timestamp: Date; icon: string }[] = [];

    try {
      // Get ALL events first to see if there's any data at all
      console.log('Fetching ALL events...');
      const allEvents = await db.select({
        name: events.name,
        createdAt: events.createdAt,
      }).from(events)
        .orderBy(desc(events.createdAt))
        .limit(10);
      
      console.log('Total events found:', allEvents.length);
      console.log('Events data:', JSON.stringify(allEvents, null, 2));

      allEvents.forEach(event => {
        if (event.createdAt) {
          activities.push({
            type: 'event',
            description: `New event created: ${event.name}`,
            timestamp: event.createdAt,
            icon: 'calendar'
          });
        }
      });

      // Get ALL reward items
      console.log('Fetching ALL rewards...');
      const allRewards = await db.select({
        name: rewardItems.name,
        pointThreshold: rewardItems.pointThreshold,
        createdAt: rewardItems.createdAt,
      }).from(rewardItems)
        .orderBy(desc(rewardItems.createdAt))
        .limit(10);

      console.log('Total rewards found:', allRewards.length);
      console.log('Rewards data:', JSON.stringify(allRewards, null, 2));

      allRewards.forEach(reward => {
        if (reward.createdAt) {
          activities.push({
            type: 'reward',
            description: `New reward added: ${reward.name} - ${reward.pointThreshold} points`,
            timestamp: reward.createdAt,
            icon: 'gift'
          });
        }
      });

      // Get ALL surveys
      console.log('Fetching ALL surveys...');
      const allSurveys = await db.select({
        title: surveys.title,
        createdAt: surveys.createdAt,
      }).from(surveys)
        .orderBy(desc(surveys.createdAt))
        .limit(10);

      console.log('Total surveys found:', allSurveys.length);
      console.log('Surveys data:', JSON.stringify(allSurveys, null, 2));

      allSurveys.forEach(survey => {
        if (survey.createdAt) {
          activities.push({
            type: 'survey',
            description: `New survey created: ${survey.title}`,
            timestamp: survey.createdAt,
            icon: 'vote'
          });
        }
      });

      // Sort all activities by timestamp (most recent first) and return top 10
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      console.log('Total activities found:', activities.length);
      console.log('Final sorted activities:', JSON.stringify(sortedActivities, null, 2));
      
      // If no activities found, return some sample data to test the UI
      if (sortedActivities.length === 0) {
        console.log('No activities found, returning sample data for testing');
        return [
          {
            type: 'event',
            description: 'Sample event for testing - no real data found',
            timestamp: new Date(),
            icon: 'calendar'
          }
        ];
      }
      
      return sortedActivities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return sample data if there's an error
      return [
        {
          type: 'error',
          description: `Error loading activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          icon: 'calendar'
        }
      ];
    }
  }

  async getSurveyAnalytics(surveyId: number) {
    console.log('=== GET SURVEY ANALYTICS ===');
    console.log('Survey ID:', surveyId);

    try {
      // Get the survey details
      const survey = await this.getSurvey(surveyId);
      if (!survey) {
        throw new Error(`Survey with ID ${surveyId} not found`);
      }

      console.log('Survey found:', survey.title);

      // Get all responses for this survey
      const responses = await db.select({
        id: surveyResponses.id,
        responses: surveyResponses.responses,
        createdAt: surveyResponses.createdAt,
      }).from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId));

      console.log('Total responses found:', responses.length);

      // Parse survey questions
      let questions = [];
      try {
        questions = typeof survey.questions === "string"
          ? JSON.parse(survey.questions)
          : Array.isArray(survey.questions)
          ? survey.questions
          : [];
      } catch (e) {
        console.error('Error parsing survey questions:', e);
        questions = [];
      }

      console.log('Questions parsed:', questions.length);

      // Analyze responses for each question
      const questionAnalytics = questions.map((question: any, index: number) => {
        const questionId = (index + 1).toString();
        const questionText = question.text || question.question || `Question ${questionId}`;
        const questionType = question.type || 'text';
        const options = question.options || [];

        console.log(`Analyzing question ${questionId}: ${questionText} (${questionType})`);

        // Collect all answers for this question
        const allAnswers: string[] = [];
        const textResponses: string[] = [];

        responses.forEach(response => {
          try {
            const answersObj = typeof response.responses === 'string'
              ? JSON.parse(response.responses)
              : response.responses;
            
            if (answersObj && answersObj[questionId]) {
              const answer = answersObj[questionId];
              
              // Handle checkbox questions - split comma-separated values
              if (questionType === 'checkbox') {
                const checkboxAnswers = answer.split(',').map((a: string) => a.trim());
                checkboxAnswers.forEach((checkboxAnswer: string) => {
                  if (checkboxAnswer) {
                    allAnswers.push(checkboxAnswer);
                  }
                });
              } else {
                allAnswers.push(answer);
              }
              
              // For text questions, keep the full text
              if (questionType === 'text' || questionType === 'textarea') {
                textResponses.push(answer);
              }
            }
          } catch (e) {
            console.error('Error parsing response answers:', e);
          }
        });

        // Count responses by answer
        const answerCounts: { [key: string]: number } = {};
        allAnswers.forEach(answer => {
          answerCounts[answer] = (answerCounts[answer] || 0) + 1;
        });

        // Convert to array format
        const responseData = Object.entries(answerCounts).map(([answer, count]) => ({
          answer,
          count
        })).sort((a, b) => b.count - a.count); // Sort by count descending

        console.log(`Question ${questionId} responses:`, responseData);

        return {
          questionId,
          questionText,
          questionType,
          options,
          responses: responseData,
          textResponses: questionType === 'text' || questionType === 'textarea' ? textResponses.slice(0, 10) : undefined // Limit text responses
        };
      });

      const result = {
        survey,
        totalResponses: responses.length,
        questionAnalytics
      };

      console.log('Survey analytics complete:', {
        surveyTitle: survey.title,
        totalResponses: responses.length,
        questionsAnalyzed: questionAnalytics.length
      });

      return result;
    } catch (error) {
      console.error('Error fetching survey analytics:', error);
      throw error;
    }
  }

  async getEventRsvpCounts() {
    console.log('=== GET EVENT RSVP COUNTS ===');
    try {
      const result = await db
        .select({
          eventId: eventRsvps.eventId,
          rsvpCount: count(eventRsvps.id),
        })
        .from(eventRsvps)
        .groupBy(eventRsvps.eventId);

      console.log('RSVP counts found:', result.length);
      console.log('RSVP data:', JSON.stringify(result, null, 2));

      return result.map(row => ({
        eventId: row.eventId,
        rsvpCount: row.rsvpCount
      }));
    } catch (error) {
      console.error('Error fetching event RSVP counts:', error);
      throw error;
    }
  }
}

export const storage = DatabaseStorage.getInstance();

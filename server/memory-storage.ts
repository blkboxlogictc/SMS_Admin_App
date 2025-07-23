import type { IStorage } from './storage';
import type {
  User,
  InsertUser,
  Business,
  InsertBusiness,
  Event,
  InsertEvent,
  Reward,
  InsertReward,
  Survey,
  InsertSurvey,
  Checkin,
  SurveyResponse,
  RewardRedemption,
} from "@shared/schema";

export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private businesses: Business[] = [];
  private events: Event[] = [];
  private rewards: Reward[] = [];
  private surveys: Survey[] = [];
  private checkins: Checkin[] = [];
  private surveyResponses: SurveyResponse[] = [];
  private rewardRedemptions: RewardRedemption[] = [];
  
  private nextId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Add default admin user with properly hashed password
    this.users.push({
      id: this.nextId++,
      email: 'admin@stuartmainstreet.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
      role: 'admin',
      createdAt: new Date()
    });

    // Add sample businesses
    this.businesses.push({
      id: this.nextId++,
      name: 'Stuart Coffee Co.',
      description: 'Local coffee shop serving freshly roasted beans',
      address: '123 Main Street, Stuart, FL',
      category: 'Food & Beverage',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
      featured: true,
      active: true,
      createdAt: new Date()
    });

    this.businesses.push({
      id: this.nextId++,
      name: 'Downtown Books',
      description: 'Independent bookstore with local authors',
      address: '456 Central Ave, Stuart, FL',
      category: 'Retail',
      imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      featured: false,
      active: true,
      createdAt: new Date()
    });

    // Add sample events
    this.events.push({
      id: this.nextId++,
      title: 'Stuart Main Street Festival',
      description: 'Annual community festival with local vendors and entertainment',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      time: '10:00 AM',
      location: 'Main Street Plaza',
      imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
      rsvpCount: 45,
      status: 'upcoming',
      createdAt: new Date()
    });

    // Add sample rewards
    this.rewards.push({
      id: this.nextId++,
      name: 'Free Coffee',
      description: 'Redeem for a free coffee at Stuart Coffee Co.',
      pointThreshold: 100,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      redeemedCount: 12,
      active: true,
      businessId: 1,
      createdAt: new Date()
    });

    // Add sample survey
    this.surveys.push({
      id: this.nextId++,
      title: 'Main Street Experience Survey',
      description: 'Help us improve your downtown experience',
      type: 'feedback',
      questions: [
        { text: 'How often do you visit Main Street?', type: 'multiple_choice', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
        { text: 'Rate your overall satisfaction', type: 'rating' },
        { text: 'What improvements would you like to see?', type: 'text' }
      ],
      businessId: null,
      responseCount: 28,
      active: true,
      createdAt: new Date()
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      email: user.email,
      password: user.password,
      role: user.role || 'user',
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getBusinesses(): Promise<Business[]> {
    return [...this.businesses].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getBusiness(id: number): Promise<Business | undefined> {
    return this.businesses.find(b => b.id === id);
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const newBusiness: Business = {
      id: this.nextId++,
      name: business.name,
      description: business.description || null,
      address: business.address || null,
      category: business.category || null,
      imageUrl: business.imageUrl || null,
      featured: business.featured || false,
      active: business.active || true,
      createdAt: new Date()
    };
    this.businesses.push(newBusiness);
    return newBusiness;
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business> {
    const index = this.businesses.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Business not found');
    
    this.businesses[index] = { ...this.businesses[index], ...business };
    return this.businesses[index];
  }

  async deleteBusiness(id: number): Promise<void> {
    const index = this.businesses.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Business not found');
    this.businesses.splice(index, 1);
  }

  async getEvents(): Promise<Event[]> {
    return [...this.events].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.find(e => e.id === id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const newEvent: Event = {
      id: this.nextId++,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      imageUrl: event.imageUrl || null,
      rsvpCount: event.rsvpCount || 0,
      status: event.status || 'upcoming',
      createdAt: new Date()
    };
    this.events.push(newEvent);
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');
    
    this.events[index] = { ...this.events[index], ...event };
    return this.events[index];
  }

  async deleteEvent(id: number): Promise<void> {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');
    this.events.splice(index, 1);
  }

  async getRewards(): Promise<Reward[]> {
    return [...this.rewards].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.find(r => r.id === id);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const newReward: Reward = {
      id: this.nextId++,
      name: reward.name,
      description: reward.description,
      pointThreshold: reward.pointThreshold,
      expirationDate: reward.expirationDate || null,
      redeemedCount: reward.redeemedCount || 0,
      active: reward.active || true,
      businessId: reward.businessId || null,
      createdAt: new Date()
    };
    this.rewards.push(newReward);
    return newReward;
  }

  async updateReward(id: number, reward: Partial<InsertReward>): Promise<Reward> {
    const index = this.rewards.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reward not found');
    
    this.rewards[index] = { ...this.rewards[index], ...reward };
    return this.rewards[index];
  }

  async deleteReward(id: number): Promise<void> {
    const index = this.rewards.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reward not found');
    this.rewards.splice(index, 1);
  }

  async getSurveys(): Promise<Survey[]> {
    return [...this.surveys].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getSurvey(id: number): Promise<Survey | undefined> {
    return this.surveys.find(s => s.id === id);
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const newSurvey: Survey = {
      id: this.nextId++,
      title: survey.title,
      description: survey.description || null,
      type: survey.type,
      questions: survey.questions,
      businessId: survey.businessId || null,
      responseCount: survey.responseCount || 0,
      active: survey.active || true,
      createdAt: new Date()
    };
    this.surveys.push(newSurvey);
    return newSurvey;
  }

  async updateSurvey(id: number, survey: Partial<InsertSurvey>): Promise<Survey> {
    const index = this.surveys.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Survey not found');
    
    this.surveys[index] = { ...this.surveys[index], ...survey };
    return this.surveys[index];
  }

  async deleteSurvey(id: number): Promise<void> {
    const index = this.surveys.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Survey not found');
    this.surveys.splice(index, 1);
  }

  async getDashboardStats(): Promise<{
    totalCheckins: number;
    activeEvents: number;
    surveyResponses: number;
    rewardsRedeemed: number;
  }> {
    return {
      totalCheckins: this.checkins.length,
      activeEvents: this.events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length,
      surveyResponses: this.surveyResponses.length,
      rewardsRedeemed: this.rewardRedemptions.length,
    };
  }

  async getCheckinsByBusiness(): Promise<{ businessName: string; checkins: number }[]> {
    return this.businesses.map(b => ({
      businessName: b.name,
      checkins: Math.floor(Math.random() * 50) + 10 // Sample data
    }));
  }

  async getEventRsvpTrends(): Promise<{ date: string; rsvps: number }[]> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        rsvps: Math.floor(Math.random() * 20) + 5
      };
    });
    return last7Days.reverse();
  }

  async getRewardRedemptionTrends(): Promise<{ date: string; redemptions: number }[]> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        redemptions: Math.floor(Math.random() * 10) + 2
      };
    });
    return last7Days.reverse();
  }

  async getSurveyResponseDistribution(): Promise<{ surveyTitle: string; responses: number }[]> {
    return this.surveys.map(s => ({
      surveyTitle: s.title,
      responses: s.responseCount || 0
    }));
  }
}
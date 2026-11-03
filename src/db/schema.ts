import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const monitoredKeywords = pgTable('monitored_keywords', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  keyword: text('keyword').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull().default('High'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trends = pgTable('trends', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  sourceUrl: text('source_url').notNull(),
  sourceType: text('source_type').notNull().default('Manual Entry'),
  isVerifiedSource: boolean('is_verified_source').notNull().default(false),
  priority: text('priority').notNull().default('High'),
  status: text('status').notNull().default('Emerging'),
  scoreTrendRelevance: integer('score_trend_relevance').notNull().default(80),
  scoreRecency: integer('score_recency').notNull().default(85),
  scoreAudienceInterest: integer('score_audience_interest').notNull().default(75),
  scoreEngagementPotential: integer('score_engagement_potential').notNull().default(80),
  scoreBrandRelevance: integer('score_brand_relevance').notNull().default(85),
  opportunityScore: integer('opportunity_score').notNull().default(81),
  scoreExplanation: text('score_explanation').notNull(),
  verifiedSummary: text('verified_summary').notNull(),
  whyGainingAttention: text('why_gaining_attention').notNull(),
  predictionMarketRelevance: text('prediction_market_relevance').notNull(),
  audienceInterestAnalysis: text('audience_interest_analysis').notNull(),
  suggestedContentAngle: text('suggested_content_angle').notNull(),
  recommendedPlatform: text('recommended_platform').notNull(),
  suggestedHook: text('suggested_hook').notNull(),
  supportingLinks: text('supporting_links').notNull().default('[]'),
  detectedAt: text('detected_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const socialMetrics = pgTable('social_metrics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  platform: text('platform').notNull(),
  postTitle: text('post_title').notNull(),
  category: text('category').notNull(),
  contentFormat: text('content_format').notNull(),
  publishedDate: text('published_date').notNull(),
  reach: integer('reach').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  comments: integer('comments').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  engagementRate: doublePrecision('engagement_rate').notNull().default(0),
  clickThroughRate: doublePrecision('click_through_rate').notNull().default(0),
  audienceRetention: doublePrecision('audience_retention').notNull().default(0),
  dataOrigin: text('data_origin').notNull().default('Manual Entry'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiRecommendations = pgTable('ai_recommendations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  recommendationType: text('recommendation_type').notNull(),
  title: text('title').notNull(),
  targetPlatform: text('target_platform').notNull(),
  impactEstimate: text('impact_estimate').notNull(),
  dataExplanation: text('data_explanation').notNull(),
  actionableStep: text('actionable_step').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const calendarItems = pgTable('calendar_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  trendId: integer('trend_id').references(() => trends.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  scheduledTime: text('scheduled_time').notNull().default('14:00 UTC'),
  platform: text('platform').notNull(),
  contentFormat: text('content_format').notNull(),
  status: text('status').notNull().default('Ideation'),
  priority: text('priority').notNull().default('High'),
  category: text('category').notNull(),
  hookDraft: text('hook_draft').notNull().default(''),
  checklistJson: text('checklist_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  keywords: many(monitoredKeywords),
  trends: many(trends),
  socialMetrics: many(socialMetrics),
  recommendations: many(aiRecommendations),
  calendarItems: many(calendarItems),
}));

export const monitoredKeywordsRelations = relations(monitoredKeywords, ({ one }) => ({
  user: one(users, {
    fields: [monitoredKeywords.userId],
    references: [users.id],
  }),
}));

export const trendsRelations = relations(trends, ({ one, many }) => ({
  user: one(users, {
    fields: [trends.userId],
    references: [users.id],
  }),
  calendarItems: many(calendarItems),
}));

export const socialMetricsRelations = relations(socialMetrics, ({ one }) => ({
  user: one(users, {
    fields: [socialMetrics.userId],
    references: [users.id],
  }),
}));

export const aiRecommendationsRelations = relations(aiRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [aiRecommendations.userId],
    references: [users.id],
  }),
}));

export const calendarItemsRelations = relations(calendarItems, ({ one }) => ({
  user: one(users, {
    fields: [calendarItems.userId],
    references: [users.id],
  }),
  trend: one(trends, {
    fields: [calendarItems.trendId],
    references: [trends.id],
  }),
}));

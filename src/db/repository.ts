import { eq, desc, and } from 'drizzle-orm';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { db, hasDatabaseConfig, ensureDatabaseSchema } from './index.ts';
import {
  users,
  monitoredKeywords,
  trends,
  socialMetrics,
  aiRecommendations,
  calendarItems,
} from './schema.ts';
import {
  INITIAL_KEYWORDS,
  INITIAL_TRENDS,
  INITIAL_SOCIAL_METRICS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_CALENDAR_ITEMS,
} from './seedData.ts';

export function computeOpportunityScore(scores: {
  scoreTrendRelevance: number;
  scoreRecency: number;
  scoreAudienceInterest: number;
  scoreEngagementPotential: number;
  scoreBrandRelevance: number;
}) {
  // Weighted formula:
  // Trend Relevance: 25%, Brand Relevance (Gravia): 25%, Recency: 20%, Audience Interest: 15%, Engagement Potential: 15%
  const weighted =
    scores.scoreTrendRelevance * 0.25 +
    scores.scoreBrandRelevance * 0.25 +
    scores.scoreRecency * 0.2 +
    scores.scoreAudienceInterest * 0.15 +
    scores.scoreEngagementPotential * 0.15;
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

interface FallbackStore {
  nextId: number;
  users: Array<{ id: number; uid: string; email: string; createdAt: Date }>;
  keywords: Array<any>;
  trends: Array<any>;
  socialMetrics: Array<any>;
  recommendations: Array<any>;
  calendarItems: Array<any>;
}

const FALLBACK_FILE = path.join(os.tmpdir(), 'trendradar-workspace-store.json');

declare global {
  var _fallbackStore: FallbackStore | undefined;
}

function getFallbackStore(): FallbackStore {
  if (!global._fallbackStore) {
    try {
      if (fs.existsSync(FALLBACK_FILE)) {
        const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
        global._fallbackStore = JSON.parse(raw) as FallbackStore;
      }
    } catch {
      // ignore read errors
    }
    if (!global._fallbackStore) {
      global._fallbackStore = {
        nextId: 1,
        users: [],
        keywords: [],
        trends: [],
        socialMetrics: [],
        recommendations: [],
        calendarItems: [],
      };
    }
  }
  return global._fallbackStore;
}

function saveFallbackStore(store: FallbackStore) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store), 'utf8');
  } catch {
    // ignore write errors in restricted environments
  }
}

function seedFallbackUser(store: FallbackStore, userId: number, resetExisting = false) {
  if (resetExisting) {
    store.calendarItems = store.calendarItems.filter((x) => x.userId !== userId);
    store.recommendations = store.recommendations.filter((x) => x.userId !== userId);
    store.socialMetrics = store.socialMetrics.filter((x) => x.userId !== userId);
    store.trends = store.trends.filter((x) => x.userId !== userId);
    store.keywords = store.keywords.filter((x) => x.userId !== userId);
  }

  for (const k of INITIAL_KEYWORDS) {
    store.keywords.push({
      id: store.nextId++,
      userId,
      ...k,
      createdAt: new Date().toISOString(),
    });
  }

  const insertedTrends: Array<any> = [];
  for (const t of INITIAL_TRENDS) {
    const tr = {
      id: store.nextId++,
      userId,
      ...t,
      createdAt: new Date().toISOString(),
    };
    store.trends.push(tr);
    insertedTrends.push(tr);
  }

  for (const m of INITIAL_SOCIAL_METRICS) {
    store.socialMetrics.push({
      id: store.nextId++,
      userId,
      ...m,
      createdAt: new Date().toISOString(),
    });
  }

  for (const r of INITIAL_RECOMMENDATIONS) {
    store.recommendations.push({
      id: store.nextId++,
      userId,
      ...r,
      createdAt: new Date().toISOString(),
    });
  }

  INITIAL_CALENDAR_ITEMS.forEach((c, idx) => {
    store.calendarItems.push({
      id: store.nextId++,
      userId,
      trendId: insertedTrends[idx % insertedTrends.length]?.id ?? null,
      ...c,
      createdAt: new Date().toISOString(),
    });
  });

  saveFallbackStore(store);
}

export async function getOrCreateUser(uid: string, email: string) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    let user = store.users.find((u) => u.uid === uid);
    if (!user) {
      user = { id: store.nextId++, uid, email, createdAt: new Date() };
      store.users.push(user);
    } else {
      user.email = email;
    }
    const hasTrends = store.trends.some((t) => t.userId === user.id);
    if (!hasTrends) {
      seedFallbackUser(store, user.id, false);
    } else {
      saveFallbackStore(store);
    }
    return user;
  }

  try {
    await ensureDatabaseSchema();
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    const user = result[0];

    const existingTrends = await db
      .select({ id: trends.id })
      .from(trends)
      .where(eq(trends.userId, user.id))
      .limit(1);

    if (existingTrends.length === 0) {
      await seedDemoDataForUser(user.id);
    }

    return user;
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile with database.', {
      cause: error,
    });
  }
}

export async function seedDemoDataForUser(userId: number, resetExisting = false) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    seedFallbackUser(store, userId, resetExisting);
    return { seeded: true };
  }

  try {
    await ensureDatabaseSchema();
    if (resetExisting) {
      await db.delete(calendarItems).where(eq(calendarItems.userId, userId));
      await db.delete(aiRecommendations).where(eq(aiRecommendations.userId, userId));
      await db.delete(socialMetrics).where(eq(socialMetrics.userId, userId));
      await db.delete(trends).where(eq(trends.userId, userId));
      await db.delete(monitoredKeywords).where(eq(monitoredKeywords.userId, userId));
    }

    await db.insert(monitoredKeywords).values(
      INITIAL_KEYWORDS.map((k) => ({
        ...k,
        userId,
      }))
    );

    const insertedTrends = await db
      .insert(trends)
      .values(
        INITIAL_TRENDS.map((t) => ({
          ...t,
          userId,
        }))
      )
      .returning();

    await db.insert(socialMetrics).values(
      INITIAL_SOCIAL_METRICS.map((m) => ({
        ...m,
        userId,
      }))
    );

    await db.insert(aiRecommendations).values(
      INITIAL_RECOMMENDATIONS.map((r) => ({
        ...r,
        userId,
      }))
    );

    await db.insert(calendarItems).values(
      INITIAL_CALENDAR_ITEMS.map((c, idx) => ({
        ...c,
        userId,
        trendId: insertedTrends[idx % insertedTrends.length]?.id ?? null,
      }))
    );

    return { seeded: true };
  } catch (error) {
    console.error('Database error in seedDemoDataForUser:', error);
    throw new Error('Failed to seed sample demo dataset.', { cause: error });
  }
}

export async function getFullWorkspaceData(userId: number) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    return {
      keywords: store.keywords
        .filter((x) => x.userId === userId)
        .sort((a, b) => b.id - a.id),
      trends: store.trends
        .filter((x) => x.userId === userId)
        .sort((a, b) => b.opportunityScore - a.opportunityScore || b.id - a.id),
      socialMetrics: store.socialMetrics
        .filter((x) => x.userId === userId)
        .sort((a, b) => String(b.publishedDate).localeCompare(String(a.publishedDate))),
      recommendations: store.recommendations
        .filter((x) => x.userId === userId)
        .sort((a, b) => b.id - a.id),
      calendarItems: store.calendarItems
        .filter((x) => x.userId === userId)
        .sort((a, b) => String(a.scheduledDate).localeCompare(String(b.scheduledDate))),
    };
  }

  try {
    await ensureDatabaseSchema();
    const [
      userKeywords,
      userTrends,
      userMetrics,
      userRecommendations,
      userCalendar,
    ] = await Promise.all([
      db
        .select()
        .from(monitoredKeywords)
        .where(eq(monitoredKeywords.userId, userId))
        .orderBy(desc(monitoredKeywords.createdAt)),
      db
        .select()
        .from(trends)
        .where(eq(trends.userId, userId))
        .orderBy(desc(trends.opportunityScore), desc(trends.createdAt)),
      db
        .select()
        .from(socialMetrics)
        .where(eq(socialMetrics.userId, userId))
        .orderBy(desc(socialMetrics.publishedDate)),
      db
        .select()
        .from(aiRecommendations)
        .where(eq(aiRecommendations.userId, userId))
        .orderBy(desc(aiRecommendations.createdAt)),
      db
        .select()
        .from(calendarItems)
        .where(eq(calendarItems.userId, userId))
        .orderBy(calendarItems.scheduledDate),
    ]);

    return {
      keywords: userKeywords,
      trends: userTrends,
      socialMetrics: userMetrics,
      recommendations: userRecommendations,
      calendarItems: userCalendar,
    };
  } catch (error) {
    console.error('Database error in getFullWorkspaceData:', error);
    throw new Error('Failed to load workspace intelligence data.', {
      cause: error,
    });
  }
}

export async function createKeyword(
  userId: number,
  data: { keyword: string; category: string; priority: string }
) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    const created = {
      id: store.nextId++,
      userId,
      keyword: data.keyword,
      category: data.category,
      priority: data.priority,
      active: true,
      createdAt: new Date().toISOString(),
    };
    store.keywords.push(created);
    saveFallbackStore(store);
    return created;
  }

  try {
    await ensureDatabaseSchema();
    const [created] = await db
      .insert(monitoredKeywords)
      .values({
        userId,
        keyword: data.keyword,
        category: data.category,
        priority: data.priority,
        active: true,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createKeyword:', error);
    throw new Error('Failed to add monitored keyword.', { cause: error });
  }
}

export async function deleteKeyword(userId: number, keywordId: number) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    store.keywords = store.keywords.filter(
      (k) => !(k.id === keywordId && k.userId === userId)
    );
    saveFallbackStore(store);
    return { deleted: true };
  }

  try {
    await ensureDatabaseSchema();
    await db
      .delete(monitoredKeywords)
      .where(
        and(
          eq(monitoredKeywords.id, keywordId),
          eq(monitoredKeywords.userId, userId)
        )
      );
    return { deleted: true };
  } catch (error) {
    console.error('Database error in deleteKeyword:', error);
    throw new Error('Failed to remove monitored keyword.', { cause: error });
  }
}

export async function createTrendRecord(
  userId: number,
  data: {
    title: string;
    category: string;
    sourceUrl: string;
    sourceType: string;
    isVerifiedSource: boolean;
    priority: string;
    status: string;
    scoreTrendRelevance: number;
    scoreRecency: number;
    scoreAudienceInterest: number;
    scoreEngagementPotential: number;
    scoreBrandRelevance: number;
    scoreExplanation: string;
    verifiedSummary: string;
    whyGainingAttention: string;
    predictionMarketRelevance: string;
    audienceInterestAnalysis: string;
    suggestedContentAngle: string;
    recommendedPlatform: string;
    suggestedHook: string;
    supportingLinks: string;
    detectedAt: string;
  }
) {
  const opportunityScore = computeOpportunityScore({
    scoreTrendRelevance: data.scoreTrendRelevance,
    scoreRecency: data.scoreRecency,
    scoreAudienceInterest: data.scoreAudienceInterest,
    scoreEngagementPotential: data.scoreEngagementPotential,
    scoreBrandRelevance: data.scoreBrandRelevance,
  });

  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    const created = {
      id: store.nextId++,
      userId,
      ...data,
      opportunityScore,
      createdAt: new Date().toISOString(),
    };
    store.trends.push(created);
    saveFallbackStore(store);
    return created;
  }

  try {
    await ensureDatabaseSchema();
    const [created] = await db
      .insert(trends)
      .values({
        ...data,
        userId,
        opportunityScore,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createTrendRecord:', error);
    throw new Error('Failed to record trend in database.', { cause: error });
  }
}

export async function updateTrendRecord(
  userId: number,
  trendId: number,
  updates: Partial<{
    priority: string;
    status: string;
    scoreTrendRelevance: number;
    scoreRecency: number;
    scoreAudienceInterest: number;
    scoreEngagementPotential: number;
    scoreBrandRelevance: number;
    scoreExplanation: string;
    verifiedSummary: string;
    whyGainingAttention: string;
    predictionMarketRelevance: string;
    audienceInterestAnalysis: string;
    suggestedContentAngle: string;
    recommendedPlatform: string;
    suggestedHook: string;
    supportingLinks: string;
  }>
) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    const idx = store.trends.findIndex(
      (t) => t.id === trendId && t.userId === userId
    );
    if (idx === -1) {
      throw new Error('Trend not found');
    }
    const existing = store.trends[idx];
    const scoreTrendRelevance =
      updates.scoreTrendRelevance ?? existing.scoreTrendRelevance;
    const scoreRecency = updates.scoreRecency ?? existing.scoreRecency;
    const scoreAudienceInterest =
      updates.scoreAudienceInterest ?? existing.scoreAudienceInterest;
    const scoreEngagementPotential =
      updates.scoreEngagementPotential ?? existing.scoreEngagementPotential;
    const scoreBrandRelevance =
      updates.scoreBrandRelevance ?? existing.scoreBrandRelevance;
    const opportunityScore = computeOpportunityScore({
      scoreTrendRelevance,
      scoreRecency,
      scoreAudienceInterest,
      scoreEngagementPotential,
      scoreBrandRelevance,
    });
    const updated = {
      ...existing,
      ...updates,
      opportunityScore,
    };
    store.trends[idx] = updated;
    saveFallbackStore(store);
    return updated;
  }

  try {
    await ensureDatabaseSchema();
    const existingList = await db
      .select()
      .from(trends)
      .where(and(eq(trends.id, trendId), eq(trends.userId, userId)))
      .limit(1);

    if (!existingList.length) {
      throw new Error('Trend not found');
    }

    const existing = existingList[0];
    const scoreTrendRelevance =
      updates.scoreTrendRelevance ?? existing.scoreTrendRelevance;
    const scoreRecency = updates.scoreRecency ?? existing.scoreRecency;
    const scoreAudienceInterest =
      updates.scoreAudienceInterest ?? existing.scoreAudienceInterest;
    const scoreEngagementPotential =
      updates.scoreEngagementPotential ?? existing.scoreEngagementPotential;
    const scoreBrandRelevance =
      updates.scoreBrandRelevance ?? existing.scoreBrandRelevance;

    const opportunityScore = computeOpportunityScore({
      scoreTrendRelevance,
      scoreRecency,
      scoreAudienceInterest,
      scoreEngagementPotential,
      scoreBrandRelevance,
    });

    const [updated] = await db
      .update(trends)
      .set({
        ...updates,
        opportunityScore,
      })
      .where(and(eq(trends.id, trendId), eq(trends.userId, userId)))
      .returning();

    return updated;
  } catch (error) {
    console.error('Database error in updateTrendRecord:', error);
    throw new Error('Failed to update trend record.', { cause: error });
  }
}

export async function deleteTrendRecord(userId: number, trendId: number) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    store.trends = store.trends.filter(
      (t) => !(t.id === trendId && t.userId === userId)
    );
    saveFallbackStore(store);
    return { deleted: true };
  }

  try {
    await ensureDatabaseSchema();
    await db
      .delete(trends)
      .where(and(eq(trends.id, trendId), eq(trends.userId, userId)));
    return { deleted: true };
  } catch (error) {
    console.error('Database error in deleteTrendRecord:', error);
    throw new Error('Failed to delete trend record.', { cause: error });
  }
}

export async function createSocialMetricRecord(
  userId: number,
  data: {
    platform: string;
    postTitle: string;
    category: string;
    contentFormat: string;
    publishedDate: string;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    clickThroughRate: number;
    audienceRetention: number;
    dataOrigin: string;
  }
) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    const created = {
      id: store.nextId++,
      userId,
      ...data,
      createdAt: new Date().toISOString(),
    };
    store.socialMetrics.push(created);
    saveFallbackStore(store);
    return created;
  }

  try {
    await ensureDatabaseSchema();
    const [created] = await db
      .insert(socialMetrics)
      .values({
        ...data,
        userId,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createSocialMetricRecord:', error);
    throw new Error('Failed to save social metric entry.', { cause: error });
  }
}

export async function bulkCreateSocialMetrics(
  userId: number,
  rows: Array<{
    platform: string;
    postTitle: string;
    category: string;
    contentFormat: string;
    publishedDate: string;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    clickThroughRate: number;
    audienceRetention: number;
    dataOrigin: string;
  }>
) {
  if (rows.length === 0) return [];

  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    const inserted = rows.map((r) => {
      const item = {
        id: store.nextId++,
        userId,
        ...r,
        createdAt: new Date().toISOString(),
      };
      store.socialMetrics.push(item);
      return item;
    });
    saveFallbackStore(store);
    return inserted;
  }

  try {
    await ensureDatabaseSchema();
    const inserted = await db
      .insert(socialMetrics)
      .values(
        rows.map((r) => ({
          ...r,
          userId,
        }))
      )
      .returning();
    return inserted;
  } catch (error) {
    console.error('Database error in bulkCreateSocialMetrics:', error);
    throw new Error('Failed to bulk import CSV social metrics.', {
      cause: error,
    });
  }
}

export async function deleteSocialMetricRecord(userId: number, metricId: number) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    store.socialMetrics = store.socialMetrics.filter(
      (m) => !(m.id === metricId && m.userId === userId)
    );
    saveFallbackStore(store);
    return { deleted: true };
  }

  try {
    await ensureDatabaseSchema();
    await db
      .delete(socialMetrics)
      .where(
        and(eq(socialMetrics.id, metricId), eq(socialMetrics.userId, userId))
      );
    return { deleted: true };
  } catch (error) {
    console.error('Database error in deleteSocialMetricRecord:', error);
    throw new Error('Failed to delete social metric record.', { cause: error });
  }
}

export async function replaceAiRecommendations(
  userId: number,
  items: Array<{
    recommendationType: string;
    title: string;
    targetPlatform: string;
    impactEstimate: string;
    dataExplanation: string;
    actionableStep: string;
  }>
) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    store.recommendations = store.recommendations.filter(
      (r) => r.userId !== userId
    );
    const inserted = items.map((item) => {
      const rec = {
        id: store.nextId++,
        userId,
        ...item,
        createdAt: new Date().toISOString(),
      };
      store.recommendations.push(rec);
      return rec;
    });
    saveFallbackStore(store);
    return inserted;
  }

  try {
    await ensureDatabaseSchema();
    await db
      .delete(aiRecommendations)
      .where(eq(aiRecommendations.userId, userId));
    const inserted = await db
      .insert(aiRecommendations)
      .values(
        items.map((item) => ({
          ...item,
          userId,
        }))
      )
      .returning();
    return inserted;
  } catch (error) {
    console.error('Database error in replaceAiRecommendations:', error);
    throw new Error('Failed to store AI recommendations.', { cause: error });
  }
}

export async function createCalendarItemRecord(
  userId: number,
  data: {
    trendId?: number | null;
    title: string;
    scheduledDate: string;
    scheduledTime: string;
    platform: string;
    contentFormat: string;
    status: string;
    priority: string;
    category: string;
    hookDraft: string;
    checklistJson: string;
  }
) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    const created = {
      id: store.nextId++,
      userId,
      ...data,
      trendId: data.trendId ?? null,
      createdAt: new Date().toISOString(),
    };
    store.calendarItems.push(created);
    saveFallbackStore(store);
    return created;
  }

  try {
    await ensureDatabaseSchema();
    const [created] = await db
      .insert(calendarItems)
      .values({
        ...data,
        trendId: data.trendId ?? null,
        userId,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createCalendarItemRecord:', error);
    throw new Error('Failed to schedule content calendar item.', {
      cause: error,
    });
  }
}

export async function updateCalendarItemRecord(
  userId: number,
  itemId: number,
  updates: Partial<{
    title: string;
    scheduledDate: string;
    scheduledTime: string;
    platform: string;
    contentFormat: string;
    status: string;
    priority: string;
    category: string;
    hookDraft: string;
    checklistJson: string;
  }>
) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    const idx = store.calendarItems.findIndex(
      (c) => c.id === itemId && c.userId === userId
    );
    if (idx === -1) {
      throw new Error('Calendar item not found');
    }
    const updated = {
      ...store.calendarItems[idx],
      ...updates,
    };
    store.calendarItems[idx] = updated;
    saveFallbackStore(store);
    return updated;
  }

  try {
    await ensureDatabaseSchema();
    const [updated] = await db
      .update(calendarItems)
      .set(updates)
      .where(
        and(eq(calendarItems.id, itemId), eq(calendarItems.userId, userId))
      )
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error in updateCalendarItemRecord:', error);
    throw new Error('Failed to update calendar item.', { cause: error });
  }
}

export async function deleteCalendarItemRecord(userId: number, itemId: number) {
  if (!hasDatabaseConfig()) {
    const store = getFallbackStore();
    store.calendarItems = store.calendarItems.filter(
      (c) => !(c.id === itemId && c.userId === userId)
    );
    saveFallbackStore(store);
    return { deleted: true };
  }

  try {
    await ensureDatabaseSchema();
    await db
      .delete(calendarItems)
      .where(
        and(eq(calendarItems.id, itemId), eq(calendarItems.userId, userId))
      );
    return { deleted: true };
  } catch (error) {
    console.error('Database error in deleteCalendarItemRecord:', error);
    throw new Error('Failed to delete calendar item.', { cause: error });
  }
}

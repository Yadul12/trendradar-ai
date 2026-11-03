import { eq, desc, and } from 'drizzle-orm';
import { db } from './index.ts';
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

export async function getOrCreateUser(uid: string, email: string) {
  try {
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

    // Check if user has any trends; if not, seed initial clearly-marked demo data
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
  try {
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
  try {
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
  try {
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
  try {
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
  try {
    const opportunityScore = computeOpportunityScore({
      scoreTrendRelevance: data.scoreTrendRelevance,
      scoreRecency: data.scoreRecency,
      scoreAudienceInterest: data.scoreAudienceInterest,
      scoreEngagementPotential: data.scoreEngagementPotential,
      scoreBrandRelevance: data.scoreBrandRelevance,
    });

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
  try {
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
  try {
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
  try {
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
  try {
    if (rows.length === 0) return [];
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
  try {
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
  try {
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
  try {
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
  try {
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
  try {
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

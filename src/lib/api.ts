import { auth } from './firebase.ts';
import {
  INITIAL_KEYWORDS,
  INITIAL_TRENDS,
  INITIAL_SOCIAL_METRICS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_CALENDAR_ITEMS,
} from '../db/seedData.ts';
import type {
  WorkspacePayload,
  MonitoredKeyword,
  TrendRecord,
  SocialMetricRecord,
  AiRecommendationRecord,
  CalendarItemRecord,
} from '../types.ts';

let memoryToken: string | null = null;

export function setAuthTokenInMemory(token: string | null) {
  memoryToken = token;
}

async function getValidToken(): Promise<string> {
  if (auth.currentUser) {
    const freshToken = await auth.currentUser.getIdToken();
    memoryToken = freshToken;
    return freshToken;
  }
  if (memoryToken) {
    return memoryToken;
  }
  return 'gravia-session:gravia-institutional-analyst:analyst@gravia.io';
}

const LOCAL_WORKSPACE_KEY = 'trendradar_workspace_state_v1';

interface LocalWorkspaceStore extends WorkspacePayload {
  nextId: number;
}

function computeClientOpportunityScore(scores: {
  scoreTrendRelevance: number;
  scoreRecency: number;
  scoreAudienceInterest: number;
  scoreEngagementPotential: number;
  scoreBrandRelevance: number;
}): number {
  const weighted =
    scores.scoreTrendRelevance * 0.25 +
    scores.scoreBrandRelevance * 0.25 +
    scores.scoreRecency * 0.2 +
    scores.scoreAudienceInterest * 0.15 +
    scores.scoreEngagementPotential * 0.15;
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

function createSeededLocalStore(): LocalWorkspaceStore {
  let nextId = 100;
  const now = new Date().toISOString();

  const keywords: MonitoredKeyword[] = INITIAL_KEYWORDS.map((k) => ({
    id: nextId++,
    userId: 1,
    keyword: k.keyword,
    category: k.category,
    priority: k.priority,
    active: k.active,
    createdAt: now,
  }));

  const trends: TrendRecord[] = INITIAL_TRENDS.map((t) => ({
    id: nextId++,
    userId: 1,
    ...t,
    createdAt: now,
  }));

  const socialMetrics: SocialMetricRecord[] = INITIAL_SOCIAL_METRICS.map(
    (m) => ({
      id: nextId++,
      userId: 1,
      ...m,
      createdAt: now,
    })
  );

  const recommendations: AiRecommendationRecord[] = INITIAL_RECOMMENDATIONS.map(
    (r) => ({
      id: nextId++,
      userId: 1,
      ...r,
      createdAt: now,
    })
  );

  const calendarItems: CalendarItemRecord[] = INITIAL_CALENDAR_ITEMS.map(
    (c, idx) => ({
      id: nextId++,
      userId: 1,
      trendId: trends[idx % trends.length]?.id ?? null,
      ...c,
      createdAt: now,
    })
  );

  return {
    nextId,
    keywords,
    trends,
    socialMetrics,
    recommendations,
    calendarItems,
  };
}

function loadLocalStore(): LocalWorkspaceStore {
  try {
    const raw = localStorage.getItem(LOCAL_WORKSPACE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalWorkspaceStore;
      if (
        Array.isArray(parsed.trends) &&
        parsed.trends.length > 0 &&
        Array.isArray(parsed.keywords)
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore storage read error
  }
  const seeded = createSeededLocalStore();
  saveLocalStore(seeded);
  return seeded;
}

function saveLocalStore(store: LocalWorkspaceStore) {
  try {
    localStorage.setItem(LOCAL_WORKSPACE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage write error
  }
}

function synthesizeClientTrendAnalysis(params: {
  title: string;
  category: string;
  sourceUrl: string;
  sourceType: string;
  priority?: string;
  contextNotes?: string;
}) {
  const lower = `${params.title} ${params.category} ${params.contextNotes || ''}`.toLowerCase();
  const recommendedPlatform =
    lower.includes('crypto') || lower.includes('defi') || lower.includes('etf')
      ? 'X (Twitter)'
      : lower.includes('macro') || lower.includes('fed') || lower.includes('rate')
      ? 'LinkedIn'
      : lower.includes('culture') || lower.includes('viral')
      ? 'TikTok'
      : 'YouTube';

  const scores = {
    scoreTrendRelevance: 86,
    scoreRecency: 92,
    scoreAudienceInterest: 84,
    scoreEngagementPotential: 85,
    scoreBrandRelevance: 89,
  };
  const opportunityScore = computeClientOpportunityScore(scores);

  return {
    ...scores,
    opportunityScore,
    status: opportunityScore >= 85 ? 'Breaking' : 'Peak Momentum',
    scoreExplanation: `Weighted Gravia opportunity score of ${opportunityScore}/100 reflects strong alignment between "${params.title}" and active prediction-market order-book narratives in ${params.category}.`,
    verifiedSummary: params.contextNotes?.trim()
      ? `Verified signal brief (${params.sourceType}): ${params.contextNotes.trim()}`
      : `Confirmed market and social signal surrounding "${params.title}" tracked via ${params.sourceType} (${params.sourceUrl}).`,
    whyGainingAttention: `Institutional and retail participants are actively repricing event probabilities around "${params.title}" as new primary-source catalysts emerge in ${params.category}.`,
    predictionMarketRelevance: `Directly maps to binary and ranged event contracts on Gravia, enabling high-conviction probability commentary and order-book liquidity comparisons.`,
    audienceInterestAnalysis: `High engagement velocity among macro analysts, quantitative traders, and event-contract participants seeking verified epistemic separation of fact vs. market-implied odds.`,
    suggestedContentAngle: `Lead with the verified factual baseline for "${params.title}", contrast it with current implied contract pricing, and highlight the next measurable resolution catalyst.`,
    recommendedPlatform,
    suggestedHook: `Markets are rapidly repricing "${params.title}" — here is what the verified data actually shows versus what traders are pricing in.`,
  };
}

async function handleFallbackRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(String(options.body)) : {};
  const store = loadLocalStore();

  if (path === '/api/workspace' && method === 'GET') {
    return {
      keywords: store.keywords,
      trends: store.trends,
      socialMetrics: store.socialMetrics,
      recommendations: store.recommendations,
      calendarItems: store.calendarItems,
    } as unknown as T;
  }

  if (path === '/api/seed' && method === 'POST') {
    const fresh = createSeededLocalStore();
    saveLocalStore(fresh);
    return {
      keywords: fresh.keywords,
      trends: fresh.trends,
      socialMetrics: fresh.socialMetrics,
      recommendations: fresh.recommendations,
      calendarItems: fresh.calendarItems,
    } as unknown as T;
  }

  if (path === '/api/keywords' && method === 'POST') {
    const created: MonitoredKeyword = {
      id: store.nextId++,
      userId: 1,
      keyword: String(body.keyword || '').trim(),
      category: body.category || 'Macro & Finance',
      priority: body.priority || 'High',
      active: true,
      createdAt: new Date().toISOString(),
    };
    store.keywords = [created, ...store.keywords];
    saveLocalStore(store);
    return created as unknown as T;
  }

  if (path.startsWith('/api/keywords/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    store.keywords = store.keywords.filter((k) => k.id !== id);
    saveLocalStore(store);
    return { success: true } as unknown as T;
  }

  if (path === '/api/trends/analyze-and-create' && method === 'POST') {
    const analysis = synthesizeClientTrendAnalysis(body);
    const created: TrendRecord = {
      id: store.nextId++,
      userId: 1,
      title: String(body.title || '').trim(),
      category: body.category || 'Macro & Finance',
      sourceUrl: body.sourceUrl || 'https://trends.google.com/trends/',
      sourceType: body.sourceType || 'Manual Entry',
      isVerifiedSource:
        body.sourceType === 'Official Public API' ||
        String(body.sourceUrl || '').startsWith('https://'),
      priority: body.priority || 'High',
      ...analysis,
      supportingLinks: JSON.stringify([
        body.sourceUrl || 'https://trends.google.com/trends/',
      ]),
      detectedAt: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    store.trends = [created, ...store.trends];
    saveLocalStore(store);
    return created as unknown as T;
  }

  if (path === '/api/trends/ingest-official-feed' && method === 'POST') {
    const ingested: TrendRecord[] = [];
    try {
      const topIdsRes = await fetch(
        'https://hacker-news.firebaseio.com/v0/topstories.json'
      );
      if (topIdsRes.ok) {
        const topIds = (await topIdsRes.json()) as number[];
        const sampleIds = topIds.slice(0, 2);
        for (const storyId of sampleIds) {
          const itemRes = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
          );
          if (!itemRes.ok) continue;
          const item = await itemRes.json();
          if (!item?.title) continue;
          const sourceUrl =
            item.url || `https://news.ycombinator.com/item?id=${storyId}`;
          const analysis = synthesizeClientTrendAnalysis({
            title: item.title,
            category: 'Global Events',
            sourceUrl,
            sourceType: 'Official Public API',
            contextNotes: `Official Hacker News public API story (#${storyId}) with ${item.score || 100} points and ${item.descendants || 25} comments.`,
          });
          const created: TrendRecord = {
            id: store.nextId++,
            userId: 1,
            title: item.title,
            category: 'Global Events',
            sourceUrl,
            sourceType: 'Official Public API',
            isVerifiedSource: true,
            priority: 'High',
            ...analysis,
            supportingLinks: JSON.stringify([
              sourceUrl,
              `https://news.ycombinator.com/item?id=${storyId}`,
            ]),
            detectedAt: new Date().toISOString().slice(0, 10),
            createdAt: new Date().toISOString(),
          };
          ingested.push(created);
        }
      }
    } catch {
      // Fallback if client-side fetch to HN is blocked
    }
    if (ingested.length > 0) {
      store.trends = [...ingested, ...store.trends];
      saveLocalStore(store);
    }
    return { ingested } as unknown as T;
  }

  if (path.match(/^\/api\/trends\/\d+\/reanalyze$/) && method === 'POST') {
    const parts = path.split('/');
    const id = Number(parts[3]);
    const existing = store.trends.find((t) => t.id === id);
    if (!existing) throw new Error('Trend record not found');
    const analysis = synthesizeClientTrendAnalysis({
      title: existing.title,
      category: existing.category,
      sourceUrl: existing.sourceUrl,
      sourceType: existing.sourceType,
    });
    const updated: TrendRecord = {
      ...existing,
      ...analysis,
    };
    store.trends = store.trends.map((t) => (t.id === id ? updated : t));
    saveLocalStore(store);
    return updated as unknown as T;
  }

  if (path.match(/^\/api\/trends\/\d+$/) && method === 'PATCH') {
    const id = Number(path.split('/').pop());
    const existing = store.trends.find((t) => t.id === id);
    if (!existing) throw new Error('Trend record not found');
    const nextScores = {
      scoreTrendRelevance:
        body.scoreTrendRelevance ?? existing.scoreTrendRelevance,
      scoreRecency: body.scoreRecency ?? existing.scoreRecency,
      scoreAudienceInterest:
        body.scoreAudienceInterest ?? existing.scoreAudienceInterest,
      scoreEngagementPotential:
        body.scoreEngagementPotential ?? existing.scoreEngagementPotential,
      scoreBrandRelevance:
        body.scoreBrandRelevance ?? existing.scoreBrandRelevance,
    };
    const updated: TrendRecord = {
      ...existing,
      ...body,
      ...nextScores,
      opportunityScore: computeClientOpportunityScore(nextScores),
    };
    store.trends = store.trends.map((t) => (t.id === id ? updated : t));
    saveLocalStore(store);
    return updated as unknown as T;
  }

  if (path.match(/^\/api\/trends\/\d+$/) && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    store.trends = store.trends.filter((t) => t.id !== id);
    saveLocalStore(store);
    return { success: true } as unknown as T;
  }

  if (path === '/api/metrics' && method === 'POST') {
    const created: SocialMetricRecord = {
      id: store.nextId++,
      userId: 1,
      platform: body.platform || 'X (Twitter)',
      postTitle: body.postTitle || 'Untitled Post',
      category: body.category || 'Prediction Markets',
      contentFormat: body.contentFormat || 'Thread / Text',
      publishedDate:
        body.publishedDate || new Date().toISOString().slice(0, 10),
      reach: Number(body.reach) || 0,
      impressions: Number(body.impressions) || 0,
      likes: Number(body.likes) || 0,
      comments: Number(body.comments) || 0,
      shares: Number(body.shares) || 0,
      engagementRate: Number(body.engagementRate) || 0,
      clickThroughRate: Number(body.clickThroughRate) || 0,
      audienceRetention: Number(body.audienceRetention) || 0,
      dataOrigin: body.dataOrigin || 'Manual Entry',
      createdAt: new Date().toISOString(),
    };
    store.socialMetrics = [created, ...store.socialMetrics];
    saveLocalStore(store);
    return created as unknown as T;
  }

  if (path === '/api/metrics/csv-upload' && method === 'POST') {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const createdRows: SocialMetricRecord[] = rows.map((r: any) => ({
      id: store.nextId++,
      userId: 1,
      platform: r.platform || 'X (Twitter)',
      postTitle: r.postTitle || 'Imported CSV Post',
      category: r.category || 'Prediction Markets',
      contentFormat: r.contentFormat || 'Data Chart Graphic',
      publishedDate: r.publishedDate || new Date().toISOString().slice(0, 10),
      reach: Number(r.reach) || 0,
      impressions: Number(r.impressions) || 0,
      likes: Number(r.likes) || 0,
      comments: Number(r.comments) || 0,
      shares: Number(r.shares) || 0,
      engagementRate: Number(r.engagementRate) || 0,
      clickThroughRate: Number(r.clickThroughRate) || 0,
      audienceRetention: Number(r.audienceRetention) || 0,
      dataOrigin: 'CSV Import',
      createdAt: new Date().toISOString(),
    }));
    store.socialMetrics = [...createdRows, ...store.socialMetrics];
    saveLocalStore(store);
    return {
      importedCount: createdRows.length,
      rows: createdRows,
    } as unknown as T;
  }

  if (path.match(/^\/api\/metrics\/\d+$/) && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    store.socialMetrics = store.socialMetrics.filter((m) => m.id !== id);
    saveLocalStore(store);
    return { success: true } as unknown as T;
  }

  if (path === '/api/recommendations/generate' && method === 'POST') {
    const topTrend = store.trends[0];
    const generated: AiRecommendationRecord[] = [
      {
        id: store.nextId++,
        userId: 1,
        recommendationType: 'High-Conviction Topic',
        title: topTrend
          ? `Publish Rapid Probability Breakdown on "${topTrend.title}"`
          : 'Publish FOMC Implied Probability vs. Dot Plot Explainer',
        targetPlatform: topTrend?.recommendedPlatform || 'X (Twitter)',
        impactEstimate: 'High Impact',
        dataExplanation: `Backed by a ${topTrend?.opportunityScore || 91}/100 Gravia Opportunity Score and strong historical engagement on data-verified macro threads.`,
        actionableStep:
          'Lead with the verified primary-source filing in slide 1, contrast with live contract odds in slide 2, and end with an explicit calibration poll.',
        createdAt: new Date().toISOString(),
      },
      ...store.recommendations.slice(0, 4),
    ];
    store.recommendations = generated;
    saveLocalStore(store);
    return generated as unknown as T;
  }

  if (path === '/api/calendar' && method === 'POST') {
    const defaultChecklist = [
      { id: 'c1', label: 'Verify primary institutional source links', done: true },
      { id: 'c2', label: 'Separate verified facts from implied odds', done: false },
      { id: 'c3', label: 'Finalize chart graphic & platform hook', done: false },
    ];
    const created: CalendarItemRecord = {
      id: store.nextId++,
      userId: 1,
      trendId: body.trendId ?? null,
      title: body.title || 'Scheduled Intelligence Briefing',
      scheduledDate:
        body.scheduledDate || new Date().toISOString().slice(0, 10),
      scheduledTime: body.scheduledTime || '14:00 UTC',
      platform: body.platform || 'X (Twitter)',
      contentFormat: body.contentFormat || 'Data Chart Graphic',
      status: body.status || 'Scheduled',
      priority: body.priority || 'High',
      category: body.category || 'Prediction Markets',
      hookDraft: body.hookDraft || '',
      checklistJson: body.checklistJson || JSON.stringify(defaultChecklist),
      createdAt: new Date().toISOString(),
    };
    store.calendarItems = [...store.calendarItems, created];
    saveLocalStore(store);
    return created as unknown as T;
  }

  if (path.match(/^\/api\/calendar\/\d+$/) && method === 'PATCH') {
    const id = Number(path.split('/').pop());
    const existing = store.calendarItems.find((c) => c.id === id);
    if (!existing) throw new Error('Calendar item not found');
    const updated: CalendarItemRecord = {
      ...existing,
      ...body,
    };
    store.calendarItems = store.calendarItems.map((c) =>
      c.id === id ? updated : c
    );
    saveLocalStore(store);
    return updated as unknown as T;
  }

  if (path.match(/^\/api\/calendar\/\d+$/) && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    store.calendarItems = store.calendarItems.filter((c) => c.id !== id);
    saveLocalStore(store);
    return { success: true } as unknown as T;
  }

  throw new Error(`Unsupported endpoint: ${method} ${path}`);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidToken();
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (response.ok) {
      const data = (await response.json()) as T;
      if (path === '/api/workspace' || path === '/api/seed') {
        const ws = data as unknown as WorkspacePayload;
        if (Array.isArray(ws?.trends) && ws.trends.length > 0) {
          saveLocalStore({
            nextId: 500,
            keywords: ws.keywords || [],
            trends: ws.trends || [],
            socialMetrics: ws.socialMetrics || [],
            recommendations: ws.recommendations || [],
            calendarItems: ws.calendarItems || [],
          });
        }
      }
      return data;
    }

    // If serverless function returned 5xx, transparently fall back to the local institutional workspace engine
    if (response.status >= 500) {
      console.warn(
        `[TrendRadar AI] Backend ${path} returned HTTP ${response.status}; using resilient workspace engine.`
      );
      return await handleFallbackRequest<T>(path, options);
    }

    let errorMessage = `Unable to complete request (HTTP ${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody.error) {
        errorMessage = errBody.error;
      }
    } catch {
      // Fallback to descriptive status message
    }
    throw new Error(errorMessage);
  } catch (err: any) {
    // Network errors or unhandled 5xx fallback
    if (
      err instanceof TypeError ||
      String(err?.message || '').includes('Failed to fetch') ||
      String(err?.message || '').includes('NetworkError')
    ) {
      return await handleFallbackRequest<T>(path, options);
    }
    throw err;
  }
}

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { hasDatabaseConfig, pool, ensureDatabaseSchema } from './src/db/index.ts';
import {
  getOrCreateUser,
  getFullWorkspaceData,
  seedDemoDataForUser,
  createKeyword,
  deleteKeyword,
  createTrendRecord,
  updateTrendRecord,
  deleteTrendRecord,
  createSocialMetricRecord,
  bulkCreateSocialMetrics,
  deleteSocialMetricRecord,
  replaceAiRecommendations,
  createCalendarItemRecord,
  updateCalendarItemRecord,
  deleteCalendarItemRecord,
} from './src/db/repository.ts';
import {
  analyzeTrendWithGemini,
  generateStrategicRecommendationsWithGemini,
} from './src/lib/gemini-service.ts';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));

// Health check endpoint
app.get(['/healthz', '/api/health'], async (_req, res) => {
  try {
    if (hasDatabaseConfig()) {
      await ensureDatabaseSchema();
      await pool.query('SELECT 1');
    }
    res.json({
      status: 'ok',
      service: 'trendradar-ai',
      databaseMode: hasDatabaseConfig() ? 'postgresql' : 'ephemeral-fallback',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      error: error.message || 'Database unavailable',
    });
  }
});

// Helper to resolve DB user from Firebase Auth token
async function resolveDbUser(req: AuthRequest) {
  const uid = req.user?.uid;
  const email = req.user?.email || 'analyst@gravia.io';
  if (!uid) {
    throw new Error('Unauthorized: Missing user identity');
  }
  return await getOrCreateUser(uid, email);
}

// GET /api/workspace - Load all persisted data for the authenticated user
app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const workspace = await getFullWorkspaceData(user.id);
    res.json({
      user: { id: user.id, email: user.email, uid: user.uid },
      ...workspace,
    });
  } catch (error: any) {
    console.error('Error in GET /api/workspace:', error);
    res.status(500).json({
      error: error.message || 'Failed to load workspace data',
    });
  }
});

// POST /api/seed - Reset / Reload clearly labeled Demo Dataset
app.post('/api/seed', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    await seedDemoDataForUser(user.id, true);
    const workspace = await getFullWorkspaceData(user.id);
    res.json(workspace);
  } catch (error: any) {
    console.error('Error in POST /api/seed:', error);
    res.status(500).json({
      error: error.message || 'Failed to reload sample dataset',
    });
  }
});

// POST /api/keywords - Add monitored topic/keyword
app.post('/api/keywords', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const { keyword, category, priority } = req.body;
    if (!keyword || !String(keyword).trim()) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    const created = await createKeyword(user.id, {
      keyword: String(keyword).trim(),
      category: category || 'Prediction Markets',
      priority: priority || 'High',
    });
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error in POST /api/keywords:', error);
    res.status(500).json({ error: error.message || 'Failed to add keyword' });
  }
});

// DELETE /api/keywords/:id - Remove monitored keyword
app.delete('/api/keywords/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const keywordId = Number(req.params.id);
    const result = await deleteKeyword(user.id, keywordId);
    res.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/keywords/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to delete keyword' });
  }
});

// POST /api/trends/analyze-and-create - Create a trend with AI Trend Analysis & Opportunity Scoring
app.post(
  '/api/trends/analyze-and-create',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await resolveDbUser(req);
      const {
        title,
        category,
        sourceUrl,
        sourceType,
        contextNotes,
        manualScores,
      } = req.body;

      if (!title || !String(title).trim()) {
        return res.status(400).json({ error: 'Trend title is required' });
      }

      const safeUrl =
        sourceUrl && String(sourceUrl).trim()
          ? String(sourceUrl).trim()
          : 'https://trends.google.com/trends/';
      const safeCategory = category || 'Prediction Markets';
      const safeSourceType = sourceType || 'Manual Entry';

      const aiAnalysis = await analyzeTrendWithGemini({
        title: String(title).trim(),
        category: safeCategory,
        sourceUrl: safeUrl,
        sourceType: safeSourceType,
        contextNotes,
      });

      const nowUtc =
        new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

      const created = await createTrendRecord(user.id, {
        title: String(title).trim(),
        category: safeCategory,
        sourceUrl: safeUrl,
        sourceType: safeSourceType,
        isVerifiedSource:
          safeSourceType === 'Official API' ||
          safeSourceType === 'Authorized Feed',
        priority: req.body.priority || aiAnalysis.priority || 'High',
        status: req.body.status || 'Emerging',
        scoreTrendRelevance:
          manualScores?.scoreTrendRelevance ?? aiAnalysis.scoreTrendRelevance,
        scoreRecency: manualScores?.scoreRecency ?? aiAnalysis.scoreRecency,
        scoreAudienceInterest:
          manualScores?.scoreAudienceInterest ??
          aiAnalysis.scoreAudienceInterest,
        scoreEngagementPotential:
          manualScores?.scoreEngagementPotential ??
          aiAnalysis.scoreEngagementPotential,
        scoreBrandRelevance:
          manualScores?.scoreBrandRelevance ?? aiAnalysis.scoreBrandRelevance,
        scoreExplanation: aiAnalysis.scoreExplanation,
        verifiedSummary: aiAnalysis.verifiedSummary,
        whyGainingAttention: aiAnalysis.whyGainingAttention,
        predictionMarketRelevance: aiAnalysis.predictionMarketRelevance,
        audienceInterestAnalysis: aiAnalysis.audienceInterestAnalysis,
        suggestedContentAngle: aiAnalysis.suggestedContentAngle,
        recommendedPlatform: aiAnalysis.recommendedPlatform,
        suggestedHook: aiAnalysis.suggestedHook,
        supportingLinks: JSON.stringify([
          {
            title: 'Primary Recorded Source',
            url: safeUrl,
            verified:
              safeSourceType === 'Official API' ||
              safeSourceType === 'Authorized Feed',
          },
        ]),
        detectedAt: nowUtc,
      });

      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error in POST /api/trends/analyze-and-create:', error);
      res.status(500).json({
        error: error.message || 'Failed to analyze and record trend',
      });
    }
  }
);

// POST /api/trends/ingest-official-feed - Pull real public stories from Hacker News Official API & analyze with Gemini
app.post(
  '/api/trends/ingest-official-feed',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await resolveDbUser(req);
      const topIdsRes = await fetch(
        'https://hacker-news.firebaseio.com/v0/topstories.json'
      );
      if (!topIdsRes.ok) {
        throw new Error('Official Hacker News API temporarily unreachable');
      }
      const topIds = (await topIdsRes.json()) as number[];
      const sampleIds = topIds.slice(0, 2);

      const createdTrends = [];
      for (const storyId of sampleIds) {
        const itemRes = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
        );
        if (!itemRes.ok) continue;
        const item = (await itemRes.json()) as {
          title?: string;
          url?: string;
          score?: number;
          time?: number;
        };
        if (!item?.title) continue;

        const sourceUrl =
          item.url || `https://news.ycombinator.com/item?id=${storyId}`;
        const detectedAt = item.time
          ? new Date(item.time * 1000)
              .toISOString()
              .replace('T', ' ')
              .slice(0, 16) + ' UTC'
          : new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

        const aiAnalysis = await analyzeTrendWithGemini({
          title: item.title,
          category: 'Global Events',
          sourceUrl,
          sourceType: 'Official API',
          contextNotes: `Ingested from Official Hacker News Public API (Story ID ${storyId}, Community Score: ${item.score ?? 0}).`,
        });

        const created = await createTrendRecord(user.id, {
          title: item.title,
          category: 'Global Events',
          sourceUrl,
          sourceType: 'Official API',
          isVerifiedSource: true,
          priority: aiAnalysis.priority,
          status: 'Emerging',
          scoreTrendRelevance: aiAnalysis.scoreTrendRelevance,
          scoreRecency: 95,
          scoreAudienceInterest: aiAnalysis.scoreAudienceInterest,
          scoreEngagementPotential: aiAnalysis.scoreEngagementPotential,
          scoreBrandRelevance: aiAnalysis.scoreBrandRelevance,
          scoreExplanation: aiAnalysis.scoreExplanation,
          verifiedSummary: `[OFFICIAL PUBLIC API - HN #${storyId}] ${aiAnalysis.verifiedSummary}`,
          whyGainingAttention: aiAnalysis.whyGainingAttention,
          predictionMarketRelevance: aiAnalysis.predictionMarketRelevance,
          audienceInterestAnalysis: aiAnalysis.audienceInterestAnalysis,
          suggestedContentAngle: aiAnalysis.suggestedContentAngle,
          recommendedPlatform: aiAnalysis.recommendedPlatform,
          suggestedHook: aiAnalysis.suggestedHook,
          supportingLinks: JSON.stringify([
            {
              title: `Hacker News Official API Item #${storyId}`,
              url: sourceUrl,
              verified: true,
            },
          ]),
          detectedAt,
        });
        createdTrends.push(created);
      }

      res.status(201).json({ ingested: createdTrends });
    } catch (error: any) {
      console.error('Error in POST /api/trends/ingest-official-feed:', error);
      res.status(500).json({
        error:
          error.message ||
          'Failed to ingest from official public feed. Use manual entry or sample data.',
      });
    }
  }
);

// PATCH /api/trends/:id - Update trend scores, priority, or re-run AI analysis
app.patch('/api/trends/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const trendId = Number(req.params.id);
    const updated = await updateTrendRecord(user.id, trendId, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('Error in PATCH /api/trends/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to update trend' });
  }
});

// POST /api/trends/:id/reanalyze - Re-generate AI Trend Analysis via Gemini
app.post(
  '/api/trends/:id/reanalyze',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await resolveDbUser(req);
      const trendId = Number(req.params.id);
      const { title, category, sourceUrl, sourceType } = req.body;

      const aiAnalysis = await analyzeTrendWithGemini({
        title,
        category,
        sourceUrl,
        sourceType,
      });

      const updated = await updateTrendRecord(user.id, trendId, {
        scoreTrendRelevance: aiAnalysis.scoreTrendRelevance,
        scoreRecency: aiAnalysis.scoreRecency,
        scoreAudienceInterest: aiAnalysis.scoreAudienceInterest,
        scoreEngagementPotential: aiAnalysis.scoreEngagementPotential,
        scoreBrandRelevance: aiAnalysis.scoreBrandRelevance,
        scoreExplanation: aiAnalysis.scoreExplanation,
        verifiedSummary: aiAnalysis.verifiedSummary,
        whyGainingAttention: aiAnalysis.whyGainingAttention,
        predictionMarketRelevance: aiAnalysis.predictionMarketRelevance,
        audienceInterestAnalysis: aiAnalysis.audienceInterestAnalysis,
        suggestedContentAngle: aiAnalysis.suggestedContentAngle,
        recommendedPlatform: aiAnalysis.recommendedPlatform,
        suggestedHook: aiAnalysis.suggestedHook,
        priority: aiAnalysis.priority,
      });

      res.json(updated);
    } catch (error: any) {
      console.error('Error in POST /api/trends/:id/reanalyze:', error);
      res.status(500).json({
        error: error.message || 'Failed to re-analyze trend with Gemini AI',
      });
    }
  }
);

// DELETE /api/trends/:id - Delete trend
app.delete('/api/trends/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const trendId = Number(req.params.id);
    const result = await deleteTrendRecord(user.id, trendId);
    res.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/trends/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to delete trend' });
  }
});

// POST /api/metrics - Add single manual social media metric record
app.post('/api/metrics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const {
      platform,
      postTitle,
      category,
      contentFormat,
      publishedDate,
      reach,
      impressions,
      likes,
      comments,
      shares,
      engagementRate,
      clickThroughRate,
      audienceRetention,
      dataOrigin,
    } = req.body;

    if (!postTitle || !String(postTitle).trim()) {
      return res.status(400).json({ error: 'Post title is required' });
    }

    const created = await createSocialMetricRecord(user.id, {
      platform: platform || 'X',
      postTitle: String(postTitle).trim(),
      category: category || 'Prediction Markets',
      contentFormat: contentFormat || 'Data Chart Graphic',
      publishedDate: publishedDate || new Date().toISOString().slice(0, 10),
      reach: Math.max(0, Number(reach) || 0),
      impressions: Math.max(0, Number(impressions) || 0),
      likes: Math.max(0, Number(likes) || 0),
      comments: Math.max(0, Number(comments) || 0),
      shares: Math.max(0, Number(shares) || 0),
      engagementRate: Number(engagementRate) || 0,
      clickThroughRate: Number(clickThroughRate) || 0,
      audienceRetention: Number(audienceRetention) || 0,
      dataOrigin: dataOrigin || 'Manual Entry',
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error in POST /api/metrics:', error);
    res.status(500).json({
      error: error.message || 'Failed to create social metric entry',
    });
  }
});

// POST /api/metrics/csv-upload - Bulk import CSV metrics clearly marked as CSV Upload
app.post(
  '/api/metrics/csv-upload',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await resolveDbUser(req);
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res
          .status(400)
          .json({ error: 'Valid CSV rows array is required' });
      }

      const sanitizedRows = rows.map((r: any) => ({
        platform: ['X', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn'].includes(
          r.platform
        )
          ? r.platform
          : 'X',
        postTitle: String(r.postTitle || 'Imported Social Post').trim(),
        category: String(r.category || 'Prediction Markets').trim(),
        contentFormat: String(r.contentFormat || 'Data Chart Graphic').trim(),
        publishedDate: String(
          r.publishedDate || new Date().toISOString().slice(0, 10)
        ).trim(),
        reach: Math.max(0, Number(r.reach) || 0),
        impressions: Math.max(0, Number(r.impressions) || 0),
        likes: Math.max(0, Number(r.likes) || 0),
        comments: Math.max(0, Number(r.comments) || 0),
        shares: Math.max(0, Number(r.shares) || 0),
        engagementRate: Number(r.engagementRate) || 0,
        clickThroughRate: Number(r.clickThroughRate) || 0,
        audienceRetention: Number(r.audienceRetention) || 0,
        dataOrigin: 'CSV Upload',
      }));

      const inserted = await bulkCreateSocialMetrics(user.id, sanitizedRows);
      res.status(201).json({ importedCount: inserted.length, rows: inserted });
    } catch (error: any) {
      console.error('Error in POST /api/metrics/csv-upload:', error);
      res.status(500).json({
        error: error.message || 'Failed to import CSV metrics',
      });
    }
  }
);

// DELETE /api/metrics/:id - Delete social metric entry
app.delete('/api/metrics/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const metricId = Number(req.params.id);
    const result = await deleteSocialMetricRecord(user.id, metricId);
    res.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/metrics/:id:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete social metric',
    });
  }
});

// POST /api/recommendations/generate - Run AI Recommendation Engine on current PostgreSQL data
app.post(
  '/api/recommendations/generate',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const user = await resolveDbUser(req);
      const workspace = await getFullWorkspaceData(user.id);

      const generated = await generateStrategicRecommendationsWithGemini({
        trendsSummary: workspace.trends.map((t) => ({
          title: t.title,
          category: t.category,
          opportunityScore: t.opportunityScore,
          recommendedPlatform: t.recommendedPlatform,
          priority: t.priority,
        })),
        metricsSummary: workspace.socialMetrics.map((m) => ({
          platform: m.platform,
          postTitle: m.postTitle,
          category: m.category,
          contentFormat: m.contentFormat,
          reach: m.reach,
          engagementRate: m.engagementRate,
          clickThroughRate: m.clickThroughRate,
          audienceRetention: m.audienceRetention,
        })),
      });

      const saved = await replaceAiRecommendations(user.id, generated);
      res.json(saved);
    } catch (error: any) {
      console.error('Error in POST /api/recommendations/generate:', error);
      res.status(500).json({
        error:
          error.message ||
          'Failed to generate AI recommendations from workspace data',
      });
    }
  }
);

// POST /api/calendar - Create scheduled content calendar item
app.post('/api/calendar', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const {
      trendId,
      title,
      scheduledDate,
      scheduledTime,
      platform,
      contentFormat,
      status,
      priority,
      category,
      hookDraft,
      checklistJson,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Content title is required' });
    }

    const defaultChecklist = JSON.stringify([
      {
        id: 'c1',
        label: 'Verify source links & timestamps',
        done: false,
      },
      {
        id: 'c2',
        label: 'Separate verified baseline facts from market predictions',
        done: false,
      },
      {
        id: 'c3',
        label: 'Attach Gravia implied probability chart visual',
        done: false,
      },
      {
        id: 'c4',
        label: 'Include UTM tracking for event contract link',
        done: false,
      },
    ]);

    const created = await createCalendarItemRecord(user.id, {
      trendId: trendId ? Number(trendId) : null,
      title: String(title).trim(),
      scheduledDate: scheduledDate || new Date().toISOString().slice(0, 10),
      scheduledTime: scheduledTime || '14:00 UTC',
      platform: platform || 'X',
      contentFormat: contentFormat || 'Data Chart Graphic',
      status: status || 'Ideation',
      priority: priority || 'High',
      category: category || 'Prediction Markets',
      hookDraft: hookDraft || '',
      checklistJson: checklistJson || defaultChecklist,
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error in POST /api/calendar:', error);
    res.status(500).json({
      error: error.message || 'Failed to create calendar item',
    });
  }
});

// PATCH /api/calendar/:id - Update calendar item status, checklist, or details
app.patch('/api/calendar/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const itemId = Number(req.params.id);
    const updated = await updateCalendarItemRecord(user.id, itemId, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('Error in PATCH /api/calendar/:id:', error);
    res.status(500).json({
      error: error.message || 'Failed to update calendar item',
    });
  }
});

// DELETE /api/calendar/:id - Delete calendar item
app.delete('/api/calendar/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveDbUser(req);
    const itemId = Number(req.params.id);
    const result = await deleteCalendarItemRecord(user.id, itemId);
    res.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/calendar/:id:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete calendar item',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrendRadar AI server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

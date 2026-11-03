import React, { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  Radar,
  Sparkles,
  Sliders,
  Share2,
  BarChart3,
  Lightbulb,
  Calendar,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { apiRequest, setAuthTokenInMemory } from './lib/api.ts';
import {
  ActiveModule,
  WorkspacePayload,
  MonitoredKeyword,
  TrendRecord,
  SocialMetricRecord,
  AiRecommendationRecord,
  CalendarItemRecord,
} from './types.ts';
import { TrendDiscoveryModule } from './components/TrendDiscoveryModule.tsx';
import { AiTrendAnalysisModule } from './components/AiTrendAnalysisModule.tsx';
import { OpportunityScoringModule } from './components/OpportunityScoringModule.tsx';
import { SocialAnalyticsModule } from './components/SocialAnalyticsModule.tsx';
import { PerformanceDashboardModule } from './components/PerformanceDashboardModule.tsx';
import { AiRecommendationsModule } from './components/AiRecommendationsModule.tsx';
import { ContentCalendarModule } from './components/ContentCalendarModule.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeModule, setActiveModule] = useState<ActiveModule>('discovery');
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  // Persisted PostgreSQL state
  const [keywords, setKeywords] = useState<MonitoredKeyword[]>([]);
  const [trends, setTrends] = useState<TrendRecord[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetricRecord[]>([]);
  const [recommendations, setRecommendations] = useState<
    AiRecommendationRecord[]
  >([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItemRecord[]>([]);

  // Selected trend for AI Trend Analysis & Opportunity Scoring
  const [selectedTrend, setSelectedTrend] = useState<TrendRecord | null>(null);
  const [reloadingDemo, setReloadingDemo] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const data = await apiRequest<WorkspacePayload>('/api/workspace');
      setKeywords(data.keywords);
      setTrends(data.trends);
      setSocialMetrics(data.socialMetrics);
      setRecommendations(data.recommendations);
      setCalendarItems(data.calendarItems);
      if (data.trends.length > 0) {
        setSelectedTrend((prev) =>
          prev
            ? data.trends.find((t) => t.id === prev.id) || data.trends[0]
            : data.trends[0]
        );
      }
    } catch (err: any) {
      setWorkspaceError(
        err.message || 'Unable to load TrendRadar AI workspace data.'
      );
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthTokenInMemory(token);
          await fetchWorkspace();
        } catch (err: any) {
          setWorkspaceError(err.message || 'Authentication token error');
        }
      } else {
        setAuthTokenInMemory(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [fetchWorkspace]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      setAuthTokenInMemory(token);
    } catch (err: any) {
      setAuthError(
        err.message || 'Google Sign-In was cancelled or failed. Please try again.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthTokenInMemory(null);
  };

  const handleReloadDemoDataset = async () => {
    setReloadingDemo(true);
    setWorkspaceError(null);
    try {
      const data = await apiRequest<WorkspacePayload>('/api/seed', {
        method: 'POST',
      });
      setKeywords(data.keywords);
      setTrends(data.trends);
      setSocialMetrics(data.socialMetrics);
      setRecommendations(data.recommendations);
      setCalendarItems(data.calendarItems);
      if (data.trends.length > 0) {
        setSelectedTrend(data.trends[0]);
      }
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to reload sample dataset');
    } finally {
      setReloadingDemo(false);
    }
  };

  // CRUD Handlers for Modules
  const handleAddKeyword = async (payload: {
    keyword: string;
    category: string;
    priority: string;
  }) => {
    const created = await apiRequest<MonitoredKeyword>('/api/keywords', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setKeywords((prev) => [created, ...prev]);
  };

  const handleDeleteKeyword = async (id: number) => {
    await apiRequest(`/api/keywords/${id}`, { method: 'DELETE' });
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  const handleCreateTrendWithAi = async (payload: {
    title: string;
    category: string;
    sourceUrl: string;
    sourceType: string;
    priority: string;
    contextNotes: string;
  }) => {
    const created = await apiRequest<TrendRecord>(
      '/api/trends/analyze-and-create',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setTrends((prev) => [created, ...prev]);
    setSelectedTrend(created);
  };

  const handleIngestOfficialFeed = async () => {
    const res = await apiRequest<{ ingested: TrendRecord[] }>(
      '/api/trends/ingest-official-feed',
      {
        method: 'POST',
      }
    );
    if (res.ingested && res.ingested.length > 0) {
      setTrends((prev) => [...res.ingested, ...prev]);
      setSelectedTrend(res.ingested[0]);
    }
  };

  const handleUpdateTrendPriority = async (id: number, priority: string) => {
    const updated = await apiRequest<TrendRecord>(`/api/trends/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
    setTrends((prev) => prev.map((t) => (t.id === id ? updated : t)));
    if (selectedTrend?.id === id) setSelectedTrend(updated);
  };

  const handleUpdateScores = async (
    trendId: number,
    scores: {
      scoreTrendRelevance: number;
      scoreRecency: number;
      scoreAudienceInterest: number;
      scoreEngagementPotential: number;
      scoreBrandRelevance: number;
      scoreExplanation: string;
    }
  ) => {
    const updated = await apiRequest<TrendRecord>(`/api/trends/${trendId}`, {
      method: 'PATCH',
      body: JSON.stringify(scores),
    });
    setTrends((prev) => prev.map((t) => (t.id === trendId ? updated : t)));
    setSelectedTrend(updated);
  };

  const handleReanalyzeTrend = async (trend: TrendRecord) => {
    const updated = await apiRequest<TrendRecord>(
      `/api/trends/${trend.id}/reanalyze`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: trend.title,
          category: trend.category,
          sourceUrl: trend.sourceUrl,
          sourceType: trend.sourceType,
        }),
      }
    );
    setTrends((prev) => prev.map((t) => (t.id === trend.id ? updated : t)));
    setSelectedTrend(updated);
  };

  const handleDeleteTrend = async (id: number) => {
    await apiRequest(`/api/trends/${id}`, { method: 'DELETE' });
    setTrends((prev) => prev.filter((t) => t.id !== id));
    if (selectedTrend?.id === id) {
      setSelectedTrend(trends.find((t) => t.id !== id) || null);
    }
  };

  const handleInspectTrend = (trend: TrendRecord) => {
    setSelectedTrend(trend);
    setActiveModule('analysis');
  };

  const handleScheduleFromTrend = async (trend: TrendRecord) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const created = await apiRequest<CalendarItemRecord>('/api/calendar', {
      method: 'POST',
      body: JSON.stringify({
        trendId: trend.id,
        title: trend.title,
        scheduledDate: tomorrow,
        scheduledTime: '14:00 UTC',
        platform: trend.recommendedPlatform,
        contentFormat:
          trend.recommendedPlatform === 'TikTok' ||
          trend.recommendedPlatform === 'YouTube'
            ? 'Short-Form Video'
            : 'Data Chart Graphic',
        status: 'Scheduled',
        priority: trend.priority,
        category: trend.category,
        hookDraft: trend.suggestedHook,
      }),
    });
    setCalendarItems((prev) => [created, ...prev]);
    setActiveModule('calendar');
  };

  const handleAddMetric = async (payload: any) => {
    const created = await apiRequest<SocialMetricRecord>('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSocialMetrics((prev) => [created, ...prev]);
  };

  const handleBulkUploadCsv = async (rows: Array<any>) => {
    const res = await apiRequest<{
      importedCount: number;
      rows: SocialMetricRecord[];
    }>('/api/metrics/csv-upload', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
    setSocialMetrics((prev) => [...res.rows, ...prev]);
  };

  const handleDeleteMetric = async (id: number) => {
    await apiRequest(`/api/metrics/${id}`, { method: 'DELETE' });
    setSocialMetrics((prev) => prev.filter((m) => m.id !== id));
  };

  const handleGenerateRecommendations = async () => {
    const saved = await apiRequest<AiRecommendationRecord[]>(
      '/api/recommendations/generate',
      {
        method: 'POST',
      }
    );
    setRecommendations(saved);
  };

  const handleScheduleRecommendation = async (rec: AiRecommendationRecord) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const created = await apiRequest<CalendarItemRecord>('/api/calendar', {
      method: 'POST',
      body: JSON.stringify({
        title: rec.title,
        scheduledDate: tomorrow,
        scheduledTime: '15:00 UTC',
        platform: rec.targetPlatform,
        contentFormat: 'Data Chart Graphic',
        status: 'Ideation',
        priority: rec.impactEstimate === 'High Impact' ? 'High' : 'Medium',
        category: 'Prediction Markets',
        hookDraft: rec.actionableStep,
      }),
    });
    setCalendarItems((prev) => [created, ...prev]);
    setActiveModule('calendar');
  };

  const handleCreateCalendarItem = async (payload: any) => {
    const created = await apiRequest<CalendarItemRecord>('/api/calendar', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setCalendarItems((prev) => [...prev, created]);
  };

  const handleUpdateCalendarItem = async (
    id: number,
    updates: Partial<CalendarItemRecord>
  ) => {
    const updated = await apiRequest<CalendarItemRecord>(
      `/api/calendar/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    setCalendarItems((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleDeleteCalendarItem = async (id: number) => {
    await apiRequest(`/api/calendar/${id}`, { method: 'DELETE' });
    setCalendarItems((prev) => prev.filter((c) => c.id !== id));
  };

  // Loading state while verifying Firebase Auth session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-base font-semibold text-slate-200">
            Initializing TrendRadar AI Workspace...
          </div>
          <div className="text-xs text-slate-500">
            Verifying security credentials
          </div>
        </div>
      </div>
    );
  }

  // Institutional Fintech Sign-In Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between">
        {/* Top Bar Contract */}
        <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-slate-950/60">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
          >
            TrendRadar AI
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a
              href="#capabilities"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Discovery
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Epistemic AI
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Opportunity Model
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Social Telemetry
            </a>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In with Google
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
          <div className="max-w-3xl space-y-5">
            <div className="text-xs font-medium text-sky-400">
              Gravia Prediction Market Intelligence · Institutional Content Desk
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100 leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Identify emerging global signals before the order book reprices.
            </h1>
            <p className="text-base text-slate-400 leading-relaxed max-w-2xl">
              TrendRadar AI combines multi-domain signal discovery, epistemic Gemini AI analysis, explainable 5-factor opportunity scoring, and cross-platform social performance telemetry backed by PostgreSQL.
            </p>

            {authError && (
              <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-200 max-w-lg">
                {authError}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate with Google Workspace</span>
              </button>
              <span className="text-xs text-slate-500">
                Includes pre-populated Gravia sample dataset upon first sign-in.
              </span>
            </div>
          </div>

          <div
            id="capabilities"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80"
          >
            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
              <h2 className="text-sm font-semibold text-slate-100">
                01. Epistemic AI Trend Analysis
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Separates verified baseline facts and timestamps from analytical commentary and market contract predictions.
              </p>
            </div>
            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
              <h2 className="text-sm font-semibold text-slate-100">
                02. Explainable Opportunity Scoring
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quantifies Trend Relevance, Gravia Brand Fit, Recency, Audience Interest, and Engagement Potential on a 100-point scale.
              </p>
            </div>
            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
              <h2 className="text-sm font-semibold text-slate-100">
                03. Multi-Platform Telemetry & Calendar
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingest CSV or manual metrics for X, TikTok, YouTube, Instagram, and LinkedIn to power AI editorial recommendations.
              </p>
            </div>
          </div>
        </main>

        <footer className="px-6 py-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
          <span>TrendRadar AI · Social Trend Intelligence Platform</span>
          <span>Gravia Analytics</span>
        </footer>
      </div>
    );
  }

  const sidebarItems: Array<{
    id: ActiveModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    {
      id: 'discovery',
      label: 'Trend Discovery',
      icon: Radar,
      count: trends.length,
    },
    {
      id: 'analysis',
      label: 'AI Trend Analysis',
      icon: Sparkles,
    },
    {
      id: 'scoring',
      label: 'Opportunity Scoring',
      icon: Sliders,
    },
    {
      id: 'analytics',
      label: 'Social Media Analytics',
      icon: Share2,
      count: socialMetrics.length,
    },
    {
      id: 'dashboard',
      label: 'Performance Dashboard',
      icon: BarChart3,
    },
    {
      id: 'recommendations',
      label: 'AI Recommendations',
      icon: Lightbulb,
      count: recommendations.length,
    },
    {
      id: 'calendar',
      label: 'Content Calendar',
      icon: Calendar,
      count: calendarItems.length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Bar Contract: [Brand title, 1 line] - [4-5 nav links] - [1 primary action] */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 sticky top-0 z-30">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveModule('discovery');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          TrendRadar AI
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveModule('discovery')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'discovery'
                ? 'text-sky-400 underline underline-offset-4'
                : ''
            }`}
          >
            Discovery
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('analysis')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'analysis'
                ? 'text-sky-400 underline underline-offset-4'
                : ''
            }`}
          >
            AI Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('scoring')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'scoring'
                ? 'text-sky-400 underline underline-offset-4'
                : ''
            }`}
          >
            Scoring
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('dashboard')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'dashboard'
                ? 'text-sky-400 underline underline-offset-4'
                : ''
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('calendar')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'calendar'
                ? 'text-sky-400 underline underline-offset-4'
                : ''
            }`}
          >
            Calendar
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReloadDemoDataset}
            disabled={reloadingDemo}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {reloadingDemo ? 'Resetting Demo Data...' : 'Reset Demo Dataset'}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout: Sidebar (256px) + Main Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <aside className="w-full lg:w-64 bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0 flex flex-col justify-between p-4">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-medium text-slate-500">
              Gravia Intelligence Modules
            </div>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-sky-400/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span className="font-mono text-[11px] tabular-nums text-slate-500 ml-2">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-3">
            <div className="px-3">
              <div className="text-xs font-medium text-slate-300 truncate">
                {currentUser.email}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Authenticated Analyst
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-[1440px]">
          {workspaceError && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200 flex items-center justify-between">
              <span>{workspaceError}</span>
              <button
                type="button"
                onClick={fetchWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-900/50 hover:bg-red-900 rounded text-red-100 font-medium whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {workspaceLoading ? (
            <div className="space-y-4">
              <div className="h-8 w-64 bg-slate-900 rounded animate-pulse" />
              <div className="h-4 w-96 bg-slate-900 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="h-32 bg-slate-900/70 border border-slate-800 rounded-lg animate-pulse" />
                <div className="h-32 bg-slate-900/70 border border-slate-800 rounded-lg animate-pulse" />
                <div className="h-32 bg-slate-900/70 border border-slate-800 rounded-lg animate-pulse" />
              </div>
              <div className="h-96 bg-slate-900/70 border border-slate-800 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {activeModule === 'discovery' && (
                <TrendDiscoveryModule
                  keywords={keywords}
                  trends={trends}
                  onAddKeyword={handleAddKeyword}
                  onDeleteKeyword={handleDeleteKeyword}
                  onCreateTrendWithAi={handleCreateTrendWithAi}
                  onIngestOfficialFeed={handleIngestOfficialFeed}
                  onUpdateTrendPriority={handleUpdateTrendPriority}
                  onDeleteTrend={handleDeleteTrend}
                  onInspectTrend={handleInspectTrend}
                  onScheduleFromTrend={handleScheduleFromTrend}
                />
              )}

              {activeModule === 'analysis' && (
                <AiTrendAnalysisModule
                  trends={trends}
                  selectedTrend={selectedTrend}
                  onSelectTrend={setSelectedTrend}
                  onReanalyzeTrend={handleReanalyzeTrend}
                  onScheduleFromTrend={handleScheduleFromTrend}
                  onNavigateToScoring={(t) => {
                    setSelectedTrend(t);
                    setActiveModule('scoring');
                  }}
                />
              )}

              {activeModule === 'scoring' && (
                <OpportunityScoringModule
                  trends={trends}
                  selectedTrend={selectedTrend}
                  onSelectTrend={setSelectedTrend}
                  onUpdateScores={handleUpdateScores}
                />
              )}

              {activeModule === 'analytics' && (
                <SocialAnalyticsModule
                  metrics={socialMetrics}
                  onAddMetric={handleAddMetric}
                  onBulkUploadCsv={handleBulkUploadCsv}
                  onDeleteMetric={handleDeleteMetric}
                />
              )}

              {activeModule === 'dashboard' && (
                <PerformanceDashboardModule metrics={socialMetrics} />
              )}

              {activeModule === 'recommendations' && (
                <AiRecommendationsModule
                  recommendations={recommendations}
                  onGenerateRecommendations={handleGenerateRecommendations}
                  onScheduleRecommendation={handleScheduleRecommendation}
                />
              )}

              {activeModule === 'calendar' && (
                <ContentCalendarModule
                  calendarItems={calendarItems}
                  trends={trends}
                  onCreateCalendarItem={handleCreateCalendarItem}
                  onUpdateCalendarItem={handleUpdateCalendarItem}
                  onDeleteCalendarItem={handleDeleteCalendarItem}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

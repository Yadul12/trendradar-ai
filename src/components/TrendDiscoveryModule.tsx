import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  CalendarPlus,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import {
  MonitoredKeyword,
  TrendRecord,
  TREND_CATEGORIES,
} from '../types.ts';

interface TrendDiscoveryModuleProps {
  keywords: MonitoredKeyword[];
  trends: TrendRecord[];
  onAddKeyword: (data: {
    keyword: string;
    category: string;
    priority: string;
  }) => Promise<void>;
  onDeleteKeyword: (id: number) => Promise<void>;
  onCreateTrendWithAi: (data: {
    title: string;
    category: string;
    sourceUrl: string;
    sourceType: string;
    priority: string;
    contextNotes: string;
  }) => Promise<void>;
  onIngestOfficialFeed: () => Promise<void>;
  onUpdateTrendPriority: (id: number, priority: string) => Promise<void>;
  onDeleteTrend: (id: number) => Promise<void>;
  onInspectTrend: (trend: TrendRecord) => void;
  onScheduleFromTrend: (trend: TrendRecord) => void;
}

export const TrendDiscoveryModule: React.FC<TrendDiscoveryModuleProps> = ({
  keywords,
  trends,
  onAddKeyword,
  onDeleteKeyword,
  onCreateTrendWithAi,
  onIngestOfficialFeed,
  onUpdateTrendPriority,
  onDeleteTrend,
  onInspectTrend,
  onScheduleFromTrend,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'recent'>('score');

  // Keyword form state
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordCategory, setNewKeywordCategory] = useState<string>(
    TREND_CATEGORIES[0]
  );
  const [newKeywordPriority, setNewKeywordPriority] = useState<string>('High');
  const [addingKeyword, setAddingKeyword] = useState(false);

  // New Trend form state
  const [showNewTrendForm, setShowNewTrendForm] = useState(false);
  const [trendTitle, setTrendTitle] = useState('');
  const [trendCategory, setTrendCategory] = useState<string>(
    TREND_CATEGORIES[0]
  );
  const [trendSourceUrl, setTrendSourceUrl] = useState('');
  const [trendSourceType, setTrendSourceType] =
    useState<string>('Manual Entry');
  const [trendPriority, setTrendPriority] = useState<string>('High');
  const [trendNotes, setTrendNotes] = useState('');
  const [submittingTrend, setSubmittingTrend] = useState(false);
  const [ingestingFeed, setIngestingFeed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredTrends = useMemo(() => {
    return trends
      .filter((t) => {
        const matchesSearch =
          !searchQuery.trim() ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.verifiedSummary.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === 'All' || t.category === selectedCategory;
        const matchesPriority =
          selectedPriority === 'All' || t.priority === selectedPriority;
        return matchesSearch && matchesCategory && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return b.opportunityScore - a.opportunityScore;
        }
        return b.detectedAt.localeCompare(a.detectedAt);
      });
  }, [trends, searchQuery, selectedCategory, selectedPriority, sortBy]);

  const handleKeywordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setAddingKeyword(true);
    setActionError(null);
    try {
      await onAddKeyword({
        keyword: newKeyword.trim(),
        category: newKeywordCategory,
        priority: newKeywordPriority,
      });
      setNewKeyword('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to add keyword');
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleTrendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trendTitle.trim()) return;
    setSubmittingTrend(true);
    setActionError(null);
    try {
      await onCreateTrendWithAi({
        title: trendTitle.trim(),
        category: trendCategory,
        sourceUrl:
          trendSourceUrl.trim() || 'https://trends.google.com/trends/',
        sourceType: trendSourceType,
        priority: trendPriority,
        contextNotes: trendNotes.trim(),
      });
      setTrendTitle('');
      setTrendSourceUrl('');
      setTrendNotes('');
      setShowNewTrendForm(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to analyze and record trend');
    } finally {
      setSubmittingTrend(false);
    }
  };

  const handleIngestFeed = async () => {
    setIngestingFeed(true);
    setActionError(null);
    try {
      await onIngestOfficialFeed();
    } catch (err: any) {
      setActionError(err.message || 'Official public feed ingestion failed');
    } finally {
      setIngestingFeed(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Primary Discovery Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Trend Discovery & Signal Watchlist
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor emerging macro, crypto, and cultural events with verified source provenance and AI opportunity scoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleIngestFeed}
            disabled={ingestingFeed}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ingestingFeed ? 'animate-spin' : ''}`} />
            <span>
              {ingestingFeed
                ? 'Ingesting Official HN API...'
                : 'Ingest Official Public Feed'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewTrendForm((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showNewTrendForm ? 'Close Entry Form' : 'Record & Analyze Trend'}</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-200 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-300 hover:text-white font-medium underline ml-4 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Collapsible New Trend + AI Analysis Form */}
      {showNewTrendForm && (
        <form
          onSubmit={handleTrendSubmit}
          className="p-6 bg-slate-900/90 border border-slate-800 rounded-lg space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Record Emerging Trend & Run Gemini Intelligence Analysis
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every recorded signal is scored across 5 Gravia opportunity dimensions and persisted to PostgreSQL.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Trend / Event Headline *
              </label>
              <input
                type="text"
                required
                value={trendTitle}
                onChange={(e) => setTrendTitle(e.target.value)}
                placeholder="e.g., CME Treasury Volatility Index Diverges Ahead of Payrolls Release"
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Domain Category
              </label>
              <select
                value={trendCategory}
                onChange={(e) => setTrendCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {TREND_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Assigned Priority
              </label>
              <select
                value={trendPriority}
                onChange={(e) => setTrendPriority(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Source URL
              </label>
              <input
                type="url"
                value={trendSourceUrl}
                onChange={(e) => setTrendSourceUrl(e.target.value)}
                placeholder="https://www.federalreserve.gov/..."
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data Provenance Classification
              </label>
              <select
                value={trendSourceType}
                onChange={(e) => setTrendSourceType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="Manual Entry">Manual Entry</option>
                <option value="Authorized Feed">Authorized Feed</option>
                <option value="Official API">Official API</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Verified Baseline Notes (Optional)
              </label>
              <input
                type="text"
                value={trendNotes}
                onChange={(e) => setTrendNotes(e.target.value)}
                placeholder="Key facts, contract odds, or volume notes"
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowNewTrendForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTrend}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {submittingTrend
                  ? 'Running AI Analysis & Scoring...'
                  : 'Analyze with AI & Save Trend'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Monitored Keywords & Topics Bar */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Active Monitored Keywords & Watchlist ({keywords.length})
            </h2>
            <p className="text-xs text-slate-400">
              Click any monitored keyword to filter matching signals or add a new topic to track.
            </p>
          </div>

          <form
            onSubmit={handleKeywordSubmit}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add keyword or contract theme..."
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-56"
            />
            <select
              value={newKeywordCategory}
              onChange={(e) => setNewKeywordCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {TREND_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={newKeywordPriority}
              onChange={(e) => setNewKeywordPriority(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button
              type="submit"
              disabled={addingKeyword}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            >
              {addingKeyword ? 'Adding...' : 'Add Keyword'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border border-slate-800/90 rounded-md hover:border-slate-700 transition-colors"
            >
              <button
                type="button"
                onClick={() =>
                  setSearchQuery((prev) =>
                    prev === kw.keyword ? '' : kw.keyword.split(' ')[0]
                  )
                }
                className="text-left min-w-0 flex-1 pr-2"
              >
                <div className="text-xs font-medium text-slate-200 truncate">
                  {kw.keyword}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span>{kw.category}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      kw.priority === 'High'
                        ? 'text-amber-400'
                        : kw.priority === 'Medium'
                        ? 'text-sky-400'
                        : 'text-slate-400'
                    }
                  >
                    {kw.priority} Priority
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDeleteKeyword(kw.id)}
                title="Remove monitored keyword"
                className="p-1 text-slate-500 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Search, Category Filter & Priority Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({trends.length})
          </button>
          {TREND_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-slate-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trends or summaries..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-56"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'recent')}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="score">Sort: Opportunity Score</option>
            <option value="recent">Sort: Most Recent</option>
          </select>
        </div>
      </div>

      {/* High-Density Trend Intelligence Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        {filteredTrends.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-slate-300">
              No emerging trends match your current filter criteria.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Clear your active filters or record a new emerging event above to generate AI trend intelligence and opportunity scoring.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedPriority('All');
              }}
              className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-slate-950/60">
                  <th className="py-3 px-4">Emerging Trend & Provenance</th>
                  <th className="py-3 px-4">Verified Context & Market Angle</th>
                  <th className="py-3 px-4 text-right">Opportunity Score</th>
                  <th className="py-3 px-4">Target Platform</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredTrends.map((trend) => (
                  <tr
                    key={trend.id}
                    className="hover:bg-slate-800/35 transition-colors group"
                  >
                    <td className="py-4 px-4 align-top max-w-md">
                      <button
                        type="button"
                        onClick={() => onInspectTrend(trend)}
                        className="text-left font-semibold text-slate-100 hover:text-sky-400 transition-colors leading-snug block"
                      >
                        {trend.title}
                      </button>
                      {/* Clean unboxed metadata following Zero-Pill Discipline */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                        <span className="text-slate-300 font-medium">
                          {trend.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            trend.sourceType === 'Sample Demo Data'
                              ? 'text-amber-400/90'
                              : trend.sourceType === 'Official API'
                              ? 'text-emerald-400'
                              : 'text-sky-400'
                          }
                        >
                          {trend.sourceType}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {trend.detectedAt}
                        </span>
                        <span aria-hidden="true">·</span>
                        <a
                          href={trend.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-400 underline underline-offset-2"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top max-w-lg">
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {trend.verifiedSummary}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        Angle: {trend.suggestedContentAngle}
                      </p>
                    </td>

                    <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                      <div className="font-mono text-base font-semibold tabular-nums text-sky-400">
                        {trend.opportunityScore}
                        <span className="text-xs text-slate-500 font-normal">
                          /100
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        Brand: {trend.scoreBrandRelevance} · Recency:{' '}
                        {trend.scoreRecency}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-200">
                        {trend.recommendedPlatform}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {trend.status}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top whitespace-nowrap">
                      <select
                        value={trend.priority}
                        onChange={(e) =>
                          onUpdateTrendPriority(trend.id, e.target.value)
                        }
                        className={`text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1 font-medium focus:outline-none focus:border-sky-500 ${
                          trend.priority === 'High'
                            ? 'text-amber-400'
                            : trend.priority === 'Medium'
                            ? 'text-sky-400'
                            : 'text-slate-400'
                        }`}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onInspectTrend(trend)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
                        >
                          <span>AI Brief</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onScheduleFromTrend(trend)}
                          title="Schedule in Content Calendar"
                          className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-950 border border-slate-800 rounded transition-colors"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTrend(trend.id)}
                          title="Delete trend record"
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

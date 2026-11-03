import React, { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  CalendarPlus,
  Sliders,
} from 'lucide-react';
import { TrendRecord, SupportingLink } from '../types.ts';

interface AiTrendAnalysisModuleProps {
  trends: TrendRecord[];
  selectedTrend: TrendRecord | null;
  onSelectTrend: (trend: TrendRecord) => void;
  onReanalyzeTrend: (trend: TrendRecord) => Promise<void>;
  onScheduleFromTrend: (trend: TrendRecord) => void;
  onNavigateToScoring: (trend: TrendRecord) => void;
}

export const AiTrendAnalysisModule: React.FC<AiTrendAnalysisModuleProps> = ({
  trends,
  selectedTrend,
  onSelectTrend,
  onReanalyzeTrend,
  onScheduleFromTrend,
  onNavigateToScoring,
}) => {
  const activeTrend = selectedTrend || trends[0] || null;
  const [reanalyzing, setReanalyzing] = useState(false);
  const [copiedHook, setCopiedHook] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!activeTrend) {
    return (
      <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-lg text-center space-y-2">
        <p className="text-sm font-medium text-slate-300">
          No trends available for AI intelligence analysis.
        </p>
        <p className="text-xs text-slate-500">
          Add a trend in the Trend Discovery module to generate structured AI analysis.
        </p>
      </div>
    );
  }

  let parsedLinks: SupportingLink[] = [];
  try {
    parsedLinks = JSON.parse(activeTrend.supportingLinks || '[]');
  } catch {
    parsedLinks = [
      {
        title: 'Primary Recorded Source',
        url: activeTrend.sourceUrl,
        verified: activeTrend.isVerifiedSource,
      },
    ];
  }

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setErrorMsg(null);
    try {
      await onReanalyzeTrend(activeTrend);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to refresh AI analysis');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleCopyHook = () => {
    navigator.clipboard.writeText(activeTrend.suggestedHook);
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            AI Trend Intelligence & Epistemic Breakdown
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Strictly separates verified baseline facts, analytical drivers, and forward-looking market predictions for every monitored event.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToScoring(activeTrend)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspect Score Model ({activeTrend.opportunityScore}/100)</span>
          </button>
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`}
            />
            <span>
              {reanalyzing ? 'Re-computing with Gemini...' : 'Refresh AI Analysis'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onScheduleFromTrend(activeTrend)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Schedule Content</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Trend Selector List */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg divide-y divide-slate-800">
          <div className="p-4 bg-slate-950/50">
            <h2 className="text-xs font-semibold text-slate-300">
              Select Monitored Trend ({trends.length})
            </h2>
          </div>
          <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-800/70">
            {trends.map((item) => {
              const isSelected = item.id === activeTrend.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTrend(item)}
                  className={`w-full text-left p-4 transition-colors block ${
                    isSelected
                      ? 'bg-slate-800/80'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-xs font-semibold leading-snug ${
                        isSelected ? 'text-sky-400' : 'text-slate-200'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="font-mono text-xs font-semibold tabular-nums text-sky-400 shrink-0">
                      {item.opportunityScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.recommendedPlatform}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.sourceType}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Structured Intelligence Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Dossier Header */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-200">
                  {activeTrend.category}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    activeTrend.sourceType === 'Sample Demo Data'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  Provenance: {activeTrend.sourceType}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Recorded: {activeTrend.detectedAt}
                </span>
              </div>
              <div className="font-mono text-sm font-semibold text-sky-400 tabular-nums">
                Opportunity Score: {activeTrend.opportunityScore}/100
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-100 leading-snug">
              {activeTrend.title}
            </h2>

            {/* Layer 1: VERIFIED INFORMATION */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-emerald-400">
                  01. Verified Factual Baseline & Source Provenance
                </h3>
                <span className="text-[11px] text-slate-500">
                  Strictly factual context — no extrapolations
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-lg border border-slate-800/90">
                {activeTrend.verifiedSummary}
              </p>

              {/* Supporting Source Links */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-medium text-slate-400">
                  Supporting Source Links & Citations:
                </div>
                <div className="flex flex-wrap gap-3">
                  {parsedLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4"
                    >
                      <span>{link.title || link.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Layer 2: ANALYTICAL DRIVERS */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold text-sky-400">
                02. Analytical Assessment & Prediction Market Relevance
              </h3>
              <span className="text-[11px] text-slate-500">
                Structural drivers & contract order-book impact
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">
                  Why the Topic Is Gaining Attention
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeTrend.whyGainingAttention}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">
                  Relevance to Prediction Markets (Gravia)
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeTrend.predictionMarketRelevance}
                </p>
              </div>
            </div>
          </div>

          {/* Layer 3: PREDICTIONS & CONTENT EXECUTION BRIEF */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold text-amber-400">
                03. Forward Projections & Distribution Execution Brief
              </h3>
              <span className="text-[11px] text-slate-500">
                Audience interest projections & editorial packaging
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">
                  Projected Audience Interest
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeTrend.audienceInterestAnalysis}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">
                  Suggested Content Angle (Recommended: {activeTrend.recommendedPlatform})
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeTrend.suggestedContentAngle}
                </p>
              </div>
            </div>

            {/* Suggested Hook Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Suggested Post / Video Hook ({activeTrend.recommendedPlatform})
                </span>
                <button
                  type="button"
                  onClick={handleCopyHook}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                >
                  {copiedHook ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Hook</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                “{activeTrend.suggestedHook}”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

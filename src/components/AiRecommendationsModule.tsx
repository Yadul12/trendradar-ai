import React, { useState } from 'react';
import { Sparkles, CalendarPlus, RefreshCw } from 'lucide-react';
import { AiRecommendationRecord } from '../types.ts';

interface AiRecommendationsModuleProps {
  recommendations: AiRecommendationRecord[];
  onGenerateRecommendations: () => Promise<void>;
  onScheduleRecommendation: (rec: AiRecommendationRecord) => void;
}

export const AiRecommendationsModule: React.FC<
  AiRecommendationsModuleProps
> = ({
  recommendations,
  onGenerateRecommendations,
  onScheduleRecommendation,
}) => {
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      await onGenerateRecommendations();
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Failed to synthesize AI recommendations from data'
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            AI Strategic Recommendation Engine
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Synthesizes recorded PostgreSQL trend opportunity scores and social performance telemetry into explainable editorial directives.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>
            {generating
              ? 'Synthesizing Telemetry with Gemini...'
              : 'Re-Run AI Strategy Synthesis'}
          </span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      {/* 5 Structured Strategic Pillars */}
      <div className="grid grid-cols-1 gap-5">
        {recommendations.map((rec, index) => (
          <div
            key={rec.id}
            className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-sky-400">
                  0{index + 1}. {rec.recommendationType}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-slate-300 font-medium">
                  Priority Platform: {rec.targetPlatform}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span
                  className={
                    rec.impactEstimate === 'High Impact'
                      ? 'text-emerald-400'
                      : rec.impactEstimate === 'Experimental'
                      ? 'text-amber-400'
                      : 'text-sky-400'
                  }
                >
                  {rec.impactEstimate}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onScheduleRecommendation(rec)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Send to Content Calendar</span>
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-100 leading-snug">
              {rec.title}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-300">
                  Quantitative Data Explanation (Evidence Base)
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {rec.dataExplanation}
                </p>
              </div>

              <div className="space-y-1.5 bg-slate-950/70 p-4 rounded-lg border border-slate-800/90">
                <div className="text-xs font-semibold text-sky-400">
                  Recommended Editorial Execution Step
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {rec.actionableStep}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

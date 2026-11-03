import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Save, RotateCcw } from 'lucide-react';
import { TrendRecord } from '../types.ts';

interface OpportunityScoringModuleProps {
  trends: TrendRecord[];
  selectedTrend: TrendRecord | null;
  onSelectTrend: (trend: TrendRecord) => void;
  onUpdateScores: (
    trendId: number,
    scores: {
      scoreTrendRelevance: number;
      scoreRecency: number;
      scoreAudienceInterest: number;
      scoreEngagementPotential: number;
      scoreBrandRelevance: number;
      scoreExplanation: string;
    }
  ) => Promise<void>;
}

export const OpportunityScoringModule: React.FC<
  OpportunityScoringModuleProps
> = ({ trends, selectedTrend, onSelectTrend, onUpdateScores }) => {
  const activeTrend = selectedTrend || trends[0] || null;

  const [trendRelevance, setTrendRelevance] = useState(80);
  const [recency, setRecency] = useState(80);
  const [audienceInterest, setAudienceInterest] = useState(80);
  const [engagementPotential, setEngagementPotential] = useState(80);
  const [brandRelevance, setBrandRelevance] = useState(80);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (activeTrend) {
      setTrendRelevance(activeTrend.scoreTrendRelevance);
      setRecency(activeTrend.scoreRecency);
      setAudienceInterest(activeTrend.scoreAudienceInterest);
      setEngagementPotential(activeTrend.scoreEngagementPotential);
      setBrandRelevance(activeTrend.scoreBrandRelevance);
    }
  }, [activeTrend]);

  if (!activeTrend) {
    return (
      <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-lg text-center">
        <p className="text-sm text-slate-300">
          No trend records available to score.
        </p>
      </div>
    );
  }

  // Exact contribution points out of 100
  const contribTrend = +(trendRelevance * 0.25).toFixed(1);
  const contribBrand = +(brandRelevance * 0.25).toFixed(1);
  const contribRecency = +(recency * 0.2).toFixed(1);
  const contribAudience = +(audienceInterest * 0.15).toFixed(1);
  const contribEngagement = +(engagementPotential * 0.15).toFixed(1);

  const compositeScore = Math.round(
    contribTrend +
      contribBrand +
      contribRecency +
      contribAudience +
      contribEngagement
  );

  const factorBreakdownData = [
    {
      factor: 'Trend Relevance (25%)',
      rawScore: trendRelevance,
      weightedPoints: contribTrend,
      maxPoints: 25,
    },
    {
      factor: 'Gravia Brand Fit (25%)',
      rawScore: brandRelevance,
      weightedPoints: contribBrand,
      maxPoints: 25,
    },
    {
      factor: 'Signal Recency (20%)',
      rawScore: recency,
      weightedPoints: contribRecency,
      maxPoints: 20,
    },
    {
      factor: 'Audience Interest (15%)',
      rawScore: audienceInterest,
      weightedPoints: contribAudience,
      maxPoints: 15,
    },
    {
      factor: 'Engagement Potential (15%)',
      rawScore: engagementPotential,
      weightedPoints: contribEngagement,
      maxPoints: 15,
    },
  ];

  const handleSaveCalibration = async () => {
    setSaving(true);
    setSavedNotice(false);
    try {
      const updatedExplanation = `Weighted ${compositeScore}/100: Trend Relevance contributes ${contribTrend}/25 pts (${trendRelevance}), Gravia Brand Relevance contributes ${contribBrand}/25 pts (${brandRelevance}), Recency contributes ${contribRecency}/20 pts (${recency}), Audience Interest contributes ${contribAudience}/15 pts (${audienceInterest}), and Engagement Potential contributes ${contribEngagement}/15 pts (${engagementPotential}).`;
      await onUpdateScores(activeTrend.id, {
        scoreTrendRelevance: trendRelevance,
        scoreRecency: recency,
        scoreAudienceInterest: audienceInterest,
        scoreEngagementPotential: engagementPotential,
        scoreBrandRelevance: brandRelevance,
        scoreExplanation: updatedExplanation,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTrendRelevance(activeTrend.scoreTrendRelevance);
    setRecency(activeTrend.scoreRecency);
    setAudienceInterest(activeTrend.scoreAudienceInterest);
    setEngagementPotential(activeTrend.scoreEngagementPotential);
    setBrandRelevance(activeTrend.scoreBrandRelevance);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Explainable Content Opportunity Scoring
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Transparent 5-factor mathematical model quantifying how each signal contributes to Gravia content prioritization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeTrend.id}
            onChange={(e) => {
              const found = trends.find((t) => t.id === Number(e.target.value));
              if (found) onSelectTrend(found);
            }}
            className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500 max-w-md truncate"
          >
            {trends.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.opportunityScore}/100] {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Formula & Explainable Score Readout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Factor Calibration Controls */}
        <div className="lg:col-span-6 p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Factor Calibration & Weighting Controls
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust factor inputs below to simulate or update the persisted opportunity score.
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-sky-400 tabular-nums">
                {compositeScore}
                <span className="text-xs text-slate-500 font-normal">/100</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Composite Score
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                label: '01. Trend Relevance',
                weight: '25% Weight',
                value: trendRelevance,
                setter: setTrendRelevance,
                contrib: contribTrend,
                maxPts: 25,
              },
              {
                label: '02. Relevance to Gravia Brand',
                weight: '25% Weight',
                value: brandRelevance,
                setter: setBrandRelevance,
                contrib: contribBrand,
                maxPts: 25,
              },
              {
                label: '03. Signal Recency & Urgency',
                weight: '20% Weight',
                value: recency,
                setter: setRecency,
                contrib: contribRecency,
                maxPts: 20,
              },
              {
                label: '04. Target Audience Interest',
                weight: '15% Weight',
                value: audienceInterest,
                setter: setAudienceInterest,
                contrib: contribAudience,
                maxPts: 15,
              },
              {
                label: '05. Engagement Potential',
                weight: '15% Weight',
                value: engagementPotential,
                setter: setEngagementPotential,
                contrib: contribEngagement,
                maxPts: 15,
              },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-200">
                      {item.label}
                    </span>
                    <span className="text-slate-500 ml-2">· {item.weight}</span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-300">
                    Raw: <span className="text-slate-100 font-semibold">{item.value}</span>/100 →{' '}
                    <span className="text-sky-400 font-semibold">
                      +{item.contrib}
                    </span>
                    /{item.maxPts} pts
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={item.value}
                  onChange={(e) => item.setter(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Stored Values</span>
            </button>

            <div className="flex items-center gap-3">
              {savedNotice && (
                <span className="text-xs text-emerald-400 font-medium">
                  Score persisted to PostgreSQL
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveCalibration}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving Score...' : 'Save Calibrated Score'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Visual Factor Contribution Chart & Explainable Rationale */}
        <div className="lg:col-span-6 p-6 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Weighted Point Contribution by Factor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of how each scored factor contributes points toward the 100-point Opportunity Index.
            </p>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={factorBreakdownData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 20, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1E293B"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 25]}
                    stroke="#64748B"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="factor"
                    width={150}
                    stroke="#94A3B8"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      fontSize: '12px',
                      color: '#F1F5F9',
                    }}
                  />
                  <Bar
                    dataKey="weightedPoints"
                    name="Weighted Contribution (pts)"
                    fill="#38BDF8"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              Explainable Score Attribution
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeTrend.scoreExplanation}
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums gap-2">
              <span>
                Formula: 0.25({trendRelevance}) + 0.25({brandRelevance}) + 0.20({recency}) + 0.15({audienceInterest}) + 0.15({engagementPotential})
              </span>
              <span className="text-sky-400 font-semibold">
                = {compositeScore} / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Opportunity Matrix Across All Monitored Trends */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            Comparative Opportunity Matrix Across Monitored Signals
          </h2>
          <span className="text-xs text-slate-400">
            Click any row to calibrate its scoring weights
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Trend Title</th>
                <th className="py-3 px-4 text-right">Trend Rel. (25%)</th>
                <th className="py-3 px-4 text-right">Gravia Brand (25%)</th>
                <th className="py-3 px-4 text-right">Recency (20%)</th>
                <th className="py-3 px-4 text-right">Audience (15%)</th>
                <th className="py-3 px-4 text-right">Engagement (15%)</th>
                <th className="py-3 px-4 text-right">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {trends.map((item) => {
                const isSelected = item.id === activeTrend.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectTrend(item)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-950/25'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <div>{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.category} · {item.recommendedPlatform} · {item.sourceType}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {item.scoreTrendRelevance}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {item.scoreBrandRelevance}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {item.scoreRecency}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {item.scoreAudienceInterest}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {item.scoreEngagementPotential}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm font-bold tabular-nums text-sky-400">
                      {item.opportunityScore}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

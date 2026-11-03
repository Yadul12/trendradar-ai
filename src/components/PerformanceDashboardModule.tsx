import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { SocialMetricRecord, SOCIAL_PLATFORMS } from '../types.ts';

interface PerformanceDashboardModuleProps {
  metrics: SocialMetricRecord[];
}

export const PerformanceDashboardModule: React.FC<
  PerformanceDashboardModuleProps
> = ({ metrics }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [dateWindow, setDateWindow] = useState<'all' | '14d' | '30d'>('all');
  const [comparisonMode, setComparisonMode] = useState<
    'chronological' | 'weekly' | 'monthly'
  >('chronological');

  const filteredMetrics = useMemo(() => {
    const referenceDate = new Date('2026-11-03T00:00:00Z');
    return metrics
      .filter((m) => {
        if (selectedPlatform !== 'All' && m.platform !== selectedPlatform) {
          return false;
        }
        if (dateWindow === 'all') return true;
        const pubDate = new Date(m.publishedDate + 'T00:00:00Z');
        const diffDays =
          (referenceDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dateWindow === '14d') return diffDays <= 14;
        if (dateWindow === '30d') return diffDays <= 30;
        return true;
      })
      .sort((a, b) => a.publishedDate.localeCompare(b.publishedDate));
  }, [metrics, selectedPlatform, dateWindow]);

  // Aggregate KPI Totals
  const summaryStats = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return {
        totalReach: 0,
        totalImpressions: 0,
        avgEngagement: 0,
        avgCtr: 0,
        avgRetention: 0,
      };
    }
    const totalReach = filteredMetrics.reduce((acc, m) => acc + m.reach, 0);
    const totalImpressions = filteredMetrics.reduce(
      (acc, m) => acc + m.impressions,
      0
    );
    const avgEngagement =
      filteredMetrics.reduce((acc, m) => acc + m.engagementRate, 0) /
      filteredMetrics.length;
    const avgCtr =
      filteredMetrics.reduce((acc, m) => acc + m.clickThroughRate, 0) /
      filteredMetrics.length;
    const avgRetention =
      filteredMetrics.reduce((acc, m) => acc + m.audienceRetention, 0) /
      filteredMetrics.length;

    return {
      totalReach,
      totalImpressions,
      avgEngagement,
      avgCtr,
      avgRetention,
    };
  }, [filteredMetrics]);

  // Time-series data (Chronological, Weekly, or Monthly comparison)
  const timeSeriesData = useMemo(() => {
    if (comparisonMode === 'chronological') {
      return filteredMetrics.map((m) => ({
        period: `${m.publishedDate.slice(5)} (${m.platform})`,
        reach: m.reach,
        impressions: m.impressions,
        engagementRate: m.engagementRate,
        ctr: m.clickThroughRate,
        retention: m.audienceRetention,
      }));
    }

    const bucketMap = new Map<
      string,
      {
        count: number;
        reach: number;
        impressions: number;
        engSum: number;
        ctrSum: number;
        retSum: number;
      }
    >();

    filteredMetrics.forEach((m) => {
      let key = m.publishedDate.slice(0, 7); // YYYY-MM for monthly
      if (comparisonMode === 'weekly') {
        const d = new Date(m.publishedDate + 'T00:00:00Z');
        const weekStart = new Date(d);
        weekStart.setUTCDate(d.getUTCDate() - d.getUTCDay());
        key = `Wk of ${weekStart.toISOString().slice(5, 10)}`;
      }
      const prev = bucketMap.get(key) || {
        count: 0,
        reach: 0,
        impressions: 0,
        engSum: 0,
        ctrSum: 0,
        retSum: 0,
      };
      bucketMap.set(key, {
        count: prev.count + 1,
        reach: prev.reach + m.reach,
        impressions: prev.impressions + m.impressions,
        engSum: prev.engSum + m.engagementRate,
        ctrSum: prev.ctrSum + m.clickThroughRate,
        retSum: prev.retSum + m.audienceRetention,
      });
    });

    return Array.from(bucketMap.entries()).map(([period, val]) => ({
      period,
      reach: val.reach,
      impressions: val.impressions,
      engagementRate: +(val.engSum / val.count).toFixed(2),
      ctr: +(val.ctrSum / val.count).toFixed(2),
      retention: +(val.retSum / val.count).toFixed(1),
    }));
  }, [filteredMetrics, comparisonMode]);

  // Platform-wise Performance
  const platformPerformanceData = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        reach: number;
        engSum: number;
        ctrSum: number;
        retSum: number;
      }
    >();

    filteredMetrics.forEach((m) => {
      const prev = map.get(m.platform) || {
        count: 0,
        reach: 0,
        engSum: 0,
        ctrSum: 0,
        retSum: 0,
      };
      map.set(m.platform, {
        count: prev.count + 1,
        reach: prev.reach + m.reach,
        engSum: prev.engSum + m.engagementRate,
        ctrSum: prev.ctrSum + m.clickThroughRate,
        retSum: prev.retSum + m.audienceRetention,
      });
    });

    return Array.from(map.entries()).map(([platform, v]) => ({
      platform,
      totalReach: v.reach,
      avgEngagementRate: +(v.engSum / v.count).toFixed(2),
      avgCtr: +(v.ctrSum / v.count).toFixed(2),
      avgRetention: +(v.retSum / v.count).toFixed(1),
    }));
  }, [filteredMetrics]);

  // Content Category Performance
  const categoryPerformanceData = useMemo(() => {
    const map = new Map<
      string,
      { count: number; reach: number; engSum: number; ctrSum: number }
    >();
    filteredMetrics.forEach((m) => {
      const prev = map.get(m.category) || {
        count: 0,
        reach: 0,
        engSum: 0,
        ctrSum: 0,
      };
      map.set(m.category, {
        count: prev.count + 1,
        reach: prev.reach + m.reach,
        engSum: prev.engSum + m.engagementRate,
        ctrSum: prev.ctrSum + m.clickThroughRate,
      });
    });

    return Array.from(map.entries()).map(([category, v]) => ({
      category,
      avgReach: Math.round(v.reach / v.count),
      avgEngagementRate: +(v.engSum / v.count).toFixed(2),
      avgCtr: +(v.ctrSum / v.count).toFixed(2),
    }));
  }, [filteredMetrics]);

  // Top Performing Content Ranked by Engagement Rate
  const topPerformingContent = useMemo(() => {
    return [...filteredMetrics]
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5);
  }, [filteredMetrics]);

  return (
    <div className="space-y-8">
      {/* Header & Interactive Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Interactive Performance & Telemetry Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Cross-platform engagement velocity, category conversion efficiency, and weekly/monthly cohort comparisons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Date Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {[
              { id: 'all', label: 'All Dates' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '14d', label: 'Last 14 Days' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDateWindow(item.id as 'all' | '14d' | '30d')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  dateWindow === item.id
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Weekly / Monthly Comparison Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {[
              { id: 'chronological', label: 'By Post' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() =>
                  setComparisonMode(
                    mode.id as 'chronological' | 'weekly' | 'monthly'
                  )
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  comparisonMode === mode.id
                    ? 'bg-sky-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="All">All Platforms</option>
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Cumulative Reach</div>
          <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums mt-1.5">
            {summaryStats.totalReach.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {filteredMetrics.length} recorded posts
          </div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Total Impressions</div>
          <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums mt-1.5">
            {summaryStats.totalImpressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Verified & sample entries
          </div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Mean Engagement Rate</div>
          <div className="font-mono text-2xl font-bold text-sky-400 tabular-nums mt-1.5">
            {summaryStats.avgEngagement.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Interactions per reach
          </div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Mean Click-Through Rate</div>
          <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums mt-1.5">
            {summaryStats.avgCtr.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Contract referral clicks
          </div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Audience Retention</div>
          <div className="font-mono text-2xl font-bold text-amber-400 tabular-nums mt-1.5">
            {summaryStats.avgRetention.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Completion & read depth
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Engagement & Reach Over Time + Audience Engagement & Retention Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Reach & Impressions Velocity ({comparisonMode === 'chronological' ? 'Post Timeline' : comparisonMode === 'weekly' ? 'Weekly Cohort' : 'Monthly Cohort'})
            </h2>
            <p className="text-xs text-slate-400">
              Distribution scale across selected dates and social channels.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeSeriesData}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  name="Impressions"
                  stroke="#38BDF8"
                  fill="#38BDF8"
                  fillOpacity={0.18}
                />
                <Area
                  type="monotone"
                  dataKey="reach"
                  name="Reach"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.22}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Engagement Rate, CTR & Audience Retention Trends (%)
            </h2>
            <p className="text-xs text-slate-400">
              Tracks how high-retention hooks convert into engagement and referral clicks over time.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeriesData}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="engagementRate"
                  name="Engagement Rate (%)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="ctr"
                  name="Click-Through Rate (%)"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Platform-Wise Performance + Content Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Platform-Wise Engagement & Click-Through Efficiency
            </h2>
            <p className="text-xs text-slate-400">
              Compares mean Engagement Rate (%) vs. Click-Through Rate (%) across platforms.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={platformPerformanceData}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="platform" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="avgEngagementRate"
                  name="Avg Engagement Rate (%)"
                  fill="#38BDF8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="avgCtr"
                  name="Avg Click-Through Rate (%)"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Content Category Performance Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              Identifies which intelligence themes drive the strongest engagement and contract clicks.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryPerformanceData}
                layout="vertical"
                margin={{ top: 10, right: 16, left: 24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={130}
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
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="avgEngagementRate"
                  name="Avg Engagement (%)"
                  fill="#F59E0B"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="avgCtr"
                  name="Avg CTR (%)"
                  fill="#38BDF8"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top-Performing Content Leaderboard */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Top-Performing Content Leaderboard
            </h2>
            <p className="text-xs text-slate-400">
              Highest-converting posts ranked by engagement rate and audience retention.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Rank & Title</th>
                <th className="py-3 px-4">Platform & Format</th>
                <th className="py-3 px-4 text-right">Reach</th>
                <th className="py-3 px-4 text-right">Engagement Rate</th>
                <th className="py-3 px-4 text-right">Click-Through Rate</th>
                <th className="py-3 px-4 text-right">Audience Retention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {topPerformingContent.map((post, idx) => (
                <tr key={post.id} className="hover:bg-slate-800/35">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">
                      0{idx + 1}. {post.postTitle}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {post.category} · {post.publishedDate} · {post.dataOrigin}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                    {post.platform} · {post.contentFormat}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200">
                    {post.reach.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-sky-400">
                    {post.engagementRate.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-400">
                    {post.clickThroughRate.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-400">
                    {post.audienceRetention.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

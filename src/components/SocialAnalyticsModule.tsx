import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  Trash2,
} from 'lucide-react';
import {
  SocialMetricRecord,
  SOCIAL_PLATFORMS,
  TREND_CATEGORIES,
  CONTENT_FORMATS,
} from '../types.ts';

interface SocialAnalyticsModuleProps {
  metrics: SocialMetricRecord[];
  onAddMetric: (data: {
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
  }) => Promise<void>;
  onBulkUploadCsv: (rows: Array<any>) => Promise<void>;
  onDeleteMetric: (id: number) => Promise<void>;
}

export const SocialAnalyticsModule: React.FC<SocialAnalyticsModuleProps> = ({
  metrics,
  onAddMetric,
  onBulkUploadCsv,
  onDeleteMetric,
}) => {
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [originFilter, setOriginFilter] = useState<string>('All');
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Manual Entry State
  const [platform, setPlatform] = useState<string>('X');
  const [postTitle, setPostTitle] = useState('');
  const [category, setCategory] = useState<string>(TREND_CATEGORIES[0]);
  const [contentFormat, setContentFormat] = useState<string>(
    CONTENT_FORMATS[0]
  );
  const [publishedDate, setPublishedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reach, setReach] = useState('45000');
  const [impressions, setImpressions] = useState('68000');
  const [likes, setLikes] = useState('2100');
  const [comments, setComments] = useState('310');
  const [shares, setShares] = useState('540');
  const [engagementRate, setEngagementRate] = useState('4.34');
  const [clickThroughRate, setClickThroughRate] = useState('3.20');
  const [audienceRetention, setAudienceRetention] = useState('74.5');
  const [submitting, setSubmitting] = useState(false);

  // CSV Upload State
  const [csvText, setCsvText] = useState('');
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredMetrics = metrics.filter((m) => {
    const matchesPlatform =
      platformFilter === 'All' || m.platform === platformFilter;
    const matchesOrigin =
      originFilter === 'All' || m.dataOrigin === originFilter;
    return matchesPlatform && matchesOrigin;
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;
    setSubmitting(true);
    setStatusMessage(null);
    try {
      await onAddMetric({
        platform,
        postTitle: postTitle.trim(),
        category,
        contentFormat,
        publishedDate,
        reach: Number(reach) || 0,
        impressions: Number(impressions) || 0,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        shares: Number(shares) || 0,
        engagementRate: Number(engagementRate) || 0,
        clickThroughRate: Number(clickThroughRate) || 0,
        audienceRetention: Number(audienceRetention) || 0,
        dataOrigin: 'Manual Entry',
      });
      setPostTitle('');
      setShowManualForm(false);
      setStatusMessage('Manual metric entry saved to PostgreSQL (labeled as Manual Entry).');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const sampleCsv = [
      'platform,postTitle,category,contentFormat,publishedDate,reach,impressions,likes,comments,shares,engagementRate,clickThroughRate,audienceRetention',
      'X,"Fed Dot Plot vs Gravia Order Book Thread",Macro & Finance,Thread / Long-Form Post,2026-11-02,162000,234000,5900,710,1640,5.09,3.75,79.2',
      'TikTok,"60s Live Probability Swing: Tariff Announcement",Global Events,Short-Form Video,2026-11-02,295000,360000,21400,1380,4600,7.60,2.25,73.8',
    ].join('\n');

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trendradar_social_metrics_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setUploadingCsv(true);
    setStatusMessage(null);
    try {
      const lines = csvText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV must include a header row and at least 1 data row.');
      }

      const headers = parseCsvLine(lines[0]);
      const parsedRows = lines.slice(1).map((line) => {
        const cols = parseCsvLine(line);
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] ?? '';
        });
        return {
          platform: rowObj.platform || 'X',
          postTitle: rowObj.postTitle || 'CSV Imported Post',
          category: rowObj.category || 'Prediction Markets',
          contentFormat: rowObj.contentFormat || 'Data Chart Graphic',
          publishedDate:
            rowObj.publishedDate || new Date().toISOString().slice(0, 10),
          reach: Number(rowObj.reach) || 0,
          impressions: Number(rowObj.impressions) || 0,
          likes: Number(rowObj.likes) || 0,
          comments: Number(rowObj.comments) || 0,
          shares: Number(rowObj.shares) || 0,
          engagementRate: Number(rowObj.engagementRate) || 0,
          clickThroughRate: Number(rowObj.clickThroughRate) || 0,
          audienceRetention: Number(rowObj.audienceRetention) || 0,
        };
      });

      await onBulkUploadCsv(parsedRows);
      setCsvText('');
      setShowCsvModal(false);
      setStatusMessage(
        `Successfully imported ${parsedRows.length} rows into PostgreSQL (explicitly labeled as CSV Upload).`
      );
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to parse CSV');
    } finally {
      setUploadingCsv(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Multi-Platform Social Media Analytics Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track Reach, Impressions, Likes, Comments, Shares, Engagement Rate, CTR, and Retention across X, Instagram, TikTok, YouTube, and LinkedIn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsvTemplate}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCsvModal((prev) => !prev);
              setShowManualForm(false);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showCsvModal ? 'Close CSV Importer' : 'Upload CSV Metrics'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowManualForm((prev) => !prev);
              setShowCsvModal(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showManualForm ? 'Close Entry Form' : 'Log Manual Metric'}</span>
          </button>
        </div>
      </div>

      {/* Data Provenance Notice Banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-200">
            Strict Data Provenance Governance:
          </span>{' '}
          All records display their exact ingestion origin (<span className="text-amber-400">Sample Demo Data</span>, <span className="text-sky-400">Manual Entry</span>, or <span className="text-emerald-400">CSV Upload</span>) and are never misrepresented as unverified live platform API feeds.
        </div>
        {statusMessage && (
          <span className="text-sky-400 font-medium shrink-0">
            {statusMessage}
          </span>
        )}
      </div>

      {/* CSV Upload Form */}
      {showCsvModal && (
        <form
          onSubmit={handleProcessCsvUpload}
          className="p-6 bg-slate-900/90 border border-slate-800 rounded-lg space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Bulk CSV Performance Import
              </h2>
              <p className="text-xs text-slate-400">
                Upload a `.csv` file or paste CSV rows matching the template header columns.
              </p>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
            />
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="platform,postTitle,category,contentFormat,publishedDate,reach,impressions,likes,comments,shares,engagementRate,clickThroughRate,audienceRetention&#10;X,&quot;FOMC Implied Odds Breakdown&quot;,Macro & Finance,Data Chart Graphic,2026-11-02,145000,210000,4900,520,1310,4.64,3.40,78.0"
            className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCsvModal(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingCsv}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors disabled:opacity-50"
            >
              {uploadingCsv ? 'Importing CSV...' : 'Import CSV to PostgreSQL'}
            </button>
          </div>
        </form>
      )}

      {/* Manual Metric Entry Form */}
      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="p-6 bg-slate-900/90 border border-slate-800 rounded-lg space-y-5"
        >
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Log Manual Social Post Performance Entry
            </h2>
            <p className="text-xs text-slate-400">
              Record verified post metrics from X, Instagram, TikTok, YouTube, or LinkedIn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Social Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Post / Video Title *
              </label>
              <input
                type="text"
                required
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g., CPI Surprise Implied Probability Breakdown"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Published Date
              </label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Topic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              >
                {TREND_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Content Format
              </label>
              <select
                value={contentFormat}
                onChange={(e) => setContentFormat(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              >
                {CONTENT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reach
              </label>
              <input
                type="number"
                value={reach}
                onChange={(e) => setReach(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Impressions
              </label>
              <input
                type="number"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Likes
              </label>
              <input
                type="number"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Comments
              </label>
              <input
                type="number"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Shares / Reposts
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Engagement Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={engagementRate}
                onChange={(e) => setEngagementRate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Click-Through Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={clickThroughRate}
                onChange={(e) => setClickThroughRate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Audience Retention (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={audienceRetention}
                onChange={(e) => setAudienceRetention(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving Entry...' : 'Save Metric Record'}
            </button>
          </div>
        </form>
      )}

      {/* Platform & Data Origin Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setPlatformFilter('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              platformFilter === 'All'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Platforms ({metrics.length})
          </button>
          {SOCIAL_PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                platformFilter === p
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
        >
          <option value="All">All Provenance Sources</option>
          <option value="Sample Demo Data">Sample Demo Data</option>
          <option value="Manual Entry">Manual Entry</option>
          <option value="CSV Upload">CSV Upload</option>
        </select>
      </div>

      {/* High-Density Social Metrics Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Post Title & Provenance</th>
                <th className="py-3 px-4">Platform & Format</th>
                <th className="py-3 px-4 text-right">Reach</th>
                <th className="py-3 px-4 text-right">Impressions</th>
                <th className="py-3 px-4 text-right">Likes / Comm / Shares</th>
                <th className="py-3 px-4 text-right">Eng. Rate</th>
                <th className="py-3 px-4 text-right">CTR</th>
                <th className="py-3 px-4 text-right">Retention</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredMetrics.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-slate-800/35 transition-colors"
                >
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-semibold text-slate-100 truncate">
                      {m.postTitle}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <span>{m.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {m.publishedDate}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          m.dataOrigin === 'Sample Demo Data'
                            ? 'text-amber-400'
                            : m.dataOrigin === 'CSV Upload'
                            ? 'text-emerald-400'
                            : 'text-sky-400'
                        }
                      >
                        {m.dataOrigin}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-200">
                      {m.platform}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {m.contentFormat}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200">
                    {m.reach.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                    {m.impressions.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                    {m.likes.toLocaleString()} / {m.comments.toLocaleString()} /{' '}
                    {m.shares.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-sky-400">
                    {m.engagementRate.toFixed(2)}%
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-400">
                    {m.clickThroughRate.toFixed(2)}%
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200">
                    {m.audienceRetention.toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteMetric(m.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete metric record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

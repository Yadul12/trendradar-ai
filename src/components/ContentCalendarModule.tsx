import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  CalendarItemRecord,
  ChecklistItem,
  TrendRecord,
  SOCIAL_PLATFORMS,
  TREND_CATEGORIES,
  CONTENT_FORMATS,
} from '../types.ts';

interface ContentCalendarModuleProps {
  calendarItems: CalendarItemRecord[];
  trends: TrendRecord[];
  onCreateCalendarItem: (data: {
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
  }) => Promise<void>;
  onUpdateCalendarItem: (
    id: number,
    updates: Partial<CalendarItemRecord>
  ) => Promise<void>;
  onDeleteCalendarItem: (id: number) => Promise<void>;
}

const CALENDAR_STATUSES = [
  'Ideation',
  'Drafting',
  'Review',
  'Scheduled',
  'Published',
] as const;

export const ContentCalendarModule: React.FC<ContentCalendarModuleProps> = ({
  calendarItems,
  trends,
  onCreateCalendarItem,
  onUpdateCalendarItem,
  onDeleteCalendarItem,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [showNewModal, setShowNewModal] = useState(false);

  // New Calendar Entry State
  const [title, setTitle] = useState('');
  const [trendId, setTrendId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [scheduledTime, setScheduledTime] = useState<string>('14:00 UTC');
  const [platform, setPlatform] = useState<string>('X');
  const [contentFormat, setContentFormat] = useState<string>(
    CONTENT_FORMATS[0]
  );
  const [status, setStatus] = useState<string>('Scheduled');
  const [priority, setPriority] = useState<string>('High');
  const [category, setCategory] = useState<string>(TREND_CATEGORIES[0]);
  const [hookDraft, setHookDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const filteredItems = calendarItems.filter((item) => {
    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;
    const matchesPlatform =
      platformFilter === 'All' || item.platform === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  const handleTrendSelect = (selectedId: string) => {
    setTrendId(selectedId);
    const found = trends.find((t) => t.id === Number(selectedId));
    if (found) {
      setTitle(found.title);
      setCategory(found.category);
      setPlatform(found.recommendedPlatform);
      setPriority(found.priority);
      setHookDraft(found.suggestedHook);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreateCalendarItem({
        trendId: trendId ? Number(trendId) : null,
        title: title.trim(),
        scheduledDate,
        scheduledTime,
        platform,
        contentFormat,
        status,
        priority,
        category,
        hookDraft,
      });
      setTitle('');
      setHookDraft('');
      setTrendId('');
      setShowNewModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChecklistItem = async (
    item: CalendarItemRecord,
    checkId: string
  ) => {
    let list: ChecklistItem[] = [];
    try {
      list = JSON.parse(item.checklistJson || '[]');
    } catch {
      list = [];
    }
    const updatedList = list.map((c) =>
      c.id === checkId ? { ...c, done: !c.done } : c
    );
    await onUpdateCalendarItem(item.id, {
      checklistJson: JSON.stringify(updatedList),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Editorial Content Calendar & Publishing Checklist
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Plan, verify, and track multi-platform content distribution from ideation through final compliance sign-off.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>
            {showNewModal ? 'Close Planner Form' : 'Schedule New Content'}
          </span>
        </button>
      </div>

      {/* New Calendar Item Form */}
      {showNewModal && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-6 bg-slate-900/90 border border-slate-800 rounded-lg space-y-5"
        >
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Schedule New Content Distribution Item
            </h2>
            <p className="text-xs text-slate-400">
              Link directly to a monitored trend or create a standalone editorial campaign item.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pre-fill from Monitored Trend (Optional)
              </label>
              <select
                value={trendId}
                onChange={(e) => handleTrendSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              >
                <option value="">-- Custom Standalone Content Idea --</option>
                {trends.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.opportunityScore}/100] {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Scheduled Time (UTC)
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Content Working Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., FOMC Repo Liquidity vs CPI Implied Odds Thread"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Platform
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
                Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              >
                {CALENDAR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Draft Hook / Opening Script
              </label>
              <input
                type="text"
                value={hookDraft}
                onChange={(e) => setHookDraft(e.target.value)}
                placeholder="Opening hook line..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors disabled:opacity-50"
            >
              {saving ? 'Scheduling...' : 'Save to Calendar'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'All'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Statuses ({calendarItems.length})
          </button>
          {CALENDAR_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
        >
          <option value="All">All Platforms</option>
          {SOCIAL_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Cards & Interactive Publishing Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredItems.map((item) => {
          let checklist: ChecklistItem[] = [];
          try {
            checklist = JSON.parse(item.checklistJson || '[]');
          } catch {
            checklist = [];
          }
          const completedCount = checklist.filter((c) => c.done).length;

          return (
            <div
              key={item.id}
              className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                {/* Top Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 font-mono tabular-nums text-sky-400">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>
                      {item.scheduledDate} · {item.scheduledTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        onUpdateCalendarItem(item.id, {
                          status: e.target.value,
                        })
                      }
                      className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 font-medium"
                    >
                      {CALENDAR_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          Status: {s}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => onDeleteCalendarItem(item.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete scheduled item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  {item.title}
                </h3>

                {/* Unboxed Inline Metadata */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">
                    {item.platform}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.contentFormat}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.category}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      item.priority === 'High'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }
                  >
                    {item.priority} Priority
                  </span>
                </div>

                {item.hookDraft && (
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800/90 rounded-md text-xs text-slate-300 leading-relaxed">
                    <span className="text-slate-500 font-medium block mb-1">
                      Scheduled Hook Draft:
                    </span>
                    “{item.hookDraft}”
                  </div>
                )}
              </div>

              {/* Publishing Checklist */}
              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Publishing Compliance & Production Checklist
                  </span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {completedCount}/{checklist.length} Completed
                  </span>
                </div>

                <div className="space-y-1.5">
                  {checklist.map((chk) => (
                    <button
                      key={chk.id}
                      type="button"
                      onClick={() => handleToggleChecklistItem(item, chk.id)}
                      className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded bg-slate-950/60 hover:bg-slate-950 border border-slate-800/60 transition-colors"
                    >
                      {chk.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          chk.done
                            ? 'line-through text-slate-500'
                            : 'text-slate-200'
                        }`}
                      >
                        {chk.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * @fileoverview Hook for audit logs, stats, and client-side filtering.
 * Supports search by actor/details, action type multi-select, and date range.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API } from '@/lib/api';
import type { AuditLog } from '@/types';

export interface AuditStats {
  total: number;
  today: number;
  actors: number;
}

export interface ActivityPoint {
  date: string;
  count: number;
}

export interface ActionDistribution {
  action: string;
  count: number;
  fill: string;
}

export interface AuditFilters {
  searchQuery: string;
  actionFilter: string[];   // Empty = show all actions
  dateFrom: string;         // ISO date string YYYY-MM-DD
}

export interface UseAuditOptions {
  userId: string | undefined;
  /** Auto-refresh interval in ms; 0 to disable. Default 30000. */
  autoRefreshMs?: number;
}

export interface UseAuditResult {
  logs: AuditLog[];
  filteredLogs: AuditLog[];
  stats: AuditStats;
  filteredStats: AuditStats;
  activityTimeSeries: ActivityPoint[];
  actionDistribution: ActionDistribution[];
  lastSynced: Date | null;

  filters: AuditFilters;
  setFilters: (f: Partial<AuditFilters>) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  uniqueActions: string[];

  isLoading: boolean;
  isSyncing: boolean;
  refresh: () => Promise<void>;
  /** Tailwind classes for action badge by action string. */
  getActionColor: (action: string) => string;
  /** Get the hex color associated with an action (matching the chart). */
  getActionHex: (action: string) => string;
}

const CHART_PALETTE = [
  '#4F46E5', // Indigo 600
  '#0EA5E9', // Sky 600
  '#10B981', // Emerald 600
  '#F59E0B', // Amber 600
  '#3B82F6', // Blue 600
  '#8B5CF6', // Violet 600
  '#EC4899', // Pink 600
  '#14B8A6', // Teal 600
  '#F97316', // Orange 600
  '#6366F1', // Indigo 500
  '#2563EB', // Blue 700
  '#059669', // Emerald 700
  '#D97706', // Amber 700
  '#64748B', // Slate 600
];

const DEFAULT_FILTERS: AuditFilters = {
  searchQuery: '',
  actionFilter: [],
  dateFrom: '',
};

/**
 * Loads audit logs for the user's organization, computes stats/charts,
 * and provides client-side filtering by search, action type, and date.
 */
export function useAudit({
  userId,
  autoRefreshMs = 30000,
}: UseAuditOptions): UseAuditResult {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({ total: 0, today: 0, actors: 0 });
  const [activityTimeSeries, setActivityTimeSeries] = useState<ActivityPoint[]>([]);
  const [actionDistribution, setActionDistribution] = useState<ActionDistribution[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionColors, setActionColors] = useState<Map<string, string>>(new Map());
  const [filters, setFiltersState] = useState<AuditFilters>(DEFAULT_FILTERS);

  const setFilters = useCallback((f: Partial<AuditFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const getActionColor = useCallback((action: string) => {
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('remove')) return 'text-red-700 bg-red-50 border-red-100';
    if (a.includes('create') || a.includes('add')) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (a.includes('update') || a.includes('edit') || a.includes('updated')) return 'text-sky-700 bg-sky-50 border-sky-100';
    if (a.includes('invite')) return 'text-indigo-700 bg-indigo-50 border-indigo-100';
    if (a.includes('submit') || a.includes('assessment')) return 'text-violet-700 bg-violet-50 border-violet-100';
    if (a.includes('login') || a.includes('auth')) return 'text-purple-700 bg-purple-50 border-purple-100';
    if (a.includes('lockdown') || a.includes('cheat') || a.includes('violation')) return 'text-orange-700 bg-orange-50 border-orange-100';
    if (a.includes('accepted') || a.includes('accept')) return 'text-green-700 bg-green-50 border-green-100';
    if (a.includes('rejected') || a.includes('reject')) return 'text-red-700 bg-red-50 border-red-100';
    if (a.includes('status')) return 'text-yellow-700 bg-yellow-50 border-yellow-100';
    if (a.includes('transcript') || a.includes('viewed')) return 'text-cyan-700 bg-cyan-50 border-cyan-100';
    if (a.includes('cv') || a.includes('reveal') || a.includes('accessed')) return 'text-blue-700 bg-blue-50 border-blue-100';
    if (a.includes('session') || a.includes('started')) return 'text-teal-700 bg-teal-50 border-teal-100';
    if (a.includes('uploaded') || a.includes('upload')) return 'text-amber-700 bg-amber-50 border-amber-100';
    if (a.includes('organization')) return 'text-slate-700 bg-slate-50 border-slate-100';
    if (a.includes('reveal') || a.includes('view') || a.includes('send')) return 'text-blue-700 bg-blue-50 border-blue-100';
    if (a.includes('sync') || a.includes('refresh')) return 'text-cyan-700 bg-cyan-50 border-cyan-100';
    if (a.includes('export') || a.includes('download')) return 'text-amber-700 bg-amber-50 border-amber-100';
    if (a.includes('flag') || a.includes('alert')) return 'text-rose-700 bg-rose-50 border-rose-100';
    if (a.includes('filter') || a.includes('search')) return 'text-teal-700 bg-teal-50 border-teal-100';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  }, []);

  const getActionHex = useCallback((action: string) => {
    return actionColors.get(action) || '#64748B';
  }, [actionColors]);

  const computeChartData = useCallback((auditLogs: AuditLog[]) => {
    // 1. Time Series: last 7 days including today
    const seriesMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      seriesMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
    }

    // 2. Action Distribution
    const distMap = new Map<string, number>();

    auditLogs.forEach(log => {
      const logDate = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (seriesMap.has(logDate)) {
        seriesMap.set(logDate, seriesMap.get(logDate)! + 1);
      }
      const actionKey = log.action;
      distMap.set(actionKey, (distMap.get(actionKey) || 0) + 1);
    });

    const timeSeriesData = Array.from(seriesMap.entries()).map(([date, count]) => ({ date, count }));

    const colorMap = new Map<string, string>();
    const distData = Array.from(distMap.entries())
      .map(([action, count], index) => {
        const fill = CHART_PALETTE[index % CHART_PALETTE.length];
        colorMap.set(action, fill);
        return { action, count, fill };
      })
      .sort((a, b) => b.count - a.count);

    setActionColors(colorMap);
    setActivityTimeSeries(timeSeriesData);
    setActionDistribution(distData);
  }, []);

  const refreshLogs = useCallback(async (id: string) => {
    try {
      const data = await API.getAuditLogs(id);
      const list = data ?? [];
      setLogs(list);
      const today = new Date().toDateString();
      const todayLogs = list.filter((l: AuditLog) => new Date(l.created_at).toDateString() === today);
      const uniqueActors = new Set(list.map((l: AuditLog) => l.actor));
      setStats({ total: list.length, today: todayLogs.length, actors: uniqueActors.size });
      computeChartData(list);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to refresh audit logs', err);
    }
  }, [computeChartData]);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setIsSyncing(true);
    await refreshLogs(orgId);
    setIsSyncing(false);
  }, [orgId, refreshLogs]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const org = await API.getOrganization(userId);
        if (cancelled) return;
        if (org?.id) {
          setOrgId(org.id);
          await refreshLogs(org.id);
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to load audit', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, refreshLogs]);

  useEffect(() => {
    if (!orgId || autoRefreshMs <= 0) return;
    const interval = setInterval(() => refreshLogs(orgId), autoRefreshMs);
    return () => clearInterval(interval);
  }, [orgId, autoRefreshMs, refreshLogs]);

  // ─── Client-side filter logic ─────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        l =>
          l.actor.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q)
      );
    }

    if (filters.actionFilter.length > 0) {
      const allowed = new Set(filters.actionFilter);
      result = result.filter(l => allowed.has(l.action));
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(filters.dateFrom);
      to.setHours(23, 59, 59, 999);
      result = result.filter(l => {
        const d = new Date(l.created_at);
        return d >= from && d <= to;
      });
    }

    return result;
  }, [logs, filters]);

  const filteredStats = useMemo<AuditStats>(() => {
    const today = new Date().toDateString();
    return {
      total: filteredLogs.length,
      today: filteredLogs.filter(l => new Date(l.created_at).toDateString() === today).length,
      actors: new Set(filteredLogs.map(l => l.actor)).size,
    };
  }, [filteredLogs]);

  const uniqueActions = useMemo(
    () => Array.from(new Set(logs.map(l => l.action))).sort(),
    [logs]
  );

  const isFiltered = useMemo(
    () =>
      filters.searchQuery.trim() !== '' ||
      filters.actionFilter.length > 0 ||
      filters.dateFrom !== '',
    [filters]
  );

  return {
    logs,
    filteredLogs,
    stats,
    filteredStats,
    activityTimeSeries,
    actionDistribution,
    lastSynced,
    filters,
    setFilters,
    resetFilters,
    isFiltered,
    uniqueActions,
    isLoading,
    isSyncing,
    refresh,
    getActionColor,
    getActionHex,
  };
}

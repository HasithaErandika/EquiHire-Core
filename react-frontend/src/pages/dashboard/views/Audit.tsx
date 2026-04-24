/**
 * Audit & Statistics view: stats cards, charts, and an audit log table
 * with a professional search/filter bar. Uses useAudit for all data logic.
 */

import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { useAudit } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, Clock, Users, AlertCircle, RefreshCw, BarChart2,
  History, PieChart as PieChartIcon, Search, ChevronDown,
  X, SlidersHorizontal, Calendar,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Label } from 'recharts';
import {
  type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import CandidateViolations from './CandidateViolations';

// ─── Action-filter Dropdown ───────────────────────────────────────────────────

function ActionFilterDropdown({
  actions,
  selected,
  getActionColor,
  onChange,
}: {
  actions: string[];
  selected: string[];
  getActionColor: (a: string) => string;
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function toggle(action: string) {
    const next = selected.includes(action)
      ? selected.filter(a => a !== action)
      : [...selected, action];
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-[7px] text-sm rounded-lg border-2 font-medium transition-all whitespace-nowrap
          ${selected.length > 0
            ? 'bg-primary/10 border-primary text-primary shadow-sm'
            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
        <span>Action Type</span>
        {selected.length > 0 ? (
          <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {selected.length}
          </span>
        ) : (
          <span className="text-xs text-gray-400 font-normal">All</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-72 overflow-y-auto">
          {actions.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400 text-center">No actions in logs yet</p>
          ) : (
            <>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium border-b border-gray-100 mb-1"
                >
                  Clear selection
                </button>
              )}
              {actions.map(action => (
                <label
                  key={action}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary accent-primary"
                    checked={selected.includes(action)}
                    onChange={() => toggle(action)}
                  />
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionColor(action)}`}
                  >
                    {action}
                  </span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditAndStatistics() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const {
    logs,
    filteredLogs,
    stats,
    filteredStats,
    activityTimeSeries,
    actionDistribution,
    lastSynced,
    isLoading,
    isSyncing,
    refresh,
    filters,
    setFilters,
    resetFilters,
    isFiltered,
    uniqueActions,
    getActionColor,
    getActionHex,
  } = useAudit({ userId, autoRefreshMs: 30000 });

  const displayStats = isFiltered ? filteredStats : stats;

  const activityChartConfig = {
    count: { label: 'Events', color: 'var(--primary)' },
  };

  const actionChartConfig = actionDistribution.reduce((acc, curr) => {
    const key = curr.action.toLowerCase().replace(/[^a-z0-9]/g, '-');
    acc[key] = {
      label: curr.action.charAt(0).toUpperCase() + curr.action.slice(1),
      color: curr.fill,
    };
    return acc;
  }, {} as ChartConfig);

  // Count active filter dimensions for badge
  const activeFilterCount =
    (filters.searchQuery.trim() ? 1 : 0) +
    (filters.actionFilter.length > 0 ? 1 : 0) +
    (filters.dateFrom ? 1 : 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500">
                Audit &amp; Statistics
              </h2>
              <p className="text-gray-500 text-sm font-medium">
                Monitor system interactions and evaluate overall candidate performance.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSynced && !isLoading && (
            <span className="text-xs text-gray-400">Last synced: {lastSynced.toLocaleTimeString()}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={isSyncing || isLoading}
            className="gap-2 border-gray-200 hover:border-primary hover:text-primary"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: isFiltered ? 'Filtered Events' : 'Total Events', value: displayStats.total, icon: Activity, color: 'bg-primary/10', iconColor: 'text-primary' },
          { label: "Today's Events", value: displayStats.today, icon: Clock, color: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Unique Actors', value: displayStats.actors, icon: Users, color: 'bg-green-50', iconColor: 'text-green-600' },
        ].map((stat, idx) => (
          <Card key={idx} className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} aria-hidden />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  )}
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Activity Over Time */}
        <Card className="shadow-sm border-gray-200/60 overflow-hidden">
          <CardHeader className="pb-2 bg-gray-50/50 border-b border-gray-100/50">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Activity Over Time (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-1 lg:px-6">
            {isLoading ? (
              <Skeleton className="h-[240px] w-full mx-4" />
            ) : activityTimeSeries.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No activity recorded</div>
            ) : (
              <ChartContainer config={activityChartConfig} className="h-[240px] w-full pr-6">
                <AreaChart data={activityTimeSeries} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    fillOpacity={1}
                    fill="url(#fillCount)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Distribution */}
        <Card className="shadow-sm border-gray-200/60 overflow-hidden">
          <CardHeader className="pb-2 bg-gray-50/50 border-b border-gray-100/50">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-500" />
              Action Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex justify-center">
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : actionDistribution.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No distribution data</div>
            ) : (
              <ChartContainer config={actionChartConfig} className="h-[240px] w-full [&_.recharts-pie-label-text]:fill-gray-600 font-medium">
                <PieChart>
                  <Pie
                    data={actionDistribution.map(d => ({
                      ...d,
                      fill: `var(--color-${d.action.toLowerCase().replace(/[^a-z0-9]/g, '-')})`
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="action"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                                {stats.total.toLocaleString()}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                                Total Logs
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="action" hideLabel />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Tabs: Audit Trail + Violations ─── */}
      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList className="bg-white/50 border border-gray-200/60 p-1 w-full sm:w-auto h-auto grid grid-cols-2 rounded-xl">
          <TabsTrigger
            value="audit"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 px-4 transition-all"
          >
            System Audit Logs
          </TabsTrigger>
          <TabsTrigger
            value="violations"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 px-4 transition-all"
          >
            Candidate Violations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">

          {/* ─── Filter Bar ─── */}
          <Card className="shadow-sm border-gray-200/60 relative z-20">
            <CardContent className="py-3 px-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center flex-wrap">

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by actor, action, or details…"
                    value={filters.searchQuery}
                    onChange={e => setFilters({ searchQuery: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                </div>

                {/* Action Type Dropdown */}
                <ActionFilterDropdown
                  actions={uniqueActions}
                  selected={filters.actionFilter}
                  getActionColor={getActionColor}
                  onChange={v => setFilters({ actionFilter: v })}
                />

                {/* Date From */}
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    title="From date"
                    value={filters.dateFrom}
                    onChange={e => setFilters({ dateFrom: e.target.value })}
                    className="pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-700
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                </div>



                {/* Reset */}
                {isFiltered && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-100 bg-red-50 text-red-600
                      hover:bg-red-100 transition-all font-medium whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                    {activeFilterCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Active filter summary banner */}
              {isFiltered && !isLoading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-primary/80 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  Showing {filteredLogs.length} of {logs.length} events
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Audit Table ─── */}
          <Card className="shadow-sm border-gray-200/60 overflow-hidden">
            <CardHeader className="pb-3 bg-gray-50/50 border-b border-gray-100/50">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" aria-hidden />
                Audit Trail
                <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-1 rounded">
                  Auto-refreshes 30s
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-0">
                  <div className="bg-gray-50 border-b border-gray-100 flex px-6 py-3 space-x-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="px-6 py-4 flex space-x-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-3" aria-hidden />
                  {isFiltered ? (
                    <>
                      <p className="text-sm">No events match your filters.</p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 text-xs text-primary underline-offset-2 hover:underline"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">No audit logs recorded yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Actions will appear here as they happen.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-auto max-h-[520px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100 sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-6 py-4 text-left uppercase tracking-wider text-[10px]">Time</th>
                        <th className="px-6 py-4 text-left uppercase tracking-wider text-[10px]">Action</th>
                        <th className="px-6 py-4 text-left uppercase tracking-wider text-[10px]">Actor</th>
                        <th className="px-6 py-4 text-left uppercase tracking-wider text-[10px]">Target</th>
                        <th className="px-6 py-4 text-left uppercase tracking-wider text-[10px]">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-3 text-gray-400 whitespace-nowrap text-xs">
                            <span className="block">{new Date(log.created_at).toLocaleDateString()}</span>
                            <span className="block text-[11px] text-gray-300">{new Date(log.created_at).toLocaleTimeString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const fill = getActionHex(log.action);
                              return (
                                <span
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${fill}15`,
                                    color: fill,
                                    borderColor: `${fill}30`,
                                  }}
                                >
                                  {log.action}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-3 text-gray-700 font-medium text-xs">{log.actor}</td>
                          <td className="px-6 py-3 text-gray-600 text-xs font-mono">{log.target}</td>
                          <td className="px-6 py-3 text-gray-500 text-xs max-w-[220px] truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="focus-visible:outline-none focus-visible:ring-0">
          <CandidateViolations />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Audit & Statistics view: stats cards and audit log table with auto-refresh.
 * Uses useAudit for logs, stats, sync, and action badge styling.
 */

import { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { useAudit } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Clock, Users, AlertCircle, RefreshCw, BarChart2, History, PieChart as PieChartIcon, Search, FileText, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Label } from 'recharts';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import CandidateViolations from './CandidateViolations';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { deriveCategory } from '@/types/audit';
import type { AuditLog } from '@/types/audit';

export default function AuditAndStatistics() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const {
    logs,
    stats,
    activityTimeSeries,
    actionDistribution,
    lastSynced,
    isLoading,
    isSyncing,
    refresh,
    getActionHex,
  } = useAudit({ userId, autoRefreshMs: 30000 });

  const activityChartConfig = {
    count: {
      label: "Events",
      color: "var(--primary)",
    },
  };

  const actionChartConfig = actionDistribution.reduce((acc, curr) => {
    // Slugify action names for safe CSS variable keys
    const key = curr.action.toLowerCase().replace(/[^a-z0-9]/g, '-');
    acc[key] = {
      label: curr.action.charAt(0).toUpperCase() + curr.action.slice(1),
      color: curr.fill,
    };
    return acc;
  }, {} as ChartConfig);

  const filteredLogs = logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const category = log.action_category || deriveCategory(log.action);
      const matchesCategory = categoryFilter === 'ALL' || category === categoryFilter;

      const severity = log.severity || 'INFO';
      const matchesSeverity = severityFilter === 'ALL' || severity === severityFilter;

      return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500">Audit & Statistics</h2>
              <p className="text-gray-500 text-sm font-medium">Monitor system interactions and evaluate overall candidate performance.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Events', value: stats.total, icon: Activity, color: 'bg-primary/10', iconColor: 'text-primary' },
          { label: "Today's Events", value: stats.today, icon: Clock, color: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Unique Actors', value: stats.actors, icon: Users, color: 'bg-green-50', iconColor: 'text-green-600' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Activity Over Time Chart */}
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

        {/* Action Distribution Chart */}
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
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {stats.total.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground text-[10px] uppercase tracking-wider font-semibold"
                              >
                                Total Logs
                              </tspan>
                            </text>
                          )
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

        <TabsContent value="audit" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">

          <Card className="shadow-sm border-gray-200/60 overflow-hidden">
            <CardHeader className="pb-3 bg-gray-50/50 border-b border-gray-100/50 space-y-4">
              <div className="flex justify-between items-center w-full">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" aria-hidden />
                  Audit Trail
                  <span className="ml-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2 py-1 rounded">Auto-refreshes 30s</span>
                </CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="text" 
                    placeholder="Search action, actor, target or details..." 
                    className="pl-9 bg-white text-sm focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px] bg-white text-sm focus:ring-primary/20">
                     <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="AI_GEMINI">Gemini AI</SelectItem>
                    <SelectItem value="AI_HUGGINGFACE">HuggingFace AI</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="HIRING">Hiring Decisions</SelectItem>
                    <SelectItem value="CANDIDATE">Candidate Flow</SelectItem>
                    <SelectItem value="VIOLATION">Violations</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[140px] bg-white text-sm focus:ring-primary/20">
                     <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Severities</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARN">Warning</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-3" aria-hidden />
                  <p className="text-sm">No audit logs recorded yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Actions will appear here as they happen.</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[500px]">
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
                        <tr 
                          key={log.id} 
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="px-6 py-3 text-gray-400 whitespace-nowrap text-xs">
                            {new Date(log.created_at).toLocaleString()}
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
                                    borderColor: `${fill}30`
                                  }}
                                >
                                  {log.action}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-3 text-gray-700 font-medium text-xs">{log.actor}</td>
                          <td className="px-6 py-3 text-gray-600 text-xs font-mono">{log.target}</td>
                          <td className="px-6 py-3 text-gray-500 text-xs max-w-[200px] truncate">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Dialog open={!!selectedLog} onOpenChange={(open: boolean) => !open && setSelectedLog(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                   <FileText className="w-5 h-5 text-indigo-500" /> 
                   Audit Record Details
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="text-xs font-mono text-gray-500 break-all pt-2 select-text">
                    ID: {selectedLog?.id}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-gray-700 mt-2">
                 <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                   <div>
                     <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Action</span>
                     <span className="font-medium text-gray-900">{selectedLog?.action}</span>
                   </div>
                   <div>
                     <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Date & Time</span>
                     <span className="text-gray-900">{selectedLog?.created_at ? new Date(selectedLog.created_at).toLocaleString() : ''}</span>
                   </div>
                   <div>
                     <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Actor (User/System)</span>
                     <span className="text-gray-900 break-all">{selectedLog?.actor}</span>
                   </div>
                   <div>
                     <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Target Entity</span>
                     <span className="text-gray-900 break-all">{selectedLog?.target}</span>
                   </div>
                 </div>
                 
                 <div>
                   <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Summary</span>
                   <p className="text-gray-800 leading-relaxed bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                     {selectedLog?.details}
                   </p>
                 </div>
                 
                 {selectedLog?.metadata && (
                    <div className="mt-6">
                       <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 flex flex-row items-center gap-2">
                         <Layers className="w-3.5 h-3.5" /> Extended Metadata (AI / Request Data)
                       </span>
                       <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl overflow-x-auto text-[11px] text-emerald-400 font-mono shadow-inner custom-scrollbar">
                          {typeof selectedLog.metadata === 'string' 
                            ? selectedLog.metadata 
                            : JSON.stringify(selectedLog.metadata, null, 2)}
                       </pre>
                    </div>
                 )}
              </div>
            </DialogContent>
          </Dialog>

        </TabsContent>

        <TabsContent value="violations" className="focus-visible:outline-none focus-visible:ring-0">
          <CandidateViolations />
        </TabsContent>
      </Tabs>
    </div>
  );
}

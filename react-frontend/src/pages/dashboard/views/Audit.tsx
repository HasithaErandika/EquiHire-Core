/**
 * Audit & Statistics view: stats cards and audit log table with auto-refresh.
 * Uses useAudit for logs, stats, sync, and action badge styling.
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useAudit } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Shield, Clock, Users, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import CandidateViolations from './CandidateViolations';

export default function AuditAndStatistics() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const {
    logs,
    stats,
    activityTimeSeries,
    actionDistribution,
    lastSynced,
    isLoading,
    isSyncing,
    refresh,
    getActionColor,
  } = useAudit({ userId, autoRefreshMs: 30000 });

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
        <Card className="shadow-sm border-gray-200/60 w-full overflow-hidden">
          <CardHeader className="pb-2 bg-gray-50/50">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Activity Over Time (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-1">
            {isLoading ? (
               <Skeleton className="h-[240px] w-full mx-4" />
            ) : activityTimeSeries.length === 0 ? (
               <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No activity recorded</div>
            ) : (
               <ChartContainer config={{ count: { label: "Events", color: "#10B981" } }} className="h-[240px] w-full pr-6">
                 <AreaChart data={activityTimeSeries} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                   <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                   <Area type="monotone" dataKey="count" stroke="#10B981" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                 </AreaChart>
               </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Distribution Chart */}
        <Card className="shadow-sm border-gray-200/60 w-full overflow-hidden">
          <CardHeader className="pb-2 bg-gray-50/50">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Action Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex justify-center w-full">
            {isLoading ? (
               <Skeleton className="h-[240px] w-full mx-4" />
            ) : actionDistribution.length === 0 ? (
               <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No distribution data</div>
            ) : (
               <ChartContainer config={{}} className="h-[240px] w-full [&_.recharts-pie-label-text]:fill-gray-600">
                 <PieChart>
                   <Pie
                     data={actionDistribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={95}
                     paddingAngle={3}
                     dataKey="count"
                     nameKey="action"
                     stroke="none"
                   >
                     {actionDistribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Pie>
                   <ChartTooltip content={<ChartTooltipContent nameKey="action" />} />
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

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" aria-hidden />
            Audit Trail
            <span className="ml-auto text-xs font-normal text-gray-400">Auto-refreshes every 30s</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-0">
               <div className="bg-gray-50 border-b border-gray-100 flex px-6 py-3 space-x-4">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
               </div>
               <div className="divide-y divide-gray-100">
                  {[1,2,3,4,5].map(i => (
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
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Action</th>
                    <th className="px-6 py-3 text-left">Actor</th>
                    <th className="px-6 py-3 text-left">Target</th>
                    <th className="px-6 py-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
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
      </TabsContent>

      <TabsContent value="violations" className="focus-visible:outline-none focus-visible:ring-0">
        <CandidateViolations />
      </TabsContent>
    </Tabs>
    </div>
  );
}

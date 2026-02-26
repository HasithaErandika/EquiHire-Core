import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from "@asgardeo/auth-react";
import { API } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Shield, Clock, Users, AlertCircle, RefreshCw } from "lucide-react";

type AuditLog = {
    id: string;
    action: string;
    actor: string;
    target: string;
    details: string;
    created_at: string;
};

export default function AuditAndStatistics() {
    const { state } = useAuthContext();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [stats, setStats] = useState({ total: 0, today: 0, actors: 0 });
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);

    useEffect(() => {
        if (state.sub) {
            loadData(state.sub);
        }
    }, [state.sub]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!orgId) return;
        const interval = setInterval(() => {
            refreshLogs(orgId);
        }, 30000);
        return () => clearInterval(interval);
    }, [orgId]);

    const loadData = async (userId: string) => {
        setIsLoading(true);
        try {
            const org = await API.getOrganization(userId);
            if (org && org.id) {
                setOrgId(org.id);
                await refreshLogs(org.id);
            }
        } catch (err) {
            console.error("Failed to load audit logs", err);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshLogs = useCallback(async (id: string) => {
        try {
            const data = await API.getAuditLogs(id);
            setLogs(data || []);

            // Compute stats
            const today = new Date().toDateString();
            const todayLogs = (data || []).filter((l: AuditLog) => new Date(l.created_at).toDateString() === today);
            const uniqueActors = new Set((data || []).map((l: AuditLog) => l.actor));
            setStats({
                total: (data || []).length,
                today: todayLogs.length,
                actors: uniqueActors.size,
            });
            setLastSynced(new Date());
        } catch (err) {
            console.error("Failed to refresh audit logs", err);
        }
    }, []);

    const handleSync = async () => {
        if (!orgId || isSyncing) return;
        setIsSyncing(true);
        await refreshLogs(orgId);
        setIsSyncing(false);
    };

    const getActionColor = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('delete') || a.includes('remove') || a.includes('violation')) return 'text-red-600 bg-red-50';
        if (a.includes('create') || a.includes('add') || a.includes('invite') || a.includes('submit')) return 'text-green-600 bg-green-50';
        if (a.includes('update') || a.includes('edit') || a.includes('send')) return 'text-blue-600 bg-blue-50';
        if (a.includes('login') || a.includes('auth')) return 'text-purple-600 bg-purple-50';
        if (a.includes('lockdown') || a.includes('flag') || a.includes('cheat')) return 'text-orange-600 bg-orange-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Audit & Statistics</h2>
                    <p className="text-gray-500">Monitor system interactions and evaluate overall candidate performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    {lastSynced && (
                        <span className="text-xs text-gray-400">
                            Last synced: {lastSynced.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing || isLoading}
                        className="gap-2 border-gray-200 hover:border-[#FF7300] hover:text-[#FF7300]"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-orange-50">
                                <Activity className="w-5 h-5 text-[#FF7300]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-xs text-gray-500">Total Events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-50">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                                <p className="text-xs text-gray-500">Today's Events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-50">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.actors}</p>
                                <p className="text-xs text-gray-500">Unique Actors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Log Table */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-500" />
                        Audit Trail
                        <span className="ml-auto text-xs font-normal text-gray-400">Auto-refreshes every 30s</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#FF7300]" />
                            Loading audit logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <AlertCircle className="w-8 h-8 mb-3" />
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
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
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
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Bell, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { API } from '@/lib/api';
import type { AuditLog } from '@/types';
import { isNotificationWorthy } from '@/types/audit';

export function NotificationPanel({ orgId }: { orgId: string }) {
  const [notifications, setNotifications] = useState<AuditLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!orgId) return;
    
    const fetchLogs = async () => {
      try {
        const logs = await API.getAuditLogs(orgId);
        // Filter to only show special/notification-worthy logs requested by user
        const worthyLogs = logs.filter(isNotificationWorthy);
        const recent = worthyLogs.slice(0, 10);
        setNotifications(recent);
        // Only increment unread if there are new ones (dummy logic for visual demo)
        if (recent.length > 0) {
          setUnreadCount(Math.min(recent.length, 3)); 
        }
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [orgId]);

  const handleOpen = (open: boolean) => {
    if (open) setUnreadCount(0);
  };

  const getIcon = (action: string) => {
    if (action.includes('reject') || action.includes('flag')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (action.includes('accept')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-blue-500" />;
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'submit_assessment': return 'New Assessment Submitted';
      case 'candidate_accepted': return 'Candidate Accepted';
      case 'candidate_rejected': return 'Candidate Rejected';
      case 'flag_legacy': return 'Cheating Violation Flagged';
      case 'session_started': return 'Live Session Started';
      case 'session_graded': return 'Assessment AI Graded';
      default: return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-500" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#FF7300] border-2 border-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] shadow-lg border-gray-100 rounded-xl mt-2">
        <DropdownMenuLabel className="font-bold flex justify-between items-center px-4 py-3">
          Notifications
          <span 
            className="text-xs text-primary font-medium cursor-pointer hover:underline" 
            onClick={() => setUnreadCount(0)}
          >
            Mark all as read
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-100" />
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No new notifications</div>
          ) : (
            notifications.map(log => (
              <DropdownMenuItem key={log.id} className="px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 cursor-default border-b border-gray-50 last:border-0 rounded-none">
                <div className="flex gap-3 items-start w-full">
                  <div className="mt-0.5 p-1.5 bg-gray-50 border border-gray-100 rounded-md">
                    {getIcon(log.action)}
                  </div>
                  <div className="flex flex-col space-y-1 w-full">
                    <span className="text-sm font-semibold text-gray-900 leading-none">{formatAction(log.action)}</span>
                    <span className="text-xs text-gray-500 font-medium truncate">Candidate ID: {log.target.substring(0, 8)}...</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                      {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="bg-gray-100" />
        <div className="p-2 text-center">
          <Button variant="ghost" className="w-full text-xs text-gray-500 hover:text-gray-900">
            View all audit logs
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Scheduler view: invite candidate form and recent invitations sidebar.
 * Uses useOrganization for org id and useInvitations for history list.
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useOrganization } from '@/hooks';
import { useInvitations } from '@/hooks';
import InviteCandidate from '../InviteCandidate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Mail } from 'lucide-react';

export default function InterviewScheduler() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const { organization } = useOrganization({ userId });
  const { history, isLoading } = useInvitations({ userId });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-xl">
               <Clock className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500">Schedule Interview</h2>
              <p className="text-gray-500 text-sm font-medium">Send magic link invitations to candidates for blind interview sessions.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2">
          <InviteCandidate organizationId={organization?.id} />
        </div>

        <div className="space-y-6">
          <Card className="shadow-md border-gray-100 h-full border-t-4 border-t-primary">
            <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" aria-hidden />
                Recent Invitations
              </CardTitle>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                {isLoading ? <Skeleton className="h-3 w-8" /> : `${history.length} sent`}
              </span>
            </CardHeader>
            <CardContent className="pt-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3 rounded-xl border border-gray-100 shadow-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-12 rounded-full" />
                      </div>
                      <div className="flex justify-between items-center pl-8">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center opacity-60">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <Mail className="w-6 h-6 text-gray-400" aria-hidden />
                  </div>
                  <p className="text-gray-500 text-sm">No invitations sent yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Sent invites will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((record) => {
                    const email = record.email ?? '';
                    const initial = email[0]?.toUpperCase() ?? '?';
                    return (
                    <div
                      key={record.id || email}
                      className="group flex flex-col p-3 rounded-xl bg-white hover:bg-primary/5 transition-all border border-gray-100 hover:border-primary/20 shadow-sm hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className="font-medium text-gray-900 text-sm truncate max-w-[180px] flex items-center"
                          title={email}
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-[10px] flex items-center justify-center mr-2 text-gray-600 font-bold">
                            {initial}
                          </div>
                          {email || '—'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-sm ${
                            record.status === 'opened' || record.status === 'accepted'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : record.status === 'delivered' || record.status === 'completed'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex justify-between items-center pl-8">
                        <span className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">{record.role}</span>
                        <span className="flex items-center text-gray-400">
                          <Clock className="w-3 h-3 mr-1" aria-hidden /> {record.time}
                        </span>
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

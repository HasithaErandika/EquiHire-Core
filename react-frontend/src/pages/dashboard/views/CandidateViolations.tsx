import { useAuthContext } from '@asgardeo/auth-react';
import { useCandidates } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export default function CandidateViolations() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const { candidates, isLoading } = useCandidates({ userId });

  const getIntegrityStatus = (count: number) => {
    if (count === 0) return { label: 'Clear', color: 'bg-green-100 text-green-700' };
    if (count < 3) return { label: 'Flagged', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'High Risk', color: 'bg-red-100 text-red-700' };
  };

  return (
    <Card className="shadow-sm border-gray-200 mt-6 animate-in fade-in duration-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-gray-500" aria-hidden />
          Candidate Integrity & Violations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-0">
             <div className="bg-gray-50 border-b border-gray-100 flex px-6 py-3 space-x-4">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
             </div>
             <div className="divide-y divide-gray-100">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="px-6 py-4 flex space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                ))}
             </div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertCircle className="w-8 h-8 mb-3" aria-hidden />
            <p className="text-sm">No candidates available.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">Candidate Info</th>
                  <th className="px-6 py-3 text-left">Overall Score</th>
                  <th className="px-6 py-3 text-left">CV Match</th>
                  <th className="px-6 py-3 text-left">Technical Score</th>
                  <th className="px-6 py-3 text-left">Violation Count</th>
                  <th className="px-6 py-3 text-left">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((candidate) => {
                  const cvScore = candidate.cvScore !== undefined ? candidate.cvScore.toFixed(1) : '—';
                  const technicalScore = candidate.skillsScore !== undefined ? candidate.skillsScore.toFixed(1) : (candidate.interviewScore !== undefined ? candidate.interviewScore.toFixed(1) : '—');
                  const count = candidate.cheatEventCount || 0;
                  const status = getIntegrityStatus(count);
                  
                  return (
                    <tr key={candidate.candidateId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900 text-sm">{candidate.candidateName}</div>
                        <div className="text-xs text-gray-500 font-mono" title={candidate.candidateId}>{candidate.candidateId.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-gray-700">{candidate.score ? candidate.score.toFixed(1) : '0.0'}%</span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 font-medium text-xs">{cvScore}{candidate.cvScore !== undefined ? '%' : ''}</td>
                      <td className="px-6 py-3 text-gray-600 font-medium text-xs">{technicalScore}{technicalScore !== '—' ? '%' : ''}</td>
                      <td className="px-6 py-3">
                         <div className="flex flex-col gap-1 items-start">
                           <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold ${count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                             {count} {count > 0 && candidate.hfRelevanceSkipped ? ` (+${candidate.hfRelevanceSkipped} flags)` : ''}
                           </span>
                           {candidate.cheatEventTypes && candidate.cheatEventTypes.length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-1">
                               {candidate.cheatEventTypes.map((type, i) => (
                                 <span key={i} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 uppercase tracking-tight font-semibold">
                                   {type.replace(/_/g, ' ')}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

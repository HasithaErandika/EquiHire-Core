import { Lock, Unlock, ChevronRight, XCircle, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCandidateStatusClasses } from '@/lib/utils';
import type { ExtendedCandidate } from '@/types';

export interface CandidateListTableProps {
  candidates: ExtendedCandidate[];
  selectedId: string | null;
  isLoading: boolean;
  onSelectCandidate: (candidate: ExtendedCandidate) => void;
}

function ScoreBadge({ score }: { score: number }) {
  if (score <= 0) {
    return <span className="text-gray-400 text-xs font-medium">—</span>;
  }
  const style =
    score >= 80
      ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
      : score >= 60
      ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20'
      : 'bg-red-50 text-red-700 ring-1 ring-red-600/20';

  const bar =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="flex flex-col gap-1 items-start">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style}`}>
        {score}%
      </span>
      <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function getInitials(name: string): string | null {
  if (!name || name === 'Unknown Candidate' || name.startsWith('Candidate #')) return null;
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function CandidateListTable({
  candidates,
  selectedId,
  isLoading,
  onSelectCandidate,
}: CandidateListTableProps) {
  return (
    <Card className="flex-1 overflow-hidden border-gray-100 shadow-md flex flex-col bg-white rounded-2xl">
      <div className="overflow-auto flex-1 p-3">
        <table className="w-full text-sm text-left border-separate" style={{ borderSpacing: '0 6px' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              {['Candidate', 'Role', 'AI Score', 'Status', ''].map((col, i) => (
                <th
                  key={i}
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80 first:rounded-l-xl last:rounded-r-xl"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="bg-white rounded-xl shadow-sm">
                  <td className="px-5 py-4 rounded-l-xl">
                    <div className="flex items-center">
                      <Skeleton className="w-10 h-10 rounded-full mr-4" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                  <td className="px-5 py-4 rounded-r-xl"><Skeleton className="h-6 w-6 rounded-full ml-auto" /></td>
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                      <User className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">No candidates in pipeline</p>
                    <p className="text-xs text-gray-400 mt-1">Invite candidates to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              candidates.map((c) => {
                const initials = getInitials(c.candidateName);
                const isSelected = selectedId === c.candidateId;
                return (
                  <tr
                    key={c.candidateId}
                    onClick={() => onSelectCandidate(c)}
                    className={`group cursor-pointer transition-all duration-200 rounded-xl
                      ${isSelected
                        ? 'bg-blue-50 shadow-sm ring-1 ring-blue-400/30'
                        : 'bg-white hover:bg-gray-50 hover:shadow-sm'}`}
                  >
                    {/* Candidate avatar + name */}
                    <td className="px-5 py-4 rounded-l-xl">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                              ${c.status === 'accepted'
                                ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                                : initials ? getAvatarColor(c.candidateName) : 'bg-gray-100 text-gray-400'}`}
                          >
                            {c.status === 'accepted'
                              ? <Unlock className="w-4 h-4" />
                              : initials
                              ? initials
                              : <Lock className="w-4 h-4" />}
                          </div>
                          {c.status !== 'accepted' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow ring-1 ring-gray-100">
                              <Lock className="w-2.5 h-2.5 text-gray-400" />
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-sm font-semibold truncate
                              ${c.status === 'accepted' ? 'text-gray-900' : 'text-gray-600 font-mono tracking-wider text-xs'}
                              ${!c.seen ? 'text-blue-700 font-bold' : ''}`}
                          >
                            {c.candidateName}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {/* 'New' badge — only for freshly applied, unviewed candidates */}
                            {!c.seen && c.status === 'applied' && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full ring-1 ring-blue-200">
                                New
                              </span>
                            )}
                            {(c.hfRelevanceSkipped > 0 || (c.cheatEventCount && c.cheatEventCount > 0)) && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full ring-1 ring-red-200">
                                <XCircle className="w-2.5 h-2.5" /> Violation
                              </span>
                            )}
                            {c.experienceLevel && (
                              <span className="text-[9px] text-gray-400 font-semibold capitalize bg-gray-50 px-1.5 py-0.5 rounded-full">
                                {c.experienceLevel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4 text-sm text-gray-600 font-medium">
                      {c.jobTitle}
                    </td>

                    {/* Score */}
                    <td className="px-5 py-4">
                      <ScoreBadge score={c.score} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm ${getCandidateStatusClasses(c.status)}`}
                      >
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-5 py-4 rounded-r-xl text-right">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ml-auto transition-all duration-200
                        ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        <ChevronRight className="w-4 h-4" aria-hidden />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

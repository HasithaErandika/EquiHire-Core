import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, XCircle, ChevronRight } from 'lucide-react';
import type { ExtendedCandidate } from '@/types';

interface CandidatePipelineProps {
  candidates: ExtendedCandidate[];
  onSelectCandidate: (candidate: ExtendedCandidate) => void;
  selectedId: string | null;
}

const STAGES = [
  { id: 'pending', label: 'Applied', color: 'bg-blue-500' },
  { id: 'accepted', label: 'Accepted', color: 'bg-green-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export function CandidatePipeline({ candidates, onSelectCandidate, selectedId }: CandidatePipelineProps) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4 scrollbar-hide">
      {STAGES.map((stage) => {
        const stageCandidates = candidates.filter((c) => {
          if (stage.id === 'pending') {
            return ['pending', 'applied', 'scheduled', 'screening'].includes(c.status);
          }
          if (stage.id === 'accepted') {
            return c.status === 'accepted' || c.status === 'shortlisted';
          }
          if (stage.id === 'rejected') {
            return c.status === 'rejected';
          }
          return false;
        });

        return (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{stage.label}</h3>
                <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600 font-bold text-[10px]">
                  {stageCandidates.length}
                </Badge>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 p-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 min-h-[500px]">
              {stageCandidates.map((candidate) => (
                <div
                  key={candidate.candidateId}
                  onClick={() => onSelectCandidate(candidate)}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md animate-in fade-in slide-in-from-bottom-2
                    ${selectedId === candidate.candidateId
                      ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                          ${candidate.status === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {candidate.status === 'accepted' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold truncate max-w-[140px] 
                            ${candidate.status === 'accepted' ? 'text-gray-900 font-sans' : 'text-gray-500 font-mono text-[11px]'}`}>
                            {candidate.candidateName}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">#{candidate.candidateId.split('-')[0]}</span>
                        </div>
                      </div>
                      {candidate.score > 0 && (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-gray-900">{candidate.score}%</span>
                          <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${candidate.score >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
                              style={{ width: `${candidate.score}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {candidate.hfRelevanceSkipped > 0 && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                          <XCircle className="w-3 h-3" /> Violations
                        </div>
                      )}
                      {candidate.detectedStack && candidate.detectedStack.slice(0, 2).map((tech) => (
                        <span key={tech} className="text-[9px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-medium">
                      <span>{candidate.jobTitle}</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
              {stageCandidates.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic text-xs text-gray-400">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

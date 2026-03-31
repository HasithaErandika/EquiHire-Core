import { useEffect, useState } from 'react';
import { getTranscript } from '@/lib/api';
import type { TranscriptResponse, TranscriptItem } from '@/types';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TranscriptModalProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TranscriptModal({ candidateId, isOpen, onClose }: TranscriptModalProps) {
  const [data, setData] = useState<TranscriptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !candidateId) return;
    
    setLoading(true);
    let isMounted = true;

    const fetchTranscript = async () => {
      try {
        const result = await getTranscript(candidateId);
        if (isMounted) setData(result);
      } catch (err) {
        console.error('Failed to fetch transcript:', err);
        if (isMounted) setError('Failed to load transcript. Please ensure the candidate has completed the interview.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTranscript();

    return () => { isMounted = false; };
  }, [candidateId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-[#F8F9FA] gap-0">
        <DialogHeader className="p-4 bg-white border-b border-gray-200 flex-none sticky top-0 z-10">
          <div className="flex justify-between items-center px-4 w-full">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <span>{data?.candidateName || 'Candidate'}</span>
              </DialogTitle>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                Interview Transcript
              </Badge>
            </div>
            
            {/* The default close button is hidden by styling or we can just let Radix handle it. Adding a neat Print button */}
            <div className="flex items-center gap-3 pr-6">
               <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print
                </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto w-full p-6">
          {loading && <LoadingScreen message="Loading Transcript..." />}
          
          {error && !loading && (
            <div className="flex flex-col items-center justify-center p-12 h-full">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Transcript</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          )}

          {!loading && !error && data && (
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Full Assessment</h2>
                    <p className="text-gray-500 mt-1 text-sm">Detailed breakdown of answers and AI evaluations.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Reference ID</p>
                    <p className="font-mono text-xs text-gray-600 font-medium">{data.candidateId.split('-')[0]}</p>
                  </div>
                </div>
                
                {data.transcript.map((item, idx) => (
                  <TranscriptCard key={idx} item={item} index={idx + 1} />
                ))}

                {data.transcript.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No interview data found for this candidate.</p>
                  </div>
                )}
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TranscriptCard({ item, index }: { item: TranscriptItem; index: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-xl mb-6">
      <div className={`h-1 cursor-default ${getScoreColor(item.score)}`} />
      <CardHeader className="bg-white pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex space-x-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-500 font-bold text-sm border border-gray-100 flex-shrink-0">
              {index}
            </div>
            <div>
              <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-gray-400 mb-1">
                {item.questionType} Question
              </CardDescription>
              <CardTitle className="text-base font-semibold text-gray-900 leading-snug">
                {item.questionText}
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-baseline space-x-1 border border-gray-100 bg-gray-50 px-3 py-1.5 rounded-lg">
              <span className="text-2xl font-black text-gray-900">{item.score}</span>
              <span className="text-xs text-gray-400 font-bold">/ 10</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2 bg-white pb-6">
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Candidate's Answer</h4>
            {item.wasFlagged && (
              <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                <AlertTriangle className="h-2 w-2 mr-1" /> Flagged
              </Badge>
            )}
            {!item.hfGatePassed && (
              <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-orange-600 border-orange-200 bg-orange-50">
                Low Relevance
              </Badge>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100/50 text-gray-700 leading-relaxed whitespace-pre-wrap text-sm font-medium">
            {item.redactedAnswer}
          </div>
        </section>

        <section>
          <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 border-t border-gray-100/60 pt-6">AI Evaluation</h4>
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-blue-900 text-sm leading-relaxed italic">
            "{item.feedback}"
          </div>
        </section>

        {item.sampleAnswer && (
          <section>
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 border-t border-gray-100/60 pt-6">Expected Answer</h4>
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-emerald-800 text-sm leading-relaxed">
              {item.sampleAnswer}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

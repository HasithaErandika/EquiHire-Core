import { useEffect, useState } from 'react';
import { getTranscript } from '@/lib/api';
import type { TranscriptItem } from '@/types';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, AlertTriangle, User, Mail, Briefcase, Calendar, Star, CheckCircle2,
  ShieldCheck, XCircle,
} from 'lucide-react';
import { EquiHireLogo } from '@/components/ui/Icons';

// ─── URL-param helpers ─────────────────────────────────────────────────────────

function getParam(params: URLSearchParams, key: string, fallback = '') {
  return params.get(key) ?? fallback;
}
function getNumParam(params: URLSearchParams, key: string) {
  const v = params.get(key);
  if (v === null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CandidateTranscript() {
  const urlParams = new URLSearchParams(window.location.search);

  // All of these may be passed via URL from the detail panel
  const candidateId    = getParam(urlParams, 'candidateId');
  const candidateName  = getParam(urlParams, 'candidateName');
  const candidateEmail = getParam(urlParams, 'candidateEmail');
  const jobTitle       = getParam(urlParams, 'jobTitle');
  const appliedDate    = getParam(urlParams, 'appliedDate');
  const feedback       = getParam(urlParams, 'summaryFeedback');

  const urlOverall   = getNumParam(urlParams, 'overallScore');
  const urlCv        = getNumParam(urlParams, 'cvScore');
  const urlSkills    = getNumParam(urlParams, 'skillsScore');
  const urlInterview = getNumParam(urlParams, 'interviewScore');

  // Scores from URL (guaranteed correct because they came from the candidate panel)
  const overallScore   = urlOverall   ?? 0;
  const cvScore        = urlCv        ?? 0;
  const skillsScore    = urlSkills    ?? 0;
  const interviewScore = urlInterview ?? 0;

  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  // Derive initial states from the URL param — avoids calling setState inside the effect body.
  const [loading, setLoading] = useState(!!candidateId);
  const [error]               = useState<string | null>(
    candidateId ? null : 'No candidate ID provided.',
  );

  useEffect(() => {
    if (!candidateId) return; // error already set in initial state

    getTranscript(candidateId)
      .then(result => {
        setTranscriptItems(result.transcript ?? []);
      })
      .catch(err => {
        console.error('Failed to fetch transcript items:', err);
        // Non-fatal: we can still show candidate info & scores from URL
      })
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return <LoadingScreen message="Loading Transcript..." />;

  if (!candidateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Transcript</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => window.close()}>Close Window</Button>
      </div>
    );
  }

  const displayName  = candidateName || `Candidate #${candidateId.substring(0, 8)}`;
  const appliedLabel = appliedDate && appliedDate !== '()'
    ? (() => { const d = new Date(appliedDate); return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(); })()
    : 'N/A';

  const gradeColor = overallScore >= 70 ? 'from-gray-900 to-gray-700' : 'from-red-700 to-red-500';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1D] font-sans pb-20">
      {/* ─── Top Bar ─── */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-4">
          <EquiHireLogo className="h-8 w-auto text-primary" />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{displayName}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Interview Transcript
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-gray-500 hover:bg-gray-50">
            Print
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">

        {/* ─── Candidate Profile Card ─── */}
        <div className="mb-10 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-gray-900">{displayName}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500">
                  {jobTitle && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm font-medium">{jobTitle}</span>
                    </div>
                  )}
                  {candidateEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">{candidateEmail}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gray-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  ID: {candidateId.substring(0, 12)}
                </Badge>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" /> Applied: {appliedLabel}
                </div>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="flex flex-col items-center">
              <div className={`bg-gradient-to-br ${gradeColor} p-5 rounded-2xl text-white text-center min-w-[130px] shadow-lg`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Overall AI Match</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black">{Math.round(overallScore)}</span>
                  <span className="text-sm font-bold opacity-50">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown — matches candidate detail page exactly */}
          <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-3 gap-6">
            {[
              { label: 'CV / Resume',         value: cvScore,        color: 'bg-blue-500' },
              { label: 'Required Skills',     value: skillsScore,    color: 'bg-teal-500' },
              { label: 'Technical Interview', value: interviewScore,  color: 'bg-orange-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 tabular-nums">{Math.round(value)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── AI Evaluation Feedback ─── */}
        {feedback && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">AI Evaluation Feedback</h2>
            </div>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                      Decision Rationale &amp; Feedback
                    </h3>
                    <p className="text-gray-700 leading-relaxed italic text-base">
                      {feedback}
                    </p>
                    {overallScore > 0 && (
                      <div className="not-italic mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Official Score:</span>
                        <span className="font-bold text-gray-900">{Math.round(overallScore)}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ─── Question‑by‑Question Breakdown ─── */}
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Question Breakdown</h2>
          {transcriptItems.length > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg ml-2">
              {transcriptItems.length} ITEMS
            </span>
          )}
        </div>

        <div className="space-y-8">
          {transcriptItems.map((item, idx) => (
            <TranscriptCard key={idx} item={item} index={idx + 1} />
          ))}
          {transcriptItems.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No detailed interview data found for this candidate.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Transcript Question Card ──────────────────────────────────────────────────

function TranscriptCard({ item, index }: { item: TranscriptItem; index: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`h-1.5 ${getScoreColor(item.score)}`} />
      <CardHeader className="bg-white pb-4">
        <div className="flex items-start justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-500 font-bold text-sm border border-gray-100 flex-shrink-0">
              {index}
            </div>
            <div>
              <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-gray-400 mb-1">
                {item.questionType} Question
              </CardDescription>
              <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                {item.questionText}
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 ml-4">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">{item.score}</span>
              <span className="text-sm text-gray-400">/ 10</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">AI Grade</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {/* Flags */}
        {(item.wasFlagged || !item.hfGatePassed) && (
          <div className="flex gap-2 flex-wrap">
            {item.wasFlagged && (
              <Badge variant="destructive" className="px-2 py-0.5 text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" /> Flagged
              </Badge>
            )}
            {!item.hfGatePassed && (
              <Badge variant="outline" className="px-2 py-0.5 text-[10px] text-orange-600 border-orange-200 bg-orange-50">
                Low Relevance
              </Badge>
            )}
          </div>
        )}

        {/* Candidate answer */}
        <section>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Candidate's Answer</h4>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 leading-relaxed whitespace-pre-wrap text-sm italic">
            "{item.redactedAnswer}"
          </div>
        </section>

        {/* AI feedback */}
        <section>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> AI Evaluation &amp; Feedback
          </h4>
          <div className="p-4 bg-primary/[0.03] rounded-lg border border-primary/10 text-gray-800 text-sm leading-relaxed">
            {item.feedback}
          </div>
        </section>

        {/* Sample answer */}
        {item.sampleAnswer && (
          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-green-500" /> Expected / Sample Answer
            </h4>
            <div className="p-4 bg-green-50/30 rounded-lg border border-green-100/50 text-gray-600 text-sm leading-relaxed">
              {item.sampleAnswer}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

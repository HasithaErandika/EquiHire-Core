/**
 * @fileoverview TranscriptModal — Full-screen modal overlay showing candidate
 * transcript, PII details, scores, and question-by-question breakdown.
 * Replaces the old window.open('/transcript') new-tab behaviour.
 */

import { useEffect, useState } from 'react';
import { getTranscript } from '@/lib/api';
import type { TranscriptItem, TranscriptResponse } from '@/types';
import type { ExtendedCandidate } from '@/types';
import {
  X, FileText, Star, AlertTriangle, User, Mail, Briefcase,
  Calendar, CheckCircle2, ShieldCheck, XCircle, Loader2, Printer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TranscriptModalProps {
  candidate: ExtendedCandidate;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export function TranscriptModal({ candidate, onClose }: TranscriptModalProps) {
  const [transcriptData, setTranscriptData] = useState<TranscriptResponse | null>(null);
  // If there is no candidateId we know immediately — skip the loading state.
  const [loading, setLoading] = useState(!!candidate.candidateId);
  const [error, setError] = useState<string | null>(
    candidate.candidateId ? null : 'No candidate ID',
  );

  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Fetch transcript
  useEffect(() => {
    if (!candidate.candidateId) return; // error already set in initial state
    getTranscript(candidate.candidateId)
      .then(data => setTranscriptData(data))
      .catch(err => { console.error('Transcript fetch failed', err); setError('Failed to load transcript.'); })
      .finally(() => setLoading(false));
  }, [candidate.candidateId]);

  // Score helpers
  const overallScore   = candidate.score        ?? 0;
  const cvScore        = candidate.cvScore       ?? 0;
  const skillsScore    = candidate.skillsScore   ?? 0;
  const interviewScore = candidate.interviewScore ?? 0;
  const feedback       = candidate.summaryFeedback ?? '';

  // Metadata: Prefer data from transcript API (which is robust) over prop candidate (which might be partial)
  const candidateEmail = transcriptData?.candidateEmail || '';
  const displayName    = transcriptData?.candidateName || candidate.candidateName || `Candidate #${candidate.candidateId.substring(0, 8)}`;
  const jobTitle       = transcriptData?.jobTitle || candidate.jobTitle || 'Unknown Role';
  const appliedRaw     = transcriptData?.appliedDate || candidate.appliedDate;
  const appliedLabel   = appliedRaw
    ? (() => { const d = new Date(appliedRaw); return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(); })()
    : 'N/A';

  const education = transcriptData?.education || candidate.education;
  const workExperience = transcriptData?.workExperience || candidate.workExperience;
  const projects = transcriptData?.projects || candidate.projects;
  const technicalSkills = transcriptData?.technicalSkills || candidate.detectedStack;
  const achievements = transcriptData?.achievements;
  const certificates = transcriptData?.certificates;
  const phone = transcriptData?.phone || '';

  const gradeColor = overallScore >= 70 ? 'from-gray-900 to-gray-700' : 'from-red-700 to-red-500';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Candidate Transcript"
    >
      {/* Modal Panel */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#F8F9FA] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* ── Sticky Header ── */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-none">{displayName}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Interview Transcript</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 hidden sm:flex">
              Interview Transcript
            </Badge>
            <Button
              variant="ghost" size="sm"
              className="text-gray-500 hover:bg-gray-50 gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="Close transcript"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-gray-500 text-sm font-medium">Loading transcript…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <AlertTriangle className="w-10 h-10 text-red-400" />
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <main className="max-w-3xl mx-auto py-10 px-6 pb-16">

              {/* ── Candidate Profile Card ── */}
              <div className="mb-10 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl font-black tracking-tight text-gray-900">{displayName}</h1>
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
                        ID: {candidate.candidateId.substring(0, 12)}
                      </Badge>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" /> Applied: {appliedLabel}
                      </div>
                      {candidateEmail && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-green-100 bg-green-50 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                          <User className="w-3 h-3" /> PII Revealed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Overall Score Badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`bg-gradient-to-br ${gradeColor} p-5 rounded-2xl text-white text-center min-w-[120px] shadow-lg`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Overall AI Match</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black">{Math.round(overallScore)}</span>
                        <span className="text-sm font-bold opacity-50">/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
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

              {/* ── PII / Identity Details (accepted only) ── */}
              {(education || workExperience || projects || technicalSkills || achievements || certificates || candidateEmail || phone) && (
                <section className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Candidate PII & Details</h2>
                    <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 text-[10px] font-bold rounded-lg ml-1 uppercase tracking-wider">Revealed</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                    {candidateEmail && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Email Address</p>
                        <p className="text-sm font-semibold text-gray-800">{candidateEmail}</p>
                      </div>
                    )}
                    {phone && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Phone Number</p>
                        <p className="text-sm font-semibold text-gray-800">{phone}</p>
                      </div>
                    )}
                    {candidate.experienceLevel && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Experience Level</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{candidate.experienceLevel}</p>
                      </div>
                    )}
                    {technicalSkills && technicalSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Detected Tech Stack & Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(technicalSkills) ? technicalSkills : [technicalSkills]).map((tech: string, i: number) => (
                            <span key={`${tech}-${i}`} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md font-medium">{String(tech)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {education && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Education</p>
                        <div className="text-sm text-gray-700 pl-3 border-l-2 border-gray-100">
                          {Array.isArray(education)
                            ? education.map((edu: Record<string, string>, i: number) => (
                                <div key={i} className="mb-2">
                                  <p className="font-semibold">{typeof edu === 'string' ? edu : edu.degree || edu.institution || edu.school}</p>
                                  {typeof edu === 'object' && (edu.field || edu.major || edu.duration || edu.year) && (
                                    <p className="text-[11px] text-gray-500">{[edu.field || edu.major, edu.duration || edu.year].filter(Boolean).join(' • ')}</p>
                                  )}
                                </div>
                              ))
                            : <p className="whitespace-pre-wrap">{String(education)}</p>
                          }
                        </div>
                      </div>
                    )}
                    {workExperience && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Work Experience</p>
                        <div className="text-sm text-gray-700 pl-3 border-l-2 border-gray-100">
                          {Array.isArray(workExperience)
                            ? workExperience.map((job: Record<string, string>, i: number) => (
                                <div key={i} className="mb-2">
                                  <p className="font-semibold">{typeof job === 'string' ? job : job.title || job.position || job.role}</p>
                                  {typeof job === 'object' && (job.company || job.organization || job.duration || job.period) && (
                                    <p className="text-[11px] text-gray-500">{[job.company || job.organization, job.duration || job.period].filter(Boolean).join(' • ')}</p>
                                  )}
                                  {typeof job === 'object' && job.responsibilities && (
                                    <p className="text-[11px] text-gray-600 mt-1 italic">{String(job.responsibilities)}</p>
                                  )}
                                </div>
                              ))
                            : <p className="whitespace-pre-wrap">{String(workExperience)}</p>
                          }
                        </div>
                      </div>
                    )}
                    {projects && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Projects</p>
                        <div className="text-sm text-gray-700 pl-3 border-l-2 border-gray-100">
                          {Array.isArray(projects)
                            ? projects.map((p: Record<string, string>, i: number) => (
                                <div key={i} className="mb-2">
                                  <p className="font-semibold">{typeof p === 'string' ? p : p.name || p.title}</p>
                                  {typeof p === 'object' && p.description && (
                                    <p className="text-[11px] text-gray-500">{p.description}</p>
                                  )}
                                </div>
                              ))
                            : <p className="whitespace-pre-wrap">{String(projects)}</p>
                          }
                        </div>
                      </div>
                    )}
                    {achievements && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Achievements</p>
                        <div className="text-sm text-gray-700 pl-3 border-l-2 border-gray-100">
                          {Array.isArray(achievements)
                            ? achievements.map((a: Record<string, string>, i: number) => (
                                <div key={i} className="mb-2">
                                  <p className="font-semibold">{typeof a === 'string' ? a : a.title || a.name}</p>
                                  {typeof a === 'object' && (a.issuer || a.year) && (
                                    <p className="text-[11px] text-gray-500">{[a.issuer, a.year].filter(Boolean).join(' • ')}</p>
                                  )}
                                </div>
                              ))
                            : <p className="whitespace-pre-wrap">{String(achievements)}</p>
                          }
                        </div>
                      </div>
                    )}
                    {certificates && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Certificates</p>
                        <div className="text-sm text-gray-700 pl-3 border-l-2 border-gray-100">
                          {Array.isArray(certificates)
                            ? certificates.map((c: Record<string, string>, i: number) => (
                                <div key={i} className="mb-2">
                                  <p className="font-semibold">{typeof c === 'string' ? c : c.title || c.name}</p>
                                  {typeof c === 'object' && (c.issuer || c.year) && (
                                    <p className="text-[11px] text-gray-500">{[c.issuer, c.year].filter(Boolean).join(' • ')}</p>
                                  )}
                                </div>
                              ))
                            : <p className="whitespace-pre-wrap">{String(certificates)}</p>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── AI Evaluation Feedback ── */}
              {feedback && (
                <section className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI Evaluation Feedback</h2>
                  </div>
                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Decision Rationale & Feedback</h3>
                          <p className="text-gray-700 leading-relaxed italic text-sm">{feedback}</p>
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

              {/* ── Question-by-Question Breakdown ── */}
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Question Breakdown</h2>
                {(transcriptData?.transcript?.length ?? 0) > 0 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg ml-1">
                    {transcriptData!.transcript.length} ITEMS
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {(transcriptData?.transcript ?? []).map((item, idx) => (
                  <TranscriptCard key={idx} item={item} index={idx + 1} />
                ))}
                {(transcriptData?.transcript?.length ?? 0) === 0 && (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No detailed interview data found for this candidate.</p>
                  </div>
                )}
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transcript Question Card (same as the standalone page)
// ---------------------------------------------------------------------------

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
              <CardTitle className="text-base font-semibold text-gray-900 leading-tight">
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
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> AI Evaluation & Feedback
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

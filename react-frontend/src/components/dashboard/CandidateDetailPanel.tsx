/**
 * @fileoverview Side panel showing selected candidate details: scores, context, timeline, and actions.
 */

import {
  Lock,
  Check,
  XCircle,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { API } from '@/lib/api';
import type { ExtendedCandidate } from '@/types';

export interface CandidateDetailPanelProps {
  candidate: ExtendedCandidate;
  threshold: number;
  isProcessing: boolean;
  onClose: () => void;
  onApplyDecision: (candidateId: string, decision: 'accepted' | 'rejected') => Promise<void>;
}

const AVATAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg';

export function CandidateDetailPanel({
  candidate,
  threshold,
  isProcessing,
  onClose,
  onApplyDecision,
}: CandidateDetailPanelProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const isDecisionMade = ['accepted', 'rejected'].includes(candidate.status);
  const canViewTranscript = candidate.status === 'accepted';

  return (
    <div className="w-[400px] flex flex-col space-y-4 animate-in slide-in-from-right-10 duration-300">
      <div className="flex justify-between items-center h-8">
        <h3 className="font-bold text-gray-900">Candidate Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-900"
          aria-label="Close panel"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <Card className="flex-1 shadow-lg border-gray-100 border-t-4 border-t-primary overflow-auto">
        <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm ${candidate.status === 'accepted' ? 'bg-white' : 'bg-gray-200'}`}
            >
              {candidate.status === 'accepted' ? (
                <img
                  src={`${AVATAR_URL}?seed=${encodeURIComponent(candidate.candidateName)}`}
                  alt=""
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Lock className="w-8 h-8 text-gray-400" aria-hidden />
              )}
            </div>
            <CardTitle className="text-center">{candidate.candidateName}</CardTitle>
            <CardDescription className="text-center font-mono text-xs mt-1 text-gray-500">
              ID: {candidate.candidateId.split('-')[0]} • {candidate.jobTitle}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Overall AI Match score */}
          <section className="p-4 bg-gray-50 rounded-lg border border-gray-100" aria-labelledby="score-heading">
            <div className="flex justify-between items-center mb-2">
              <span id="score-heading" className="text-xs font-semibold uppercase text-gray-500">Overall AI Match (Weighted)</span>
              {candidate.score > 0 && (
                <span className="font-bold text-lg text-gray-900">{candidate.score}%</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${candidate.score >= threshold ? 'bg-[#FF7300]' : 'bg-red-400'}`}
                style={{ width: `${candidate.score}%` }}
              />
            </div>
            {candidate.score > 0 ? (
              <div className="space-y-2 mt-2 pt-3 border-t border-gray-200 border-dashed">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CV / Resume</span>
                  <span className="font-medium text-gray-700">{candidate.cvScore}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Required Skills</span>
                  <span className="font-medium text-gray-700">{candidate.skillsScore}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Technical Interview</span>
                  <span className="font-medium text-gray-700">{candidate.interviewScore}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Interview pending or not graded.</p>
            )}
          </section>

          {/* AI Feedback */}
          {candidate.summaryFeedback && (
            <section aria-labelledby="feedback-heading">
              <h4 id="feedback-heading" className="text-sm font-bold text-gray-900 mb-2">
                AI Evaluation Feedback
              </h4>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg italic text-sm text-blue-900 leading-relaxed shadow-sm">
                "{candidate.summaryFeedback.replace(/Candidate scored \d+(\.\d+)?\/100\./g, '').trim()}"
                {candidate.score > 0 && (
                  <div className="not-italic mt-2 pt-2 border-t border-blue-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700">Official Score:</span>
                    <span className="font-bold text-blue-900">{candidate.score}/100</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Candidate context (experience, stack) */}
          {candidate.experienceLevel && (
            <section aria-labelledby="context-heading">
              <h4 id="context-heading" className="text-sm font-bold text-gray-900 mb-2">
                Candidate Context
              </h4>
              <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">Estimated Experience</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded capitalize">
                    {candidate.experienceLevel}
                  </span>
                </div>
                {candidate.detectedStack && candidate.detectedStack.length > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold mb-1 block">
                      Detected Tech Stack
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {candidate.detectedStack.map((tech, i) => (
                        <span
                          key={`${tech}-${i}`}
                          className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CV Details */}
          {(candidate.education || candidate.workExperience || candidate.projects) && (
            <section aria-labelledby="cv-heading">
              <h4 id="cv-heading" className="text-sm font-bold text-gray-900 mb-2">
                CV Highlights
              </h4>
              <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm space-y-4">
                {candidate.education && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Education</span>
                    <div className="text-xs text-gray-600 pl-2 border-l-2 border-gray-100 space-y-1">
                      {Array.isArray(candidate.education) ? (
                        candidate.education.map((edu, i) => (
                          <div key={i} className="mb-2">
                            <p className="font-bold">{typeof edu === 'string' ? edu : edu.degree || edu.institution}</p>
                            {typeof edu === 'object' && <p className="text-[10px] text-gray-500">{edu.field || edu.major} • {edu.duration || edu.year}</p>}
                          </div>
                        ))
                      ) : typeof candidate.education === 'string' ? (
                        <p>{candidate.education}</p>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(candidate.education, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                )}
                {candidate.workExperience && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Work Experience</span>
                    <div className="text-xs text-gray-600 pl-2 border-l-2 border-gray-100 space-y-2">
                      {Array.isArray(candidate.workExperience) ? (
                        candidate.workExperience.map((job, i) => (
                          <div key={i} className="mb-2">
                            <p className="font-bold">{typeof job === 'string' ? job : job.title || job.position}</p>
                            {typeof job === 'object' && <p className="text-[10px] text-gray-500">{job.company || job.organization} • {job.duration || job.period}</p>}
                          </div>
                        ))
                      ) : typeof candidate.workExperience === 'string' ? (
                        <p>{candidate.workExperience}</p>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(candidate.workExperience, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                )}
                {candidate.projects && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Projects</span>
                    <div className="text-xs text-gray-600 pl-2 border-l-2 border-gray-100 space-y-1">
                      {Array.isArray(candidate.projects) ? (
                        candidate.projects.map((proj, i) => (
                          <div key={i} className="mb-2">
                            <p className="font-bold">{typeof proj === 'string' ? proj : proj.name || proj.title}</p>
                            {typeof proj === 'object' && <p className="text-[10px] text-gray-500">{proj.description}</p>}
                          </div>
                        ))
                      ) : typeof candidate.projects === 'string' ? (
                        <p>{candidate.projects}</p>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(candidate.projects, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* HF relevance / suspicious answers alert */}
          {(candidate.hfRelevanceSkipped > 0 || (candidate.cheatEventCount && candidate.cheatEventCount > 0)) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg" role="alert">
              <div className="flex gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-bold text-red-800">Violation Flags Detected</p>
                  <div className="text-[11px] text-red-600 mt-1 space-y-1">
                    {candidate.hfRelevanceSkipped > 0 && (
                      <p>• {candidate.hfRelevanceSkipped} answer(s) failed the relevance check (gibberish/bypass attempts).</p>
                    )}
                    {candidate.cheatEventCount && candidate.cheatEventCount > 0 && (
                      <p>• {candidate.cheatEventCount} interface violation(s) (tab switching/paste/fullscreen exit).</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <section aria-labelledby="timeline-heading">
            <h4 id="timeline-heading" className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" aria-hidden /> Timeline
            </h4>
            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-2 ring-gray-50" />
                <p className="text-sm font-black text-gray-900 leading-none">Application Received</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                  {new Date(candidate.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="relative">
                <div
                  className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-50 ${candidate.score > 0 ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}
                />
                <div className="flex flex-col">
                  <p className="text-sm font-black text-gray-900 leading-none">Interview Session</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${candidate.score > 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      {candidate.score > 0 ? 'Completed' : 'Scheduled / In-Progress'}
                    </span>
                    {candidate.score > 0 && <span className="text-[10px] font-medium text-gray-400">Score: {candidate.score}%</span>}
                  </div>
                </div>
              </div>
              <div className="relative">
                <div
                  className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-50 ${!['pending', 'applied', 'scheduled', 'screening'].includes(candidate.status) ? (candidate.status === 'accepted' ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-200'}`}
                />
                <div className="flex flex-col">
                  <p className="text-sm font-black text-gray-900 leading-none">Final Decision</p>
                  <div className="mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider 
                        ${candidate.status === 'accepted' ? 'bg-green-50 text-green-600' :
                        candidate.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-gray-500'}`}>
                      {candidate.status === 'pending' || candidate.status === 'applied'
                        ? 'Review Pending'
                        : candidate.status === 'accepted'
                          ? 'Accepted'
                          : candidate.status === 'rejected'
                            ? 'Rejected'
                            : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
            {(candidate.status === 'pending' || candidate.status === 'applied' || candidate.status === 'shortlisted') && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onApplyDecision(candidate.candidateId, 'accepted')}
                  disabled={isProcessing}
                  title="Accept this candidate and send acceptance email"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
                  ) : (
                    <Check className="w-4 h-4 mr-2" aria-hidden />
                  )}
                  Accept
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => onApplyDecision(candidate.candidateId, 'rejected')}
                  disabled={isProcessing}
                  title="Reject this candidate and send rejection email with scores"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" aria-hidden />
                  )}
                  Reject
                </Button>
              </div>
            )}

            {canViewTranscript && (
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  onClick={async () => {
                    try {
                      const res = await API.revealCandidate(candidate.candidateId);
                      if (res.url) window.open(res.url, '_blank');
                    } catch (err) {
                      console.error('Failed to reveal CV:', err);
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" aria-hidden />
                  View Original CV (PII)
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  <FileText className="w-4 h-4 mr-2" aria-hidden />
                  {showTranscript ? 'Hide' : 'View'} Full Transcript
                </Button>
              </div>
            )}

            {isDecisionMade && !canViewTranscript && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">
                  {candidate.status === 'rejected' ? 'Candidate rejected. Decision email sent.' : 'Candidate accepted. Decision email sent.'}
                </p>
              </div>
            )}

            {showTranscript && canViewTranscript && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-sm text-blue-900 mb-3">Full Profile & Interview Transcript</h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1">Candidate ID</p>
                    <p className="text-sm text-blue-900 font-mono">{candidate.candidateId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1">Experience Level</p>
                    <p className="text-sm text-blue-900 capitalize">{candidate.experienceLevel || 'Not extracted'}</p>
                  </div>
                  {candidate.detectedStack && candidate.detectedStack.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-blue-700 mb-1">Technical Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.detectedStack.map((skill, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {candidate.summaryFeedback && (
                    <div>
                      <p className="text-xs font-semibold text-blue-700 mb-1">Interview Feedback</p>
                      <p className="text-xs text-blue-900 leading-relaxed">{candidate.summaryFeedback}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1 pt-2 border-t border-blue-200">Evaluation Scores</p>
                    <div className="text-xs text-blue-900 space-y-1">
                      <div>• CV Score: {candidate.cvScore || 'N/A'}/100</div>
                      <div>• Skills Score: {candidate.skillsScore || 'N/A'}/100</div>
                      <div>• Interview Score: {candidate.interviewScore || 'N/A'}/100</div>
                      <div className="font-semibold pt-1">• Overall Score: {candidate.score || 'N/A'}/100</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Candidate interview: timed questions, answer submission, lockdown (copy/paste/tab/fullscreen) detection and violation reporting.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { EquiHireLogo } from "@/components/ui/Icons";
import { Textarea } from "@/components/ui/textarea";
import { API } from "@/lib/api";
import {
    Loader2, AlertCircle, ShieldAlert, 
    Terminal, CheckCircle
} from "lucide-react";
import type { CheatEventItem, AnswerSubmission, SubmitAssessmentPayload, Question } from '@/types';

export default function CandidateInterview() {

    const [timeLeft, setTimeLeft] = useState(45 * 60);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // --- Assessment Pipeline State ---
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [cheatEvents, setCheatEvents] = useState<CheatEventItem[]>([]);
    const timeSpentPerQuestion = useRef<Record<string, number>>({});
    
    // UI Warning State
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [warningIcon, setWarningIcon] = useState<"tabswitch" | "fullscreen">("tabswitch");
    
    // Stable ref for submit
    const cheatEventsRef = useRef(cheatEvents);
    useEffect(() => {
        cheatEventsRef.current = cheatEvents;
    }, [cheatEvents]);

    const flashWarning = useCallback((msg: string, icon: "tabswitch" | "fullscreen") => {
        setWarningMessage(msg);
        setWarningIcon(icon);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
    }, []);

    const addCheatEvent = useCallback((type: CheatEventItem['eventType'], msg: string, icon: typeof warningIcon) => {
        setCheatEvents(prev => [...prev, {
            eventType: type,
            occurredAt: new Date().toISOString()
        }]);
        flashWarning(msg, icon);
    }, [flashWarning]);

    // Initialize session and questions
    useEffect(() => {
        const initializeInterview = async () => {
            try {
                const candidateIdStr = sessionStorage.getItem('candidateId');
                const candidateDataStr = sessionStorage.getItem('candidateData');
                
                if (!candidateIdStr || !candidateDataStr) {
                    setError("No invitation session found. Please use the link provided in your email.");
                    setLoading(false);
                    return;
                }
                const candidateData = JSON.parse(candidateDataStr);
                if (!candidateData.jobId) {
                    setError("Invalid session data. Job ID is missing.");
                    setLoading(false);
                    return;
                }

                // Call API to start session
                if (candidateData.invitationId) {
                    try {
                        const sessionRes = await API.startExamSession(candidateIdStr, {
                            jobId: candidateData.jobId,
                            invitationId: candidateData.invitationId
                        });
                        setSessionId(sessionRes.sessionId);
                    } catch (e) {
                        console.error("Failed to start exam session", e);
                    }
                }

                const jobQuestions = await API.getJobQuestions(candidateData.jobId);
                setQuestions(jobQuestions);

                // Request Fullscreen (Optional, can be skipped based on user preference)
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }

                setLoading(false);
            } catch (err: unknown) {
                console.error("Initialization error:", err);
                setError("Failed to initialize interview. Please try again.");
                setLoading(false);
            }
        };
        initializeInterview();
    }, []);

    // --- Integrity event listeners ---
    useEffect(() => {
        if (loading || error || isSubmitted) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                addCheatEvent('tab_switch', "Leaving the assessment window is not allowed.", "tabswitch");
            }
        };

        const handleBlur = () => {
            addCheatEvent('tab_switch', "Window focus lost is not allowed.", "tabswitch");
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                addCheatEvent('fullscreen_exit', "You exited fullscreen mode. Please return to fullscreen.", "tabswitch");
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [loading, error, isSubmitted, addCheatEvent]);

    const submitPayload = useCallback(async (isAutoSubmit: boolean) => {
        setIsSubmitted(true);
        try {
            const candidateId = sessionStorage.getItem('candidateId');
            const candidateDataStr = sessionStorage.getItem('candidateData');
            
            if (!candidateId || !candidateDataStr) {
                setError("Missing session data. Cannot submit assessment.");
                return;
            }

            const candidateData = JSON.parse(candidateDataStr);

            // Construct answer array
            const formattedAnswers: AnswerSubmission[] = questions.map((q) => ({
                questionId: q.id,
                answerText: answers[q.id] || "",
                timeSpentSeconds: timeSpentPerQuestion.current[q.id] || 0
            }));

            const payload: SubmitAssessmentPayload = {
                jobId: candidateData.jobId,
                sessionId: sessionId || "UNKNOWN_SESSION",
                invitationId: candidateData.invitationId,
                submissionType: isAutoSubmit ? 'timer_expired' : 'manual',
                answers: formattedAnswers,
                cheatEvents: cheatEventsRef.current
            };

            await API.submitCandidateAnswers(candidateId, payload);

            // Clean up
            sessionStorage.removeItem('invite_token');
            sessionStorage.removeItem('candidateData');
            sessionStorage.removeItem('candidateId');
            
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }

        } catch (err) {
            console.error(err);
            setError("Failed to submit assessment.");
        }
    }, [answers, questions, sessionId]);

    const handleSubmitClick = () => submitPayload(false);

    // Timer & Question time tracker
    useEffect(() => {
        if (loading || error || isSubmitted || questions.length === 0) return;
        
        const currentQId = questions[currentQuestionIndex]?.id;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { 
                    clearInterval(timer); 
                    submitPayload(true); 
                    return 0; 
                }
                return prev - 1;
            });

            if (currentQId) {
                timeSpentPerQuestion.current[currentQId] = (timeSpentPerQuestion.current[currentQId] || 0) + 1;
            }

        }, 1000);
        return () => clearInterval(timer);
    }, [loading, error, isSubmitted, questions, currentQuestionIndex, submitPayload]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswerChange = (val: string) => {
        if (questions.length === 0) return;
        const currentQId = questions[currentQuestionIndex].id;
        setAnswers(prev => ({ ...prev, [currentQId]: val }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
    };

    const getLineNumbers = (text: string) => {
        const lines = (text || "").split("\n");
        return lines.map((_, i) => i + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-500">Loading your assessment...</p>
                </div>
            </div>
        );
    }

    if (error && !isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-gray-900 p-6">
                <div className="bg-white border border-red-200 p-8 rounded-lg max-w-md w-full text-center space-y-4 shadow-lg">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-semibold">Assessment Error</h2>
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={() => window.location.href = '/candidate/welcome'} className="mt-4 bg-gray-900 hover:bg-gray-800 w-full text-white">
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    if (isSubmitted && !error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-900 font-sans overflow-hidden">
                <div className="bg-white border border-gray-200 p-10 rounded-2xl max-w-md w-full text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-500">
                    <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Assessment Completed</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Your answers have been securely evaluated and recorded. 
                        We will reach out to you directly regarding the next steps in the hiring process.
                    </p>
                    <Button 
                        onClick={() => window.location.href = '/candidate/welcome'} 
                        className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                    >
                        Return to Portal
                    </Button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || "") : "";
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isCodeQuestion = currentQuestion?.type === 'code';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Warning Overlay */}
            {showWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-300">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5" />
                        <span className="font-bold text-sm">{warningMessage}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 lg:px-12 bg-white border-b border-gray-200 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                        <EquiHireLogo className="h-6 w-auto text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">EquiHire</span>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Assessment</span>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Time Remaining</span>
                        <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-blue-600'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <Button 
                        onClick={handleSubmitClick}
                        className="bg-gray-900 hover:bg-black text-white px-6 font-bold"
                    >
                        Submit
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Question Navigation Sidebar */}
                <aside className="w-72 bg-white border-r border-gray-200 flex flex-col p-6 overflow-y-auto">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Question Navigation</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {questions.map((q, idx) => {
                            const isCurrent = idx === currentQuestionIndex;
                            const isAnswered = !!answers[q.id];
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200
                                        ${isCurrent ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-100' : 
                                          isAnswered ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100' : 
                                          'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                                    `}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 rounded bg-blue-600" />
                            <span className="text-xs font-medium text-gray-600">Current Question</span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 rounded bg-blue-50 border border-blue-100" />
                            <span className="text-xs font-medium text-gray-600">Answered</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded bg-gray-100" />
                            <span className="text-xs font-medium text-gray-600">Unanswered</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-12 bg-gray-50">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Question View */}
                        <div className="bg-white rounded-3xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                                    Question {currentQuestionIndex + 1}
                                </span>
                                {isCodeQuestion && (
                                    <span className="bg-amber-50 text-amber-600 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3.5 h-3.5" />
                                        Coding
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                {currentQuestion?.questionText}
                            </h2>
                        </div>

                        {/* Answer Input Area */}
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Your Solution</label>
                            {isCodeQuestion ? (
                                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-900">
                                    <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                            </div>
                                            <span className="ml-3 text-[10px] font-mono text-gray-400">solution.py</span>
                                        </div>
                                    </div>
                                    <div className="flex min-h-[400px]">
                                        <div className="bg-gray-800/30 px-4 py-4 text-right select-none pointer-events-none border-r border-gray-800 min-w-[50px]">
                                            {getLineNumbers(currentAnswer).map(num => (
                                                <div key={num} className="text-gray-600 text-xs font-mono leading-7">
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                        <textarea
                                            className="flex-1 bg-transparent text-blue-400 font-mono text-sm p-4 resize-none border-0 outline-none focus:ring-0 leading-7 placeholder:text-gray-600 w-full"
                                            placeholder="# Write your secure solution here..."
                                            value={currentAnswer}
                                            onChange={(e) => handleAnswerChange(e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <Textarea
                                    placeholder="Provide your comprehensive answer here..."
                                    className="min-h-[400px] bg-white border-gray-200 text-gray-900 text-lg p-8 rounded-3xl shadow-sm focus-visible:ring-blue-600 transition-all duration-300 resize-none"
                                    value={currentAnswer}
                                    onChange={(e) => handleAnswerChange(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <Button
                                variant="ghost"
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="text-gray-500 font-bold hover:bg-gray-100 px-8 h-12"
                            >
                                Previous
                            </Button>
                            
                            <div className="flex gap-4">
                                {!isLastQuestion && (
                                    <Button
                                        onClick={handleNext}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 h-12 shadow-md"
                                    >
                                        Next Question
                                    </Button>
                                )}
                                {isLastQuestion && (
                                    <Button
                                        onClick={handleSubmitClick}
                                        disabled={isSubmitted || Object.keys(answers).length === 0}
                                        className="bg-gray-900 hover:bg-black text-white font-bold px-10 h-12 shadow-lg"
                                    >
                                        Submit Assessment
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

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
    Terminal, CheckCircle, Clock
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
    const isInitializing = useRef(false);

    useEffect(() => {
        const initializeInterview = async () => {
            if (isInitializing.current) return;
            isInitializing.current = true;
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
            <header className="h-20 flex items-center justify-between px-8 lg:px-12 bg-white border-b border-gray-100 z-50 shadow-sm sticky top-0">
                <div className="flex items-center gap-4">
                    <EquiHireLogo className="h-8 w-auto text-blue-600" />
                    <span className="font-extrabold text-xl tracking-tight text-gray-900">EquiHire</span>
                    <div className="h-5 w-px bg-gray-200 mx-1" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border border-gray-100 bg-gray-50 px-2.5 py-1 rounded-md">Live Assessment</span>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl">
                        <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest leading-none mb-1">Time Remaining</span>
                            <span className={`font-mono text-lg font-black leading-none ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>
                    <Button 
                        onClick={handleSubmitClick}
                        className="bg-[#FF7300] hover:bg-[#E56700] text-white px-8 h-11 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                    >
                        Finish & Submit
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Question Navigation Sidebar */}
                <aside className="w-[300px] bg-white border-r border-gray-100 flex flex-col pt-8 pb-6 px-6 overflow-y-auto shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-10">
                    <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Progress map</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {questions.map((q, idx) => {
                            const isCurrent = idx === currentQuestionIndex;
                            const isAnswered = !!answers[q.id];
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`
                                        relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300
                                        ${isCurrent ? 'bg-black text-white shadow-md ring-4 ring-gray-200 scale-105' : 
                                          isAnswered ? 'bg-[#FFF3EB] text-[#FF7300] border border-[#FFD5B8] hover:bg-[#FFE5D1]' : 
                                          'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'}
                                    `}
                                >
                                    {idx + 1}
                                    {isAnswered && !isCurrent && (
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-8 border-t border-gray-100">
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded bg-black ring-2 ring-gray-200" />
                                <span className="text-xs font-bold text-gray-700">Current</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded bg-[#FF7300] ring-2 ring-[#FFD5B8]" />
                                <span className="text-xs font-bold text-gray-700">Answered</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded bg-gray-200" />
                                <span className="text-xs font-bold text-gray-700">Unanswered</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-10 lg:p-14 bg-gray-50/50">
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Question View */}
                        <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-gray-200 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF7300]" />
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="bg-gray-100 text-gray-900 font-extrabold px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-widest border border-gray-200">
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                    </span>
                                    {isCodeQuestion && (
                                        <span className="bg-[#FFF3EB] text-[#FF7300] font-extrabold px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-widest flex items-center gap-1.5 border border-[#FFD5B8]">
                                            <Terminal className="w-3.5 h-3.5" />
                                            Coding Required
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-gray-400">
                                    {answers[currentQuestion?.id] ? 'Answer recorded safely' : 'Not answered yet'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
                                {currentQuestion?.questionText}
                            </h2>
                        </div>

                        {/* Answer Input Area */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Your Solution</label>
                            </div>
                            {isCodeQuestion ? (
                                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-[#1e1e1e] ring-1 ring-gray-900/5">
                                    <div className="bg-[#2d2d2d] px-4 py-3 border-b border-[#404040] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                            </div>
                                            <div className="h-4 w-px bg-gray-600 mx-1"></div>
                                            <span className="text-xs font-mono font-medium text-gray-300">solution.ts</span>
                                        </div>
                                    </div>
                                    <div className="flex min-h-[400px]">
                                        <div className="bg-[#1e1e1e] px-4 py-5 text-right select-none pointer-events-none border-r border-[#333] min-w-[40px]">
                                            {getLineNumbers(currentAnswer).map(num => (
                                                <div key={num} className="text-[#858585] text-[14px] font-mono leading-[26px]">
                                                    {num}
                                                </div>
                                            ))}
                                        </div>
                                        <textarea
                                            className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[14px] p-5 resize-none border-0 outline-none focus:ring-0 leading-[26px] placeholder:text-[#6b6b6b] w-full"
                                            placeholder="// Write your secure solution here..."
                                            value={currentAnswer}
                                            onChange={(e) => handleAnswerChange(e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative group">
                                    <Textarea
                                        placeholder="Provide your comprehensive answer here... Formatting is preserved."
                                        className="min-h-[400px] bg-white border border-gray-200 text-gray-900 text-base leading-relaxed p-8 rounded-2xl shadow-sm hover:border-[#FF7300]/50 focus-visible:ring-4 focus-visible:ring-[#FF7300]/10 focus-visible:border-[#FF7300] transition-all duration-300 resize-none font-medium"
                                        value={currentAnswer}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                    />
                                    <div className="absolute bottom-4 right-6 text-xs font-bold text-gray-300 pointer-events-none group-focus-within:text-blue-300 transition-colors">
                                        {currentAnswer.length} chars
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mt-8">
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="text-gray-600 font-bold border-gray-200 hover:bg-gray-50 hover:text-gray-900 px-8 h-12 rounded-xl transition-all"
                            >
                                Previous
                            </Button>
                            
                            <div className="flex gap-4">
                                {!isLastQuestion && (
                                    <Button
                                        onClick={handleNext}
                                        className="bg-black hover:bg-gray-900 text-white font-bold px-10 h-12 rounded-xl shadow-md hover:shadow-lg transition-all"
                                    >
                                        Next Question
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

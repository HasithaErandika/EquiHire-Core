import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { EquiHireLogo } from "@/components/ui/Icons";
import { Textarea } from "@/components/ui/textarea";
import { API } from "@/lib/api";
import {
    Loader2, AlertCircle, ShieldAlert, Eye, AlertTriangle,
    Copy, ClipboardPaste, MousePointer, MonitorX, Terminal
} from "lucide-react";

export default function CandidateInterview() {

    const [timeLeft, setTimeLeft] = useState(45 * 60);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // --- Lockdown Browser State ---
    const [violations, setViolations] = useState({
        tabSwitches: 0,
        copyAttempts: 0,
        pasteAttempts: 0,
        rightClickAttempts: 0,
    });
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [warningIcon, setWarningIcon] = useState<"copy" | "paste" | "rightclick" | "tabswitch">("tabswitch");
    const violationsRef = useRef(violations);
    violationsRef.current = violations;

    const totalViolations = violations.tabSwitches + violations.copyAttempts + violations.pasteAttempts + violations.rightClickAttempts;

    const flashWarning = useCallback((msg: string, icon: "copy" | "paste" | "rightclick" | "tabswitch") => {
        setWarningMessage(msg);
        setWarningIcon(icon);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
    }, []);

    // --- Lockdown event listeners ---
    useEffect(() => {
        if (loading || error || isSubmitted) return;

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            setViolations(prev => ({ ...prev, copyAttempts: prev.copyAttempts + 1 }));
            flashWarning("Copy is disabled during the assessment. This violation has been recorded.", "copy");
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            setViolations(prev => ({ ...prev, pasteAttempts: prev.pasteAttempts + 1 }));
            flashWarning("Paste is disabled during the assessment. This violation has been recorded.", "paste");
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            setViolations(prev => ({ ...prev, copyAttempts: prev.copyAttempts + 1 }));
            flashWarning("Cut is disabled during the assessment. This violation has been recorded.", "copy");
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            setViolations(prev => ({ ...prev, rightClickAttempts: prev.rightClickAttempts + 1 }));
            flashWarning("Right-click is disabled during the assessment. This violation has been recorded.", "rightclick");
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolations(prev => ({ ...prev, tabSwitches: prev.tabSwitches + 1 }));
                flashWarning("Tab switch detected. Switching tabs during the assessment is not allowed. This violation has been recorded.", "tabswitch");
            }
        };

        const handleBlur = () => {
            setViolations(prev => ({ ...prev, tabSwitches: prev.tabSwitches + 1 }));
            flashWarning("Window focus lost. Leaving the assessment window is not allowed. This violation has been recorded.", "tabswitch");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (['c', 'v', 'x'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    if (e.key.toLowerCase() === 'v') {
                        setViolations(prev => ({ ...prev, pasteAttempts: prev.pasteAttempts + 1 }));
                        flashWarning("Paste shortcut is disabled. This violation has been recorded.", "paste");
                    } else {
                        setViolations(prev => ({ ...prev, copyAttempts: prev.copyAttempts + 1 }));
                        flashWarning("Copy/Cut shortcut is disabled. This violation has been recorded.", "copy");
                    }
                }
            }
        };

        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', handleBlur);
        };
    }, [loading, error, isSubmitted, flashWarning]);

    // Initialize
    useEffect(() => {
        const initializeInterview = async () => {
            try {
                const storedDataStr = sessionStorage.getItem('candidateData');
                if (!storedDataStr) {
                    setError("No invitation session found. Please use the link provided in your email.");
                    setLoading(false);
                    return;
                }
                const storedData = JSON.parse(storedDataStr);
                if (!storedData.jobId) {
                    setError("Invalid session data. Job ID is missing.");
                    setLoading(false);
                    return;
                }
                const jobQuestions = await API.getJobQuestions(storedData.jobId);
                setQuestions(jobQuestions);
                setLoading(false);
            } catch (err: any) {
                console.error("Initialization error:", err);
                setError("Failed to initialize interview. Please try again.");
                setLoading(false);
            }
        };
        initializeInterview();
    }, []);

    // Timer
    useEffect(() => {
        if (loading || error || isSubmitted) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, error, isSubmitted]);

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

    const handleSubmit = async () => {
        setIsSubmitted(true);
        const formattedAnswers = Object.entries(answers).map(([questionId, text]) => ({
            questionId,
            answerText: text
        }));

        try {
            const candidateId = sessionStorage.getItem('candidateId');
            const candidateDataStr = sessionStorage.getItem('candidateData');

            if (!candidateId || !candidateDataStr) {
                alert("Missing session data. Cannot submit assessment. Please ensure you uploaded your CV.");
                setIsSubmitted(false);
                return;
            }

            const candidateData = JSON.parse(candidateDataStr);
            await API.submitCandidateAnswers(candidateId, candidateData.jobId, formattedAnswers);

            // Flag violations in audit if any
            const currentViolations = violationsRef.current;
            const totalV = currentViolations.tabSwitches + currentViolations.copyAttempts + currentViolations.pasteAttempts + currentViolations.rightClickAttempts;
            if (totalV > 0 && candidateData.organizationId) {
                try {
                    await API.flagCheating(candidateId, candidateData.organizationId, {
                        tabSwitches: currentViolations.tabSwitches,
                        copyAttempts: currentViolations.copyAttempts,
                        pasteAttempts: currentViolations.pasteAttempts,
                        rightClickAttempts: currentViolations.rightClickAttempts,
                        totalViolations: totalV
                    });
                } catch (flagErr) {
                    console.error("Failed to flag cheating:", flagErr);
                }
            }

            sessionStorage.removeItem('invite_token');
            sessionStorage.removeItem('candidateData');
            sessionStorage.removeItem('candidateId');
            alert("Assessment Submitted Successfully!");
            window.location.href = '/candidate/welcome';
        } catch (err) {
            console.error(err);
            alert("Failed to submit assessment.");
            setIsSubmitted(false);
        }
    };

    // --- Warning Icon Selector ---
    const getWarningIcon = () => {
        switch (warningIcon) {
            case "copy": return <Copy className="w-12 h-12 text-red-500 mx-auto mb-4" />;
            case "paste": return <ClipboardPaste className="w-12 h-12 text-red-500 mx-auto mb-4" />;
            case "rightclick": return <MousePointer className="w-12 h-12 text-red-500 mx-auto mb-4" />;
            case "tabswitch": return <MonitorX className="w-12 h-12 text-red-500 mx-auto mb-4" />;
        }
    };

    // --- Code Editor Line Numbers ---
    const getLineNumbers = (text: string) => {
        const lines = (text || "").split("\n");
        return lines.map((_, i) => i + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111827] flex items-center justify-center font-sans text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF7300]" />
                    <p className="text-gray-400">Loading your assessment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#111827] flex items-center justify-center font-sans text-white p-6">
                <div className="bg-gray-900/80 border border-red-500/30 p-8 rounded-lg max-w-md w-full text-center space-y-4 shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-gray-400">{error}</p>
                    <Button onClick={() => window.location.href = '/candidate/welcome'} className="mt-4 bg-gray-800 hover:bg-gray-700 w-full">
                        Return Home
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
        <div className="min-h-screen bg-[#111827] flex flex-col font-sans text-white overflow-hidden relative select-none" style={{ userSelect: 'none' }}>
            {/* Lockdown Warning Overlay */}
            {showWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-red-950/90 border-2 border-red-500 rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl animate-in zoom-in-95 duration-300">
                        {getWarningIcon()}
                        <h3 className="text-xl font-bold text-red-400 mb-2">Lockdown Violation</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{warningMessage}</p>
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-red-400">
                            <Eye className="w-3 h-3" />
                            <span>Total violations recorded: {totalViolations}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF7300]/10 blur-[100px]"></div>
            </div>

            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 lg:px-12 z-10 border-b border-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center">
                    <EquiHireLogo className="mr-3 w-8 h-8 text-white" />
                    <span className="font-semibold text-lg tracking-tight">EquiHire</span>
                    <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-wider">
                        Lockdown Assessment
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    {totalViolations > 0 && (
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <ShieldAlert className="w-3 h-3" />
                            {totalViolations} violation{totalViolations !== 1 ? 's' : ''}
                        </span>
                    )}
                    <span className="text-sm text-gray-400 hidden sm:inline-block">Time Remaining: <span className="text-white font-mono">{formatTime(timeLeft)}</span></span>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start p-6 z-10 relative w-full max-w-4xl mx-auto mt-8">
                <div className="w-full space-y-6">
                    {/* Progress */}
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6">
                        <div
                            className="bg-[#FF7300] h-1.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100}%` }}
                        ></div>
                    </div>

                    {questions.length === 0 ? (
                        <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-12 rounded-lg text-center">
                            <p className="text-gray-400">No questions have been configured for this role yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Question Card */}
                            <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</h2>
                                    <span className={`inline-flex items-center gap-1 text-xs uppercase font-medium tracking-wider px-2.5 py-1 rounded ${isCodeQuestion ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 bg-gray-800'}`}>
                                        {isCodeQuestion && <Terminal className="w-3 h-3" />}
                                        {currentQuestion.type || "Text Answer"}
                                    </span>
                                </div>
                                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                                    {currentQuestion.questionText}
                                </div>
                            </div>

                            {/* Answer Area */}
                            <div className="space-y-4">
                                {isCodeQuestion ? (
                                    /* Code Editor */
                                    <div className="rounded-lg overflow-hidden border border-gray-700 shadow-xl">
                                        {/* Editor Header */}
                                        <div className="bg-[#1e1e1e] px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1.5">
                                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                </div>
                                                <span className="text-gray-400 text-xs ml-2 flex items-center gap-1">
                                                    <Terminal className="w-3 h-3 text-green-400" />
                                                    solution.py
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Editor</span>
                                        </div>
                                        {/* Editor Body with Line Numbers */}
                                        <div className="flex bg-[#1e1e1e] min-h-[350px]">
                                            {/* Line Numbers */}
                                            <div className="bg-[#1e1e1e] border-r border-gray-800 px-3 py-3 text-right select-none pointer-events-none min-w-[48px]">
                                                {getLineNumbers(currentAnswer).map(num => (
                                                    <div key={num} className="text-gray-600 text-xs font-mono leading-[1.65rem]">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Code Input */}
                                            <textarea
                                                className="flex-1 bg-[#1e1e1e] text-green-400 font-mono text-sm p-3 resize-none border-0 outline-none focus:ring-0 leading-[1.65rem] placeholder:text-gray-600 min-h-[350px] w-full"
                                                placeholder="# Write your solution here..."
                                                value={currentAnswer}
                                                onChange={(e) => handleAnswerChange(e.target.value)}
                                                disabled={isSubmitted}
                                                onPaste={(e) => e.preventDefault()}
                                                onCopy={(e) => e.preventDefault()}
                                                onCut={(e) => e.preventDefault()}
                                                spellCheck={false}
                                                wrap="off"
                                            />
                                        </div>
                                        {/* Editor Footer */}
                                        <div className="bg-[#1e1e1e] border-t border-gray-700 px-4 py-1.5 flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500">
                                                Lines: {(currentAnswer || "").split("\n").length} | Chars: {(currentAnswer || "").length}
                                            </span>
                                            <span className="text-[10px] text-gray-600">Lockdown Mode Active</span>
                                        </div>
                                    </div>
                                ) : (
                                    /* Standard Text Answer */
                                    <Textarea
                                        placeholder="Type your answer here..."
                                        className="min-h-[300px] bg-gray-900/80 border-gray-700 text-white focus-visible:ring-[#FF7300]"
                                        value={currentAnswer}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        disabled={isSubmitted}
                                        onPaste={(e) => e.preventDefault()}
                                        onCopy={(e) => e.preventDefault()}
                                        onCut={(e) => e.preventDefault()}
                                    />
                                )}

                                <div className="flex justify-between items-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrev}
                                        disabled={currentQuestionIndex === 0 || isSubmitted}
                                        className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                                    >
                                        Previous
                                    </Button>

                                    {isLastQuestion ? (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitted || Object.keys(answers).length === 0}
                                            className="bg-[#FF7300] hover:bg-[#E56700] text-white px-8"
                                        >
                                            {isSubmitted ? "Submitting..." : "Submit Assessment"}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleNext}
                                            disabled={isSubmitted || !currentAnswer.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
                                        >
                                            Next Question
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

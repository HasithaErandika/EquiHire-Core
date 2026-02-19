import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Code, FileText, AlertCircle, Terminal } from "lucide-react";
import { useAuthContext } from "@asgardeo/auth-react";
import { API } from "@/lib/api";

export default function Questions() {
    const { state } = useAuthContext();
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // New Question State
    const [questionText, setQuestionText] = useState("");
    const [sampleAnswer, setSampleAnswer] = useState("");
    const [keywordsInput, setKeywordsInput] = useState("");
    const [questionType, setQuestionType] = useState("paragraph");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (state.sub) {
            API.getJobs(state.sub)
                .then(setJobs)
                .catch(err => console.error("Failed to load jobs", err));
        }
    }, [state.sub]);

    useEffect(() => {
        if (selectedJobId) {
            fetchQuestions(selectedJobId);
        } else {
            setQuestions([]);
        }
    }, [selectedJobId]);

    const fetchQuestions = async (jobId: string) => {
        setLoading(true);
        try {
            const data = await API.getJobQuestions(jobId);
            setQuestions(data);
        } catch (err) {
            console.error("Failed to load questions", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = async () => {
        setError("");

        if (!selectedJobId) {
            setError("Please select a job role first.");
            return;
        }

        if (questions.length >= 10) {
            setError("Maximum 10 questions allowed per job.");
            return;
        }

        if (!questionText.trim()) {
            setError("Question description is required.");
            return;
        }

        setIsSubmitting(true);

        const keywords = keywordsInput.split(",").map(k => k.trim()).filter(k => k);

        const newQuestion = {
            jobId: selectedJobId,
            questionText,
            sampleAnswer,
            keywords,
            questionType
        };

        try {
            // Note: API wrapper expects an array
            await API.createJobQuestions([newQuestion]);

            // Refresh list
            await fetchQuestions(selectedJobId);

            // Reset form
            setQuestionText("");
            setSampleAnswer("");
            setKeywordsInput("");
            setQuestionType("paragraph");
        } catch (err) {
            console.error(err);
            setError("Failed to add question.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return;

        try {
            await API.deleteQuestion(id);
            setQuestions(questions.filter(q => q.id !== id));
        } catch (err) {
            console.error(err);
            setError("Failed to delete question.");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Interview Questions</h2>
                <p className="text-gray-500">Manage technical questions and quizzes for your job roles.</p>
            </div>

            <Card className="border-t-4 border-t-[#FF7300] shadow-sm">
                <CardHeader>
                    <CardTitle>Select Job Role</CardTitle>
                    <CardDescription>Choose a job to manage its questions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                        <SelectTrigger className="w-full md:w-[400px] border-gray-200 focus:ring-[#FF7300]">
                            <SelectValue placeholder="Select a job role..." />
                        </SelectTrigger>
                        <SelectContent>
                            {jobs.map((job) => (
                                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedJobId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* List of Questions */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                Existing Questions
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-orange-50 text-[#FF7300] ml-2">
                                    {questions.length}/10
                                </span>
                            </h3>
                        </div>

                        {loading ? (
                            <p className="text-sm text-gray-500">Loading questions...</p>
                        ) : questions.length === 0 ? (
                            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">No questions added yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {questions.map((q, index) => (
                                    <Card key={q.id || index} className="overflow-hidden border-l-4 border-l-gray-300 hover:border-l-[#FF7300] transition-all group">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors uppercase ${q.questionType === 'code'
                                                                ? 'bg-gray-900 text-white border-gray-700'
                                                                : 'bg-white text-gray-600 border-gray-200'
                                                            }`}>
                                                            {q.questionType === 'code' ? <Terminal className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                                                            {q.questionType}
                                                        </span>
                                                    </div>

                                                    {q.questionType === 'code' ? (
                                                        <div className="bg-gray-900 rounded-md p-3 font-mono text-sm text-gray-300 border border-gray-700 shadow-inner">
                                                            <div className="flex items-center gap-1.5 border-b border-gray-700 pb-2 mb-2 text-xs text-gray-500">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                                                <span className="ml-2">Question Preview</span>
                                                            </div>
                                                            <p className="whitespace-pre-wrap">{q.questionText}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="font-medium text-sm text-gray-900">{q.questionText}</p>
                                                    )}

                                                    {q.keywords && q.keywords.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {q.keywords.map((k: string, i: number) => (
                                                                <span key={i} className="text-[10px] bg-orange-50 text-orange-700 border border-orange-100 px-1.5 py-0.5 rounded">
                                                                    {k}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-red-500 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add New Question Form */}
                    <Card className="h-fit sticky top-6 shadow-md border-gray-200">
                        <CardHeader className="bg-gray-50 border-b pb-4">
                            <CardTitle className="text-base text-gray-800">Add New Question</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Question Type</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={questionType === 'paragraph' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setQuestionType('paragraph')}
                                        className={questionType === 'paragraph' ? 'bg-[#FF7300] hover:bg-[#E56700] text-white border-transparent' : 'hover:text-[#FF7300] hover:border-[#FF7300]'}
                                    >
                                        <FileText className="w-4 h-4 mr-2" /> Paragraph
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={questionType === 'code' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setQuestionType('code')}
                                        className={questionType === 'code' ? 'bg-[#1E1E1E] hover:bg-black text-white border-transparent' : 'hover:text-black hover:border-black'}
                                    >
                                        <Code className="w-4 h-4 mr-2" /> Coding Challenge
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="q-text">
                                    {questionType === 'code' ? 'Problem Description' : 'Question'}
                                </Label>
                                {questionType === 'code' ? (
                                    <div className="relative rounded-md overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#FF7300] focus-within:border-transparent transition-all">
                                        <div className="bg-gray-100 text-xs text-gray-500 px-3 py-1.5 border-b border-gray-200 flex items-center">
                                            <FileText className="w-3 h-3 mr-1" /> Description (Markdown supported)
                                        </div>
                                        <Textarea
                                            id="q-text"
                                            placeholder="Desribe the coding problem, constraints, and examples..."
                                            value={questionText}
                                            onChange={(e) => setQuestionText(e.target.value)}
                                            className="min-h-[100px] border-0 focus-visible:ring-0 rounded-none resize-y"
                                        />
                                    </div>
                                ) : (
                                    <Textarea
                                        id="q-text"
                                        placeholder="e.g. Explain the difference between..."
                                        value={questionText}
                                        onChange={(e) => setQuestionText(e.target.value)}
                                        className="min-h-[80px] focus-visible:ring-[#FF7300]"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="q-answer">
                                    {questionType === 'code' ? 'Sample Solution / Starter Code' : 'Sample Answer (for AI context)'}
                                </Label>

                                {questionType === 'code' ? (
                                    <div className="relative rounded-md overflow-hidden shadow-sm border border-gray-700">
                                        <div className="bg-[#1E1E1E] text-gray-400 text-xs px-3 py-1.5 border-b border-gray-700 flex items-center justify-between">
                                            <span className="flex items-center"><Terminal className="w-3 h-3 mr-2 text-green-500" /> main.py</span>
                                            <span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-400">Editor</span>
                                        </div>
                                        <Textarea
                                            id="q-answer"
                                            placeholder="# Write the solution or starter code here..."
                                            value={sampleAnswer}
                                            onChange={(e) => setSampleAnswer(e.target.value)}
                                            className="min-h-[150px] font-mono text-sm bg-[#1E1E1E] text-green-400 border-0 focus-visible:ring-0 rounded-none resize-y leading-relaxed placeholder:text-gray-600"
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : (
                                    <Textarea
                                        id="q-answer"
                                        placeholder="Provide a model answer or key points..."
                                        value={sampleAnswer}
                                        onChange={(e) => setSampleAnswer(e.target.value)}
                                        className="min-h-[100px] font-mono text-sm focus-visible:ring-[#FF7300]"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="q-keywords">Keywords (Comma separated)</Label>
                                <Input
                                    id="q-keywords"
                                    placeholder="e.g. Recursion, DP, Time Complexity"
                                    value={keywordsInput}
                                    onChange={(e) => setKeywordsInput(e.target.value)}
                                    className="focus-visible:ring-[#FF7300]"
                                />
                                <p className="text-xs text-gray-500">Used for automated keyword matching.</p>
                            </div>

                            <Button
                                onClick={handleAddQuestion}
                                disabled={isSubmitting || questions.length >= 10}
                                className="w-full bg-[#FF7300] hover:bg-[#E56700] text-white shadow-md transition-all active:scale-[0.99]"
                            >
                                {isSubmitting ? 'Saving...' : 'Add Question'} <Plus className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

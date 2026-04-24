/**
 * Questions view: select job, list questions, add/delete questions. Uses useQuestions for data and actions.
 */

import { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { useQuestions } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Code, FileText, Terminal, Briefcase, Loader2 } from 'lucide-react';
import { AlertMessage } from '@/components/ui/alert-message';
import { Skeleton } from '@/components/ui/skeleton';

export default function Questions() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const {
    jobs,
    selectedJobId,
    setSelectedJobId,
    questions,
    questionCounts,
    isLoading: loading,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  } = useQuestions({ userId });

  const [questionText, setQuestionText] = useState('');
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [questionType, setQuestionType] = useState('paragraph');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<import('@/types').Question | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editSampleAnswer, setEditSampleAnswer] = useState('');
  const [editKeywordsInput, setEditKeywordsInput] = useState('');
  const [editQuestionType, setEditQuestionType] = useState('paragraph');
  const [isEditingQuestionSubmitting, setIsEditingQuestionSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const handleAddQuestion = async () => {
    setError('');
    if (!selectedJobId) {
      setError('Please select a job role first.');
      return;
    }
    if (!selectedJob) {
      setError('Job details not found.');
      return;
    }
    if (questions.length >= 10) {
      setError('Maximum 10 questions allowed per job.');
      return;
    }
    if (!questionText.trim()) {
      setError('Question description is required.');
      return;
    }
    setIsSubmitting(true);
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const result = await addQuestion({
      jobId: selectedJobId,
      organizationId: selectedJob.organizationId,
      questionText,
      sampleAnswer,
      keywords,
      questionType,
      sortOrder: questions.length + 1,
    });
    setIsSubmitting(false);
    if (result.success) {
      setQuestionText('');
      setSampleAnswer('');
      setKeywordsInput('');
      setQuestionType('paragraph');
    } else {
      setError(result.error ?? 'Failed to add question.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion(id);
    } catch (err) {
      console.error(err);
      setError('Failed to delete question.');
    }
  };

  const handleEditClick = (q: import('@/types').Question) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText); // Wait, use separate state variables to avoid affecting Add Form
    setEditQuestionText(q.questionText);
    setEditSampleAnswer(q.sampleAnswer || '');
    setEditKeywordsInput(q.keywords?.join(', ') || '');
    setEditQuestionType(q.type || 'paragraph');
    setEditError('');
    setEditDialogOpen(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion?.id) return;
    setEditError('');
    if (!editQuestionText.trim()) {
      setEditError('Question description is required.');
      return;
    }
    setIsEditingQuestionSubmitting(true);
    const keywords = editKeywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    
    const result = await updateQuestion(editingQuestion.id, {
      questionText: editQuestionText,
      sampleAnswer: editSampleAnswer,
      keywords,
      questionType: editQuestionType,
    });
    setIsEditingQuestionSubmitting(false);
    
    if (result.success) {
      setEditDialogOpen(false);
      setEditingQuestion(null);
    } else {
      setEditError(result.error ?? 'Failed to update question.');
    }
  };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-xl">
                     <FileText className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500">Interview Questions</h2>
                    <p className="text-gray-500 text-sm font-medium">Manage technical questions and quizzes for your job roles.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Left 2/3) */}
                <div className="col-span-1 lg:col-span-2 space-y-6">

                    <Card className="border-t-4 border-t-primary shadow-sm">
                        <CardHeader>
                            <CardTitle>Select Job Role</CardTitle>
                            <CardDescription>Choose a job to manage its questions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                <SelectTrigger className="w-full md:w-[400px] border-gray-200 focus:ring-primary">
                                    <SelectValue placeholder="Select a job role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs.map((job) => (
                                        <SelectItem key={job.id || 'default'} value={job.id || ''}>{job.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {selectedJobId && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* List of Questions */}
                            <div className="space-y-6">
                                <Card className="shadow-md border-gray-100 h-full border-t-4 border-t-primary">
                                    <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" aria-hidden />
                                            Existing Questions
                                        </CardTitle>
                                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                            {loading ? <Skeleton className="h-3 w-8" /> : `${questions.length} total`}
                                        </span>
                                    </CardHeader>
                                    <CardContent className="pt-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                                        {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-4 border rounded-lg bg-white flex flex-col gap-3">
                                                <Skeleton className="h-4 w-1/4 bg-gray-200" />
                                                <Skeleton className="h-3 w-3/4 bg-gray-200" />
                                                <Skeleton className="h-3 w-1/2 bg-gray-200" />
                                            </div>
                                        ))}
                                    </div>
                                ) : questions.length === 0 ? (
                                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-sm">No questions added yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {questions.map((q, index) => (
                                            <Card key={q.id || index} className="overflow-hidden border-l-4 border-l-gray-300 hover:border-l-primary transition-all group">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors uppercase ${q.type === 'code'
                                                                    ? 'bg-gray-900 text-white border-gray-700'
                                                                    : 'bg-white text-gray-600 border-gray-200'
                                                                    }`}>
                                                                    {q.type === 'code' ? <Terminal className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                                                                    {q.type}
                                                                </span>
                                                            </div>

                                                            {q.type === 'code' ? (
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
                                                                        <span key={i} className="text-[10px] bg-primary/10 text-primary border border-primary/10 px-1.5 py-0.5 rounded">
                                                                            {k}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-gray-400 hover:text-blue-500 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleEditClick(q)}
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-gray-400 hover:text-red-500 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleDeleteQuestion(q.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Add New Question Form */}
                            <Card className="h-fit sticky top-6 shadow-md border-gray-100 border-t-4 border-t-primary">
                                <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-primary" aria-hidden />
                                        Add New Question
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4">
                                    <AlertMessage type="error" message={error} className="mb-4" />

                                    <div className="space-y-2">
                                        <Label>Question Type</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={questionType === 'paragraph' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setQuestionType('paragraph')}
                                                className={questionType === 'paragraph' ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-transparent' : 'hover:text-primary hover:border-primary'}
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
                                            <div className="relative rounded-md overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
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
                                                className="min-h-[80px] focus-visible:ring-primary"
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
                                                className="min-h-[100px] font-mono text-sm focus-visible:ring-primary"
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
                                            className="focus-visible:ring-primary"
                                        />
                                        <p className="text-xs text-gray-500">Used for automated keyword matching.</p>
                                    </div>

                                    <Button
                                        onClick={handleAddQuestion}
                                        disabled={isSubmitting || questions.length >= 10}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-[0.99]"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Add Question'} <Plus className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                </div>

                {/* Side Panel: Job Questionnaires (Right 1/3) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500">Job Questionnaires</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {jobs.length === 0 ? (
                                    <p className="text-sm text-gray-400">No jobs available.</p>
                                ) : (
                                    jobs.map((job) => {
                                        const count = job.id ? questionCounts[job.id] : 0;
                                        const isSelected = selectedJobId === job.id;
                                        return (
                                            <div
                                                key={job.id || 'default'}
                                                onClick={() => { if (job.id) setSelectedJobId(job.id); }}
                                                className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${isSelected
                                                        ? 'bg-primary/10 border-primary/30'
                                                        : 'bg-gray-50 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center min-w-0">
                                                    <Briefcase className={`h-4 w-4 mr-3 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                                                    <div className="min-w-0">
                                                        <p className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{job.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {count === undefined ? (
                                                                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
                                                            ) : (
                                                                `${count} question${count !== 1 ? 's' : ''}`
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                {count !== undefined && count > 0 && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                        {count}/10
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4 space-y-4">
                        <AlertMessage type="error" message={editError} className="mb-4" />
                        <div className="space-y-2">
                            <Label>Question Type</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={editQuestionType === 'paragraph' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setEditQuestionType('paragraph')}
                                    className={editQuestionType === 'paragraph' ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-transparent' : 'hover:text-primary hover:border-primary'}
                                >
                                    <FileText className="w-4 h-4 mr-2" /> Paragraph
                                </Button>
                                <Button
                                    type="button"
                                    variant={editQuestionType === 'code' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setEditQuestionType('code')}
                                    className={editQuestionType === 'code' ? 'bg-[#1E1E1E] hover:bg-black text-white border-transparent' : 'hover:text-black hover:border-black'}
                                >
                                    <Code className="w-4 h-4 mr-2" /> Coding Challenge
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-q-text">
                                {editQuestionType === 'code' ? 'Problem Description' : 'Question'}
                            </Label>
                            {editQuestionType === 'code' ? (
                                <div className="relative rounded-md overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                                    <div className="bg-gray-100 text-xs text-gray-500 px-3 py-1.5 border-b border-gray-200 flex items-center">
                                        <FileText className="w-3 h-3 mr-1" /> Description (Markdown supported)
                                    </div>
                                    <Textarea
                                        id="edit-q-text"
                                        placeholder="Describe the coding problem..."
                                        value={editQuestionText}
                                        onChange={(e) => setEditQuestionText(e.target.value)}
                                        className="min-h-[100px] border-0 focus-visible:ring-0 rounded-none resize-y"
                                    />
                                </div>
                            ) : (
                                <Textarea
                                    id="edit-q-text"
                                    placeholder="e.g. Explain the difference between..."
                                    value={editQuestionText}
                                    onChange={(e) => setEditQuestionText(e.target.value)}
                                    className="min-h-[80px] focus-visible:ring-primary"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-q-answer">
                                {editQuestionType === 'code' ? 'Sample Solution / Starter Code' : 'Sample Answer (for AI context)'}
                            </Label>

                            {editQuestionType === 'code' ? (
                                <div className="relative rounded-md overflow-hidden shadow-sm border border-gray-700">
                                    <div className="bg-[#1E1E1E] text-gray-400 text-xs px-3 py-1.5 border-b border-gray-700 flex items-center justify-between">
                                        <span className="flex items-center"><Terminal className="w-3 h-3 mr-2 text-green-500" /> main.py</span>
                                        <span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-400">Editor</span>
                                    </div>
                                    <Textarea
                                        id="edit-q-answer"
                                        placeholder="# Write the solution or starter code here..."
                                        value={editSampleAnswer}
                                        onChange={(e) => setEditSampleAnswer(e.target.value)}
                                        className="min-h-[150px] font-mono text-sm bg-[#1E1E1E] text-green-400 border-0 focus-visible:ring-0 rounded-none resize-y leading-relaxed placeholder:text-gray-600"
                                        spellCheck={false}
                                    />
                                </div>
                            ) : (
                                <Textarea
                                    id="edit-q-answer"
                                    placeholder="Provide a model answer or key points..."
                                    value={editSampleAnswer}
                                    onChange={(e) => setEditSampleAnswer(e.target.value)}
                                    className="min-h-[100px] font-mono text-sm focus-visible:ring-primary"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-q-keywords">Keywords (Comma separated)</Label>
                            <Input
                                id="edit-q-keywords"
                                placeholder="e.g. Recursion, DP, Time Complexity"
                                value={editKeywordsInput}
                                onChange={(e) => setEditKeywordsInput(e.target.value)}
                                className="focus-visible:ring-primary"
                            />
                            <p className="text-xs text-gray-500">Used for automated keyword matching.</p>
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditingQuestionSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateQuestion}
                            disabled={isEditingQuestionSubmitting}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isEditingQuestionSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

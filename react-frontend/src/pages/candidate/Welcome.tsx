/**
 * Candidate welcome: CV upload and proceed to interview. Uses sessionStorage candidate data from InviteHandler.
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, CheckCircle, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { EquiHireLogo } from "@/components/ui/Icons";
import { API } from "@/lib/api";
import type { ParsedCv } from '@/types';

interface CandidateData {
    email: string;
    name: string;
    jobTitle: string;
    organizationId: string;
    jobId: string;
}

export default function CandidateWelcome() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState<string>('');
    const [uploadComplete, setUploadComplete] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [parsedCv, setParsedCv] = useState<ParsedCv | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [candidateData, setCandidateData] = useState<CandidateData | null>(null);

    useEffect(() => {
        // Retrieve candidate data from sessionStorage
        const storedData = sessionStorage.getItem('candidateData');
        if (storedData) {
            setCandidateData(JSON.parse(storedData));
        }
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Guard: only accept PDFs
            if (selectedFile.type !== 'application/pdf') {
                setUploadError('Only PDF files are accepted. Please upload a valid PDF.');
                return;
            }

            setFile(selectedFile);
            setUploadError(null);
            setIsUploading(true);

            try {
                if (!candidateData?.jobId) {
                    throw new Error('Missing Job ID. Please re-open the invitation link.');
                }

                // The backend pipeline is: extract text → upload to R2 → parse with Gemini.
                // We show step labels so the candidate knows what is happening.
                setUploadStep('Extracting text from your CV…');

                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('jobId', candidateData.jobId);

                // Small delay so the first label is visible before the network request begins
                await new Promise(r => setTimeout(r, 300));
                setUploadStep('Uploading to secure storage…');

                const response = await API.uploadCv(formData);

                setUploadStep('AI analysis complete.');

                // Store candidate ID for the interview session
                sessionStorage.setItem('candidateId', response.candidateId);

                // Log R2 key for debugging (not shown to candidate)
                if (response.r2Key) {
                    console.info('[EquiHire] CV stored in R2:', response.r2Key);
                }

                setUploadComplete(true);
                setParsedCv(response.parsed ?? null);
                if (response.parsed) {
                    setPreviewOpen(true);
                }

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown upload error';
                console.error('[EquiHire] CV upload failed:', message);
                setUploadError('Upload failed — ' + message + '. Please try again with a valid PDF.');
                setFile(null);
                setUploadStep('');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleJoin = () => {
        // Navigate to interview room (mock)
        window.location.href = '/candidate/interview';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Minimal Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-12">
                <div className="flex items-center">
                    <EquiHireLogo className="mr-3 h-8 w-auto" />
                    <span className="font-semibold text-lg tracking-tight text-gray-900">EquiHire</span>
                </div>
                <div className="text-sm text-gray-500">
                    Candidate Portal
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                            <ShieldCheck className="h-8 w-8 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome{candidateData?.name ? `, ${candidateData.name}` : ' to your Blind Interview'}
                        </h1>
                        {candidateData?.jobTitle && (
                            <p className="mt-2 text-lg font-semibold text-[#FF7300]">
                                Position: {candidateData.jobTitle}
                            </p>
                        )}
                        <p className="mt-2 text-gray-500">
                            EquiHire ensures a fair process. Your identity will be protected until the final stage.
                        </p>
                    </div>

                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardContent className="pt-6 pb-8 px-8 space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 flex items-center">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs mr-3">1</span>
                                    Upload your CV
                                </h3>

                                {!uploadComplete ? (
                                    <>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
                                            <Input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                                accept=".pdf"
                                                disabled={isUploading}
                                            />
                                            <div className="flex flex-col items-center justify-center pointer-events-none">
                                                <Upload className={`h-10 w-10 text-gray-400 mb-3 ${isUploading ? 'animate-bounce' : ''}`} />
                                                <p className="text-sm font-medium text-gray-900">
                                                    {isUploading
                                                        ? uploadStep || 'Uploading…'
                                                        : 'Click to upload or drag and drop'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">PDF only · up to 10 MB</p>
                                            </div>
                                        </div>

                                        {/* Inline error message — no alert() */}
                                        {uploadError && (
                                            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                <span>{uploadError}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center">
                                                <div className="bg-green-100 p-2 rounded-full mr-3">
                                                    <FileText className="h-5 w-5 text-green-700" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-green-800">{file?.name ?? 'Your CV file'}</p>
                                                    <p className="text-xs text-green-600">Upload complete — We parsed your information.</p>
                                                </div>
                                            </div>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <Button
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                                onClick={() => setPreviewOpen(true)}
                                                disabled={!parsedCv}
                                            >
                                                View extracted info
                                            </Button>
                                            <p className="text-xs text-gray-500">
                                                If it looks off, you can re-upload a clearer version.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`space-y-4 transition-opacity duration-500 ${uploadComplete ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <h3 className="font-semibold text-gray-900 flex items-center">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs mr-3">2</span>
                                    Join Session
                                </h3>
                                <p className="text-sm text-gray-500 ml-9">
                                    You are about to enter the Lockdown Assessment.
                                </p>
                                <Button
                                    className="w-full bg-[#FF7300] hover:bg-[#E56700] text-white h-12 text-base"
                                    onClick={handleJoin}
                                    disabled={!uploadComplete}
                                >
                                    Enter Waiting Room <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Extracted CV preview</DialogTitle>
                                <DialogDescription>
                                    We parsed the key information from your upload. This helps us match you to the role while keeping your identity private.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto text-sm text-gray-700">
                                {parsedCv ? (
                                    <>
                                        {parsedCv.experienceLevel && (
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Experience Level</h4>
                                                <p className="mt-1 text-base font-medium text-gray-900">
                                                    {parsedCv.experienceLevel}
                                                </p>
                                            </div>
                                        )}

                                        {parsedCv.detectedStack && parsedCv.detectedStack.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Detected Skills</h4>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {parsedCv.detectedStack.map((skill: string) => (
                                                        <span
                                                            key={skill}
                                                            className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {parsedCv.sections && Object.keys(parsedCv.sections).length > 0 ? (
                                            <div className="space-y-4">
                                                {Object.entries(parsedCv.sections).map(([section, value]) => {
                                                    const normalizedTitle = section
                                                        .replace(/_/g, ' ')
                                                        .replace(/\b\w/g, (c) => c.toUpperCase());
                                                    const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
                                                    return (
                                                        <div key={section} className="space-y-1">
                                                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                {normalizedTitle}
                                                            </h4>
                                                            <p className="text-sm text-gray-700 whitespace-pre-line">{content}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No section breakdowns were found in the parsed CV.</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">No parsed preview is available yet. Upload a clearer CV and try again.</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button className="w-full sm:w-auto" onClick={() => setPreviewOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <p className="text-center text-xs text-gray-400">
                        Powered by EquiHire Core • Privacy Protected
                    </p>
                </div>
            </main>
        </div>
    );
}

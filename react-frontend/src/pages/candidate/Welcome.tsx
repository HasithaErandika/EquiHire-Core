import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, CheckCircle, ArrowRight, ShieldCheck, AlertCircle, EyeOff, Ban, Lightbulb, BookOpen, Clock, Loader2 } from "lucide-react";
import { EquiHireLogo } from "@/components/ui/Icons";
import { API } from "@/lib/api";
import type { ParsedCv } from '@/types';
import FillOutImage from '@/assets/Instruction manual-pana.svg';
import OnlineTestImage from '@/assets/Online test-amico.svg';

const PrettyJsonObject = ({ data }: { data: Record<string, unknown> | unknown[] | string | number | boolean | null }) => {
    if (typeof data !== 'object' || data === null) return <span>{String(data)}</span>;

    return (
        <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-800 w-full">
            {Object.entries(data).map(([key, val]) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-1.5 border-b border-gray-100 last:border-0 last:pb-0">
                        <span className="font-semibold text-gray-500 w-[130px] shrink-0 text-xs uppercase tracking-wider mt-0.5">{formattedKey}</span>
                        <span className="font-medium break-words flex-1">
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

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
    const [hasStarted, setHasStarted] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);
    
    const uploadSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedData = sessionStorage.getItem('candidateData');
        if (storedData) {
            setCandidateData(JSON.parse(storedData));
        }
    }, []);

    const handleStartSetup = () => {
        setHasStarted(true);
        setTimeout(() => {
            uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

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

                setUploadStep('Extracting text from your CV…');

                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('jobId', candidateData.jobId);

                await new Promise(r => setTimeout(r, 300));
                setUploadStep('Uploading to secure storage…');

                const response = await API.uploadCv(formData);

                setUploadStep('AI analysis complete.');

                sessionStorage.setItem('candidateId', response.candidateId);

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
        window.location.href = '/candidate/interview';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-x-hidden">
            {/* Minimal Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center">
                    <EquiHireLogo className="mr-3 h-8 w-auto text-gray-900" />
                    <span className="font-semibold text-lg tracking-tight text-gray-900">EquiHire</span>
                </div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Candidate Portal
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start py-12 px-6 lg:px-12 z-0">
                <div className="w-full max-w-6xl space-y-20">
                    
                    {/* Welcome Header */}
                    <div className="text-center space-y-5 animate-in slide-in-from-top-4 duration-700 max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-900 border border-gray-800 shadow-sm mb-2">
                            <ShieldCheck className="h-10 w-10 text-[#FF7300]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                            Welcome to your Assessment{candidateData?.name && `, ${candidateData.name}`}
                        </h1>
                        {candidateData?.jobTitle && (
                            <p className="text-xl font-bold text-[#FF7300] bg-[#FF7300]/10 inline-block px-5 py-2 rounded-full border border-[#FF7300]/20">
                                Position: {candidateData.jobTitle}
                            </p>
                        )}
                        <p className="text-lg text-gray-500">
                            EquiHire ensures a perfectly fair and unbiased process. Your identity will be protected until the final evaluation stage.
                        </p>
                    </div>

                    {/* Section 1: Information (Image Left, Content Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center animate-in fade-in duration-1000 delay-150 relative">
                        {/* Left Side: Image */}
                        <div className="order-2 lg:order-1 relative flex justify-center p-8 group">
                            <div className="absolute inset-0 bg-blue-100/50 rounded-full opacity-40 blur-3xl -z-10 scale-125 transition-transform duration-700 group-hover:scale-150" />
                            <img src={FillOutImage} alt="Instructions" className="w-full max-w-md xl:max-w-lg h-auto hover:-translate-y-2 transition-transform duration-700 ease-out drop-shadow-xl" />
                        </div>

                        {/* Right Side: Content */}
                        <div className="order-1 lg:order-2 space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-[#FF7300] font-black text-lg mb-2 shadow-sm">1</div>
                                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Integrity & Compliance</h2>
                                <p className="text-gray-500 text-lg">We adhere to the highest standards of data protection and academic integrity.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Card className="border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 space-y-3">
                                        <div className="bg-gray-100 w-10 h-10 flex items-center justify-center rounded-xl">
                                            <EyeOff className="w-5 h-5 text-gray-900" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm">Strict Anonymization</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Personally Identifiable Information (PII) is removed thoroughly prior to evaluation, ensuring an unbiased selection process.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 space-y-3">
                                        <div className="bg-gray-100 w-10 h-10 flex items-center justify-center rounded-xl">
                                            <ShieldCheck className="w-5 h-5 text-gray-900" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm">Right to Erasure</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Telemetry is completely encrypted. Records are automatically purged upon request or destroyed securely.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 space-y-3">
                                        <div className="bg-gray-100 w-10 h-10 flex items-center justify-center rounded-xl">
                                            <Ban className="w-5 h-5 text-gray-900" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm">Anti-Cheat Protocols</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            We monitor full-screen focus, active tabs, and clipboard to deter unpermitted assistance and copy/paste solutions.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 space-y-3">
                                        <div className="bg-gray-900 w-10 h-10 flex items-center justify-center rounded-xl">
                                            <Lightbulb className="w-5 h-5 text-[#FF7300]" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm">Pre-flight Checklist</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Have your CV ready. Once the assessment timer begins, assessing cannot be halted or paused in any case.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border-2 border-transparent focus-within:border-[#FF7300] shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                                    <div className="flex items-start gap-4">
                                        <div className="pt-1">
                                            <input 
                                                type="checkbox" 
                                                id="agreeCheckbox" 
                                                checked={hasAgreed}
                                                onChange={(e) => setHasAgreed(e.target.checked)}
                                                className="w-5 h-5 accent-[#FF7300] rounded cursor-pointer ring-offset-2 focus:ring-2 focus:ring-[#FF7300] transition-all"
                                                disabled={hasStarted}
                                            />
                                        </div>
                                        <label htmlFor="agreeCheckbox" className={`text-sm sm:text-base font-bold select-none leading-tight block ${hasStarted ? 'text-gray-400 cursor-default' : 'text-gray-900 cursor-pointer'}`}>
                                            I consent to data processing (GDPR Art. 7) & strict proctoring terms
                                            <span className={`block text-xs sm:text-sm font-normal mt-1.5 ${hasStarted ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Acknowledge to unlock your document upload and secure assessment entry.
                                            </span>
                                        </label>
                                    </div>
                                    {!hasStarted ? (
                                        <Button 
                                            onClick={handleStartSetup}
                                            disabled={!hasAgreed}
                                            className="w-full sm:w-auto bg-[#FF7300] hover:bg-[#E56700] text-white font-bold h-12 px-6 rounded-xl shadow-md whitespace-nowrap hover:-translate-y-0.5 transition-all text-sm"
                                        >
                                            Proceed <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <div className="flex items-center text-green-700 text-sm font-bold bg-green-50 px-4 py-2.5 rounded-xl border border-green-200">
                                            <CheckCircle className="w-4 h-4 mr-2" /> Acknowledged
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conditional Section 2 */}
                    {hasStarted && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Divider Line */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-10" />

                            {/* Section 2: Action (Content Left, Image Right) */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative" ref={uploadSectionRef}>
                                {/* Left Side: Content / Process */}
                                <div className="order-2 lg:order-1 space-y-8 relative z-10">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-[#FF7300] font-black text-lg mb-2 shadow-sm">2</div>
                                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Document Upload & Setup</h2>
                                        <p className="text-gray-500 text-lg">Securely upload your CV for AI ingestion, review your extracted profile, then join the session.</p>
                                    </div>

                                    <Card className="shadow-2xl shadow-gray-200/50 border-gray-100 bg-white w-full border-t-4 border-t-gray-900 rounded-3xl overflow-hidden">
                                        <CardContent className="p-8 space-y-8">
                                            {/* Upload Area */}
                                            <div className="space-y-5">
                                                <h3 className="font-bold text-gray-900 flex items-center text-lg">
                                                    <BookOpen className="w-5 h-5 mr-3 text-gray-400" />
                                                    1. Provide Document
                                                </h3>

                                                {!uploadComplete ? (
                                                    <>
                                                        <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-8 text-center hover:bg-white hover:border-[#FF7300] transition-all relative group overflow-hidden">
                                                            <Input
                                                                type="file"
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                onChange={handleFileChange}
                                                                accept=".pdf"
                                                                disabled={isUploading}
                                                            />
                                                            <div className="flex flex-col items-center justify-center pointer-events-none">
                                                                <div className={`p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform ${isUploading ? 'bg-[#FF7300]/10 text-[#FF7300] animate-pulse' : 'bg-white shadow-sm border border-gray-100 text-gray-400 group-hover:text-gray-900 group-hover:border-gray-300'}`}>
                                                                    {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
                                                                </div>
                                                                <p className="text-base font-bold text-gray-900 mb-1.5">
                                                                    {isUploading
                                                                        ? uploadStep || 'Uploading securely…'
                                                                        : 'Click to select or drag PDF file'}
                                                                </p>
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Maximum 10 MB limit</p>
                                                            </div>
                                                        </div>

                                                        {uploadError && (
                                                            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm animate-in slide-in-from-top-2">
                                                                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
                                                                <span className="font-medium text-sm text-red-900">{uploadError}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="bg-white border-2 border-green-100 rounded-2xl p-6 space-y-5 shadow-sm animate-in zoom-in-95">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center">
                                                                <div className="bg-green-50 p-3 rounded-xl mr-4 border border-green-100 text-green-600 shadow-sm">
                                                                    <FileText className="h-7 w-7" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-base font-bold text-gray-900 truncate max-w-[200px] sm:max-w-[250px]">{file?.name ?? 'Your CV file'}</p>
                                                                    <p className="text-xs font-bold uppercase tracking-wider text-green-600 mt-1 flex items-center">
                                                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                                        Parsing Complete
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-5 border-t border-gray-100">
                                                            <Button
                                                                variant="outline"
                                                                className="w-full bg-gray-50 border-gray-200 text-gray-900 hover:bg-white hover:text-black font-bold h-11 rounded-xl shadow-sm"
                                                                onClick={() => setPreviewOpen(true)}
                                                                disabled={!parsedCv}
                                                            >
                                                                Review Extracted Anonymized Profile
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Area */}
                                            <div className={`space-y-5 transition-all duration-700 ${uploadComplete ? 'opacity-100 pt-8 border-t border-gray-100' : 'opacity-40 grayscale-[0.5] pointer-events-none'}`}>
                                                <h3 className="font-bold text-gray-900 flex items-center text-lg">
                                                    <Clock className="w-5 h-5 mr-3 text-gray-400" />
                                                    2. Ready to Begin
                                                </h3>
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                                    <p className="text-sm font-medium text-gray-600 max-w-xs">
                                                        Ensure complete silence and focus. You are entering a secure, monitored environment.
                                                    </p>
                                                    <Button
                                                        className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white h-12 px-6 sm:px-8 rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group whitespace-nowrap"
                                                        onClick={handleJoin}
                                                        disabled={!uploadComplete}
                                                    >
                                                        Enter Assessment <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Side: Image */}
                                <div className="order-1 lg:order-2 relative flex justify-center p-8 group z-0">
                                   <div className="absolute inset-0 bg-orange-50/80 rounded-[100px] opacity-60 blur-3xl scale-110 transition-transform duration-1000 group-hover:scale-125" />
                                   <img src={OnlineTestImage} alt="Online Test" className="w-full max-w-md xl:max-w-lg h-auto drop-shadow-2xl hover:-translate-y-2 transition-transform duration-700 ease-out" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Extracted Profile Dialog */}
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-white rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                            <DialogHeader className="p-6 md:p-8 pb-4 border-b border-gray-100 bg-gray-50/50">
                                <DialogTitle className="text-2xl font-extrabold flex items-center text-gray-900 tracking-tight">
                                    <ShieldCheck className="w-7 h-7 mr-3 text-[#FF7300] drop-shadow-sm" />
                                    Extracted Anonymous Profile
                                </DialogTitle>
                                <DialogDescription className="text-base mt-3 text-gray-600 font-medium">
                                    We have parsed and anonymized your document correctly. This ensures an entirely unbiased evaluation adhering to platform integrity standards.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-6 md:p-8 space-y-8 max-h-[60vh] overflow-y-auto fancy-scrollbar">
                                {parsedCv ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <Card className="bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                                                <CardContent className="p-5">
                                                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                                        <Clock className="w-4 h-4 mr-2 text-[#FF7300]" /> Experience Level
                                                    </h4>
                                                    <p className="text-xl font-extrabold text-gray-900 capitalize">
                                                        {parsedCv.experienceLevel || <span className="text-gray-400 italic font-medium">Not explicitly stated</span>}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                                                <CardContent className="p-5">
                                                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                                                        <Lightbulb className="w-4 h-4 mr-2 text-[#FF7300]" /> Core Skills Discovered
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {parsedCv.detectedStack && parsedCv.detectedStack.length > 0 ? (
                                                            parsedCv.detectedStack.map((skill: string) => (
                                                                <span
                                                                    key={skill}
                                                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 shadow-sm"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 text-sm italic font-medium">No strict technical tags detected.</span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="space-y-5">
                                            {parsedCv.sections && Object.keys(parsedCv.sections).length > 0 ? (
                                                Object.entries(parsedCv.sections).map(([section, value]) => {
                                                    const normalizedTitle = section
                                                        .replace(/_/g, ' ')
                                                        .replace(/\b\w/g, (c) => c.toUpperCase());
                                                        
                                                    const isArray = Array.isArray(value);

                                                    return (
                                                        <Card key={section} className="shadow-sm border-gray-200 overflow-hidden relative group bg-white">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-200 group-hover:bg-[#FF7300] transition-colors" />
                                                            <CardContent className="p-6 pl-8">
                                                                <h4 className="text-sm font-extrabold uppercase tracking-widest text-gray-900 mb-5">
                                                                    {normalizedTitle}
                                                                </h4>
                                                                {isArray ? (
                                                                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-gray-100 before:via-gray-300 before:to-gray-100">
                                                                        {Array.isArray(value) && value.map((itm, idx) => (
                                                                            <div key={idx} className="relative flex items-start gap-5 text-sm text-gray-800 bg-gray-50 border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all z-10 w-full">
                                                                                <div className="w-4 h-4 rounded-full bg-[#FF7300] border-[4px] border-white absolute -left-[30px] top-5 ring-1 ring-gray-300 z-10 hidden md:block" />
                                                                                <div className="w-full">
                                                                                    {typeof itm === 'string' ? (
                                                                                        <p className="font-semibold whitespace-pre-wrap leading-relaxed max-w-full break-words">{itm}</p>
                                                                                    ) : (
                                                                                        <PrettyJsonObject data={itm} />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 p-5 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                                                                        {typeof value === 'object' ? <PrettyJsonObject data={value} /> : value || <span className="text-gray-400 italic">Component abstract.</span>}
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center p-10 bg-gray-50 rounded-3xl border-2 border-gray-200 border-dashed">
                                                    <p className="text-lg font-bold text-gray-500">No structured timeline sections explicitly extracted.</p>
                                                    <p className="text-sm text-gray-400 mt-2">The AI primarily aggregated core skills to match the criteria.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-16">
                                        <Loader2 className="w-12 h-12 text-[#FF7300] animate-spin mb-6" />
                                        <p className="text-gray-600 font-bold tracking-wide animate-pulse text-lg">Deconstructing unstructured data...</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="p-6 md:p-8 pt-5 border-t border-gray-100 bg-gray-50/50">
                                <Button className="w-full sm:w-auto h-12 px-8 bg-gray-900 hover:bg-black font-bold text-white tracking-wide rounded-xl shadow-lg hover:shadow-xl transition-all" onClick={() => setPreviewOpen(false)}>
                                    Looks Perfect, Continue
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </main>
            
            <footer className="mt-auto border-t border-gray-200 bg-white py-8">
                <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                    Trusted Zero-Trust Architecture • Powered by EquiHire AI Framework
                </p>
            </footer>
        </div>
    );
}

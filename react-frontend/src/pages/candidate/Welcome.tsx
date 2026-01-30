import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { EquiHireLogo } from "@/components/ui/Icons";

export default function CandidateWelcome() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Simulate upload
            setIsUploading(true);
            setTimeout(() => {
                setIsUploading(false);
                setUploadComplete(true);
            }, 1500);
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
                    <EquiHireLogo className="mr-3 w-8 h-8" />
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
                        <h1 className="text-3xl font-bold text-gray-900">Welcome to your Blind Interview</h1>
                        <p className="mt-2 text-gray-500">
                            EquiHire ensures a fair process. Your voice will be masked and your identity protected until the final stage.
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
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
                                        <Input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                            accept=".pdf,.docx"
                                        />
                                        <div className="flex flex-col items-center justify-center pointer-events-none">
                                            <Upload className={`h-10 w-10 text-gray-400 mb-3 ${isUploading ? 'animate-bounce' : ''}`} />
                                            <p className="text-sm font-medium text-gray-900">
                                                {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">PDF or DOCX up to 10MB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                                <FileText className="h-5 w-5 text-green-700" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-green-800">{file?.name}</p>
                                                <p className="text-xs text-green-600">Upload complete</p>
                                            </div>
                                        </div>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                )}
                            </div>

                            <div className={`space-y-4 transition-opacity duration-500 ${uploadComplete ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <h3 className="font-semibold text-gray-900 flex items-center">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs mr-3">2</span>
                                    Join Session
                                </h3>
                                <p className="text-sm text-gray-500 ml-9">
                                    The interview will be audio-only. Please ensure you are in a quiet environment.
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

                    <p className="text-center text-xs text-gray-400">
                        Powered by EquiHire Core • Privacy Protected
                    </p>
                </div>
            </main>
        </div>
    );
}

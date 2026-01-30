import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Mail, Calendar, Briefcase, FileText, Upload, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function InterviewScheduler() {
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
    const [jobRole, setJobRole] = useState("");
    const [candidateEmail, setCandidateEmail] = useState("");
    const [dateTime, setDateTime] = useState("");
    const [bulkText, setBulkText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Mock History Data
    const [history, setHistory] = useState([
        { id: 1, email: "sarah.j@gmail.com", role: "Senior Backend Eng", time: "2 mins ago", status: "sent" },
        { id: 2, email: "david.c@protonmail.com", role: "Frontend Dev", time: "1 hour ago", status: "delivered" },
        { id: 3, email: "alex.m@yahoo.com", role: "DevOps", time: "Yesterday", status: "opened" },
    ]);

    const handleInvite = async () => {
        if (activeTab === 'single' && (!jobRole || !candidateEmail || !dateTime)) {
            alert("Please fill in all fields.");
            return;
        }
        if (activeTab === 'bulk' && !bulkText) {
            alert("Please paste email list.");
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            const newEntry = activeTab === 'single'
                ? { id: Date.now(), email: candidateEmail, role: jobRole, time: "Just now", status: "sent" }
                : { id: Date.now(), email: "Bulk Batch #102", role: "Multiple", time: "Just now", status: "processing" };

            setHistory([newEntry, ...history]);
            alert(`Invitation(s) sent!`);

            // Reset fields
            setJobRole("");
            setCandidateEmail("");
            setDateTime("");
            setBulkText("");
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
                    <p className="text-gray-500">Invite candidates to blind interview sessions.</p>
                </div>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Single Invite
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Bulk Upload
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-200">
                    <CardHeader className="pb-4 border-b border-gray-50">
                        <CardTitle className="flex items-center">
                            {activeTab === 'single' ? (
                                <>
                                    <Plus className="mr-2 h-5 w-5 text-[#FF7300]" /> New Session Details
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-5 w-5 text-[#FF7300]" /> Bulk Import
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {activeTab === 'single' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center">
                                        <Briefcase className="mr-2 h-3 w-3" /> Job Role
                                    </label>
                                    <Input
                                        placeholder="e.g. Senior Backend Engineer"
                                        className="border-gray-200 focus:border-[#FF7300] focus:ring-[#FF7300]"
                                        value={jobRole}
                                        onChange={(e) => setJobRole(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center">
                                        <Calendar className="mr-2 h-3 w-3" /> Date & Time
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        className="border-gray-200 focus:border-[#FF7300] focus:ring-[#FF7300]"
                                        value={dateTime}
                                        onChange={(e) => setDateTime(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center">
                                        <Mail className="mr-2 h-3 w-3" /> Candidate Email
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="candidate@example.com"
                                        className="border-gray-200 focus:border-[#FF7300] focus:ring-[#FF7300]"
                                        value={candidateEmail}
                                        onChange={(e) => setCandidateEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100">
                                    <p className="font-semibold mb-1">Format Guide</p>
                                    <p>Paste one entry per line: <code>email, role, YYYY-MM-DD HH:MM</code></p>
                                </div>
                                <textarea
                                    className="w-full h-48 p-4 rounded-md border border-gray-200 focus:border-[#FF7300] focus:ring-[#FF7300] font-mono text-sm"
                                    placeholder={`sarah@example.com, Backend Dev, 2024-02-10 14:00\njohn@example.com, Frontend Dev, 2024-02-11 10:00`}
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button
                                className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
                                onClick={handleInvite}
                                disabled={isLoading}
                            >
                                {isLoading ? "Sending..." : "Send Invitations"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* History Side Panel */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-gray-200 h-full">
                        <CardHeader className="pb-2 border-b border-gray-50">
                            <CardTitle className="text-sm font-medium text-gray-500">Invitation History</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 max-h-[500px] overflow-auto">
                            <div className="space-y-4">
                                {history.map((record) => (
                                    <div key={record.id} className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={record.email}>{record.email}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${record.status === 'opened' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-200 text-gray-600'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex justify-between">
                                            <span>{record.role}</span>
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {record.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

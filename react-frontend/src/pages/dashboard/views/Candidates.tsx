import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Unlock, Clock, FileText, ChevronRight, XCircle } from "lucide-react";

// Mock Data
const MOCK_CANDIDATES = [
    { id: 1, role: "Senior Backend Engineer", score: 85, status: "pending", date: "2023-10-25", seen: false, stage: "Interview Completed" },
    { id: 2, role: "Frontend Developer", score: 92, status: "accepted", name: "Sarah Jenkins", date: "2023-10-24", seen: true, stage: "Offer Sent" },
    { id: 3, role: "DevOps Engineer", score: 64, status: "rejected", date: "2023-10-23", seen: true, stage: "Screening" },
    { id: 4, role: "Senior Backend Engineer", score: 78, status: "pending", date: "2023-10-22", seen: false, stage: "Interview Completed" },
    { id: 5, role: "Product Manager", score: 88, status: "accepted", name: "David Chen", date: "2023-10-20", seen: true, stage: "Hired" },
    { id: 6, role: "QA Engineer", score: 0, status: "scheduled", date: "2023-10-26", seen: false, stage: "Scheduled" },
];

export default function CandidateManager() {
    const [statusFilter, setStatusFilter] = useState("all");
    const [activityFilter, setActivityFilter] = useState("all"); // all, seen, unseen
    const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

    const filteredCandidates = candidates.filter(c => {
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        const matchesActivity = activityFilter === "all" || (activityFilter === "seen" ? c.seen : !c.seen);
        return matchesStatus && matchesActivity;
    });

    const markAsSeen = (id: number) => {
        setCandidates(candidates.map(c => c.id === id ? { ...c, seen: true } : c));
    };

    const handleViewDetails = (candidate: any) => {
        markAsSeen(candidate.id);
        setSelectedCandidate(candidate);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'text-green-600 bg-green-50 border-green-200';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
            case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-amber-600 bg-amber-50 border-amber-200';
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* List Side */}
            <div className={`flex-1 flex flex-col space-y-4 transition-all ${selectedCandidate ? 'w-1/2' : 'w-full'}`}>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
                        <p className="text-gray-500">Manage hiring pipeline.</p>
                    </div>
                    <div className="flex space-x-2">
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
                            <button onClick={() => setActivityFilter('all')} className={`px-3 py-1 text-xs rounded ${activityFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}>All</button>
                            <button onClick={() => setActivityFilter('unseen')} className={`px-3 py-1 text-xs rounded ${activityFilter === 'unseen' ? 'bg-white shadow font-bold text-blue-600' : 'text-gray-500'}`}>Unseen</button>
                        </div>
                        <select
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-[#FF7300] focus:border-[#FF7300] block p-2"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                    </div>
                </div>

                <Card className="flex-1 overflow-hidden border-gray-200 shadow-sm flex flex-col">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Candidate</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Score</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCandidates.map((c) => (
                                    <tr
                                        key={c.id}
                                        className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${selectedCandidate?.id === c.id ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => handleViewDetails(c)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${c.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {c.status === 'accepted' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`${c.status === 'accepted' ? 'text-gray-900' : 'text-gray-500 font-mono tracking-wider'} ${!c.seen ? 'font-bold text-gray-900' : ''}`}>
                                                        {c.status === 'accepted' ? c.name : `CANDIDATE #${c.id.toString().padStart(4, '0')}`}
                                                    </span>
                                                    {!c.seen && <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">New Update</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{c.role}</td>
                                        <td className="px-6 py-4">
                                            {c.score > 0 ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.score >= 80 ? 'bg-green-100 text-green-800' :
                                                    c.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {c.score}/100
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs text-center">—</span>
                                            )}

                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
                                                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-400">
                                            <ChevronRight className="w-4 h-4" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Detail Sheet/Panel */}
            {selectedCandidate && (
                <div className="w-[400px] flex flex-col space-y-4 animate-in slide-in-from-right-10 duration-300">
                    <div className="flex justify-between items-center h-8"> {/* Spacer to align with title */}
                        <h3 className="font-bold text-gray-900">Candidate Details</h3>
                        <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-gray-900">
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>

                    <Card className="flex-1 shadow-lg border-gray-200 overflow-auto">
                        <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
                            <div className="flex flex-col items-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm ${selectedCandidate.status === 'accepted' ? 'bg-white' : 'bg-gray-200'}`}>
                                    {selectedCandidate.status === 'accepted' ? (
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate.name}`} alt="Avatar" className="w-full h-full rounded-full" />
                                    ) : (
                                        <Lock className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <CardTitle className="text-center">
                                    {selectedCandidate.status === 'accepted' ? selectedCandidate.name : `CANDIDATE #${selectedCandidate.id.toString().padStart(4, '0')}`}
                                </CardTitle>
                                <CardDescription className="text-center font-mono text-xs mt-1 text-gray-500">
                                    ID: {selectedCandidate.id} • {selectedCandidate.role}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Score Card */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold uppercase text-gray-500">AI Compatibility Score</span>
                                    {selectedCandidate.score > 0 && <span className="font-bold text-lg text-gray-900">{selectedCandidate.score}%</span>}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-[#FF7300] h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${selectedCandidate.score}%` }}
                                    ></div>
                                </div>
                                {selectedCandidate.score === 0 && <p className="text-xs text-gray-400 mt-2 italic">Interview pending or not graded.</p>}
                            </div>

                            {/* Lifecycle Stage */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-gray-500" /> Timeline
                                </h4>
                                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-2 ring-gray-50"></div>
                                        <p className="text-sm font-medium text-gray-900">Application Received</p>
                                        <p className="text-xs text-gray-500">{selectedCandidate.date}</p>
                                    </div>
                                    <div className="relative">
                                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-50 ${selectedCandidate.score > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <p className="text-sm font-medium text-gray-900">Interview Session</p>
                                        <p className="text-xs text-gray-500">{selectedCandidate.score > 0 ? "Completed" : "Scheduled"}</p>
                                    </div>
                                    <div className="relative">
                                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-50 ${selectedCandidate.status !== 'pending' && selectedCandidate.status !== 'scheduled' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <p className="text-sm font-medium text-gray-900">Final Decision</p>
                                        <p className="text-xs text-gray-500">
                                            {selectedCandidate.status === 'pending' ? 'Pending Review' :
                                                selectedCandidate.status === 'accepted' ? 'Accepted' :
                                                    selectedCandidate.status === 'rejected' ? 'Rejected' : 'Pending'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <Button className="w-full" variant="outline">
                                    <FileText className="w-4 h-4 mr-2" /> View Full Transcript
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

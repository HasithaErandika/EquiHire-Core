import { useEffect, useState } from 'react';
import { useAuthContext } from "@asgardeo/auth-react";
import { API } from "@/lib/api";
import InviteCandidate from '../InviteCandidate';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail } from "lucide-react";

export default function InterviewScheduler() {
    const { state } = useAuthContext();
    const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (state.sub) {
            API.getInvitations(state.sub)
                .then((data: any[]) => {
                    const formatted = data.map(record => ({
                        id: record.id,
                        email: record.candidate_email,
                        role: record.job_title,
                        time: new Date(record.created_at).toLocaleDateString(),
                        status: record.status
                    }));
                    setHistory(formatted);
                })
                .catch(err => console.error("Failed to load history", err));
        }
    }, [state.sub]);

    useEffect(() => {
        const fetchOrg = async () => {
            if (state.sub) {
                try {
                    const data = await API.getOrganization(state.sub);
                    if (data) {
                        setOrganization(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch organization", error);
                }
            }
        };
        fetchOrg();
    }, [state.sub]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
                <p className="text-gray-500">Send magic link invitations to candidates for blind interview sessions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="col-span-1 lg:col-span-2">
                    <InviteCandidate organizationId={organization?.id} />
                </div>

                <div className="space-y-6">
                    <Card className="shadow-md border-gray-100 h-full border-t-4 border-t-[#FF7300]">
                        <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#FF7300]" />
                                Recent Invitations
                            </CardTitle>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{history.length} sent</span>
                        </CardHeader>
                        <CardContent className="pt-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center opacity-60">
                                    <div className="bg-gray-100 p-3 rounded-full mb-3">
                                        <Mail className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">No invitations sent yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Sent invites will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((record) => (
                                        <div key={record.id} className="group flex flex-col p-3 rounded-xl bg-white hover:bg-orange-50/50 transition-all border border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-md">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-gray-900 text-sm truncate max-w-[180px] flex items-center" title={record.email}>
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-[10px] flex items-center justify-center mr-2 text-gray-600 font-bold">
                                                        {record.email[0].toUpperCase()}
                                                    </div>
                                                    {record.email}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-sm ${record.status === 'opened' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        record.status === 'delivered' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 flex justify-between items-center pl-8">
                                                <span className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">{record.role}</span>
                                                <span className="flex items-center text-gray-400"><Clock className="w-3 h-3 mr-1" /> {record.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

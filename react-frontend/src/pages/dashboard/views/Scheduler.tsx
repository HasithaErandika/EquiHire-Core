import { useEffect, useState } from 'react';
import { useAuthContext } from "@asgardeo/auth-react";
import InviteCandidate from '../InviteCandidate';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail } from "lucide-react";

export default function InterviewScheduler() {
    const { state } = useAuthContext();
    const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null);
    const [history, setHistory] = useState([
        { id: 1, email: "sarah.j@gmail.com", role: "Senior Backend Eng", time: "2 mins ago", status: "sent" },
        { id: 2, email: "david.c@protonmail.com", role: "Frontend Dev", time: "1 hour ago", status: "delivered" },
        { id: 3, email: "alex.m@yahoo.com", role: "DevOps", time: "Yesterday", status: "opened" },
    ]);

    useEffect(() => {
        const fetchOrg = async () => {
            if (state.sub) {
                try {
                    const response = await fetch(`http://localhost:9092/api/me/organization?userId=${state.sub}`);
                    if (response.ok) {
                        const data = await response.json();
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
                                            <span className="font-medium text-gray-900 text-sm truncate max-w-[150px] flex items-center" title={record.email}>
                                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                                {record.email}
                                            </span>
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

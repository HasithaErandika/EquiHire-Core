import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {  XCircle, RefreshCw, Shield, Brain, Database, Cloud, Globe, Lock, Activity } from "lucide-react";

interface IntegrationCardProps {
    title: string;
    description: string;
    icon: any;
    status: 'connected' | 'disconnected' | 'syncing';
    category: string;
    metrics?: { label: string; value: string }[];
}

const IntegrationCard = ({ title, description, icon: Icon, status, category, metrics }: IntegrationCardProps) => (
    <Card className="shadow-sm border-gray-200 hover:shadow-md transition-all group overflow-hidden">
        <div className={`h-1.5 w-full ${status === 'connected' ? 'bg-[#FF7300]' : 'bg-gray-200'}`} />
        <CardHeader className="pb-3 pt-5">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${status === 'connected' ? 'bg-orange-50 text-[#FF7300]' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 mt-0.5">{description}</CardDescription>
                    </div>
                </div>
                {status === 'connected' ? (
                    <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-green-100">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span>Active</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-1 bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                        <XCircle className="w-3 h-3" />
                        <span>Inactive</span>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent>
            {metrics && (
                <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                    {metrics.map((m, i) => (
                        <div key={i} className="text-center">
                            <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">{m.label}</p>
                            <p className="text-xs font-mono font-medium text-gray-700">{m.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{category}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-[#FF7300] hover:bg-orange-50">
                    <RefreshCw className="mr-2 h-3 w-3" /> {status === 'connected' ? 'Sync' : 'Connect'}
                </Button>
            </div>
        </CardContent>
    </Card>
);

export default function Integrations() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">System Integrations</h2>
                <p className="text-gray-500">Manage connections to external services, AI models, and infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Identity & Security */}
                <IntegrationCard
                    title="WSO2 Asgardeo"
                    description="Customer Identity & Access Management (CIAM)"
                    icon={Shield}
                    status="connected"
                    category="Identity"
                    metrics={[
                        { label: "Users", value: "Active" },
                        { label: "Latency", value: "45ms" }
                    ]}
                />

                {/* AI & Intelligence */}
                <IntegrationCard
                    title="Google Gemini 1.5"
                    description="Context extraction & PII redaction engine"
                    icon={Brain}
                    status="connected"
                    category="AI Model"
                    metrics={[
                        { label: "Model", value: "Flash-001" },
                        { label: "Status", value: "Operational" }
                    ]}
                />

                {/* Database */}
                <IntegrationCard
                    title="Supabase"
                    description="PostgreSQL database & realtime subscriptions"
                    icon={Database}
                    status="connected"
                    category="Database"
                    metrics={[
                        { label: "Region", value: "us-east-1" },
                        { label: "Connections", value: "12/50" }
                    ]}
                />

                {/* Storage */}
                <IntegrationCard
                    title="Cloudflare R2"
                    description="Object storage for CVs and session artifacts"
                    icon={Cloud}
                    status="connected"
                    category="Storage"
                    metrics={[
                        { label: "Objects", value: "1.2k" },
                        { label: "Bandwidth", value: "Healthy" }
                    ]}
                />

                {/* Email Service */}
                <IntegrationCard
                    title="SMTP / Resend"
                    description="Transactional email delivery for invitations"
                    icon={Globe}
                    status="connected"
                    category="Communication"
                    metrics={[
                        { label: "Delivery", value: "99.8%" },
                        { label: "Quota", value: "Remaining" }
                    ]}
                />
            </div>

            <div className="rounded-lg bg-orange-50 border border-orange-100 p-4 mt-8 flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#FF7300] mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-gray-900">Security Note</h4>
                    <p className="text-xs text-gray-600 mt-1">
                        All integrations are encrypted at rest and in transit. API keys are managed via the secure environment configuration.
                        To rotate keys, please access the server console.
                    </p>
                </div>
            </div>
        </div>
    );
}

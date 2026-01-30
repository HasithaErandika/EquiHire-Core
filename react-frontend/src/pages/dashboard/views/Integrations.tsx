import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw, Server, Shield, Zap, Globe } from "lucide-react";

const IntegrationCard = ({ title, description, icon: Icon, status, lastSync }: any) => (
    <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
                        <CardDescription className="text-xs text-gray-500">{description}</CardDescription>
                    </div>
                </div>
                {status === 'active' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" /> Connected
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" /> Disconnected
                    </span>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>Last Synced: {lastSync}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                    <RefreshCw className="mr-2 h-3 w-3" /> Reconnect
                </Button>
            </div>
        </CardContent>
    </Card>
);

export default function Integrations() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">System Integrations</h2>
                <p className="text-gray-500">Manage connections to external services and AI models.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Communication */}
                <div className="col-span-full">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Communication Infrastructure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <IntegrationCard
                            title="Twilio Voice"
                            description="Real-time audio streaming gateway"
                            icon={Globe}
                            status="active"
                            lastSync="Just now"
                        />
                        <IntegrationCard
                            title="SendGrid Email"
                            description="Transactional email delivery"
                            icon={Server}
                            status="active"
                            lastSync="2 mins ago"
                        />
                    </div>
                </div>

                {/* Identity & Security */}
                <div className="col-span-full">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Identity & Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <IntegrationCard
                            title="WSO2 Asgardeo"
                            description="CIAM and authentication provider"
                            icon={Shield}
                            status="active"
                            lastSync="1 hour ago"
                        />
                        <IntegrationCard
                            title="Redis Cache"
                            description="Session state management"
                            icon={Server}
                            status="active"
                            lastSync="30 secs ago"
                        />
                    </div>
                </div>

                {/* Artificial Intelligence */}
                <div className="col-span-full">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Artificial Intelligence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <IntegrationCard
                            title="OpenAI Whisper"
                            description="Speech-to-text transcription engine"
                            icon={Zap}
                            status="active"
                            lastSync="Ready"
                        />
                        <IntegrationCard
                            title="BERT Redaction"
                            description="PII detection and removal model"
                            icon={Shield}
                            status="active"
                            lastSync="Loaded"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

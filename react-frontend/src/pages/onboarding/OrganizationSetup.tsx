import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Rocket, Code2, Cpu, Globe } from "lucide-react";
import { EquiHireLogo } from "@/components/ui/Icons";

interface OrganizationSetupProps {
    onComplete: () => void;
}

export default function OrganizationSetup({ onComplete }: OrganizationSetupProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [orgName, setOrgName] = useState("");
    const [industry, setIndustry] = useState("");
    const [size, setSize] = useState("");

    const handleSave = () => {
        if (!orgName || !industry || !size) return;

        setIsLoading(true);
        // Simulate API/Supabase call
        setTimeout(() => {
            setIsLoading(false);
            onComplete();
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                    <EquiHireLogo className="w-12 h-12" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome to EquiHire</h1>
                <p className="text-gray-500 mt-2">Let's set up your organization's workspace.</p>
            </div>

            <Card className="w-full max-w-md shadow-xl border-gray-200">
                <CardHeader>
                    <CardTitle>Create Organization</CardTitle>
                    <CardDescription>Enter details about your tech company.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Organization Name</label>
                        <Input
                            placeholder="e.g. Acme AI, TechCorp"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Primary Industry</label>
                        <Select onValueChange={setIndustry}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select focus area" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="software_engineering">
                                    <div className="flex items-center"><Code2 className="w-4 h-4 mr-2" /> Software Engineering</div>
                                </SelectItem>
                                <SelectItem value="ai_ml">
                                    <div className="flex items-center"><Cpu className="w-4 h-4 mr-2" /> Artificial Intelligence / ML</div>
                                </SelectItem>
                                <SelectItem value="data_science">
                                    <div className="flex items-center"><BarChartIcon className="w-4 h-4 mr-2" /> Data Science</div>
                                </SelectItem>
                                <SelectItem value="it_services">
                                    <div className="flex items-center"><Globe className="w-4 h-4 mr-2" /> IT Services & Consulting</div>
                                </SelectItem>
                                <SelectItem value="cyber_security">
                                    <div className="flex items-center"><ShieldIcon className="w-4 h-4 mr-2" /> Cyber Security</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Company Size</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['1-10', '11-50', '50+'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSize(s)}
                                    className={`border rounded-md py-2 text-sm transition-colors focus:outline-none ${size === s ? 'border-black bg-gray-900 text-white' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="hiring_manager" />
                        <label
                            htmlFor="hiring_manager"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600"
                        >
                            I am the primary Hiring Manager
                        </label>
                    </div>

                    <Button
                        className="w-full bg-[#FF7300] hover:bg-[#E56700] text-white"
                        onClick={handleSave}
                        disabled={isLoading || !orgName || !industry || !size}
                    >
                        {isLoading ? (
                            <>
                                <Rocket className="mr-2 h-4 w-4 animate-spin" /> Setting up Dashboard...
                            </>
                        ) : (
                            <>Create Workspace</>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

// Simple Icons for Select Items
function BarChartIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="20" y2="10" />
            <line x1="18" x2="18" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="16" />
        </svg>
    )
}

function ShieldIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    )
}

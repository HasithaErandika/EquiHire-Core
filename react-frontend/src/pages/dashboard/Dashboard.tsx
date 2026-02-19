import { useState, useEffect } from 'react';
import { useAuthContext } from "@asgardeo/auth-react";
import { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EquiHireLogo, DashboardIcon, SessionIcon, IntegrationIcon } from "@/components/ui/Icons";
import { LogOut, Bell, Settings, Search, Check, Building2, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";

// Import Pages
import InterviewScheduler from './views/Scheduler';
import CandidateManager from './views/Candidates';
import Integrations from './views/Integrations';
import JobsManager from './views/Jobs';
import QuestionsManager from './views/Questions';

export default function Dashboard() {
    const { state, signOut } = useAuthContext();
    const [organization, setOrganization] = useState<{ id: string; name: string; industry: string; size: string } | null>(null);
    const [activeTab, setActiveTab] = useState<"scheduler" | "candidates" | "integrations" | "jobs" | "questions">("scheduler");

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editForm, setEditForm] = useState({ industry: "", size: "" });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchOrg = async () => {
            if (state.sub) {
                try {
                    const data = await API.getOrganization(state.sub);
                    if (data) {
                        setOrganization(data);
                        setEditForm({ industry: data.industry, size: data.size });
                    }
                } catch (error) {
                    console.error("Failed to fetch organization", error);
                }
            }
        };
        fetchOrg();
    }, [state.sub]);

    const handleUpdateOrg = async () => {
        if (!organization || !state.sub) return;
        setIsSaving(true);
        try {
            const response = await API.updateOrganization(organization.id, editForm, state.sub);

            if (response.ok) {
                setOrganization({ ...organization, ...editForm });
                setIsSettingsOpen(false);
            } else {
                alert("Failed to update organization");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating organization");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1D] font-sans flex text-sm">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed inset-y-0 left-0 z-10">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <EquiHireLogo className="mr-3 w-8 h-8" />
                    <span className="font-semibold text-lg tracking-tight">EquiHire</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Button
                        variant="ghost"
                        className={`w-full justify-start ${activeTab === 'scheduler' ? 'text-[#FF7300] bg-orange-50 hover:bg-orange-50 hover:text-[#FF7300]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('scheduler')}
                    >
                        <DashboardIcon className="mr-3 h-5 w-5" />
                        Scheduler
                    </Button>
                    <Button
                        variant="ghost"
                        className={`w-full justify-start ${activeTab === 'candidates' ? 'text-[#FF7300] bg-orange-50 hover:bg-orange-50 hover:text-[#FF7300]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('candidates')}
                    >
                        <SessionIcon className="mr-3 h-5 w-5" />
                        Candidates
                    </Button>
                    <Button
                        variant="ghost"
                        className={`w-full justify-start ${activeTab === 'questions' ? 'text-[#FF7300] bg-orange-50 hover:bg-orange-50 hover:text-[#FF7300]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('questions')}
                    >
                        <Check className="mr-3 h-5 w-5" />
                        Questions
                    </Button>
                    <Button
                        variant="ghost"
                        className={`w-full justify-start ${activeTab === 'integrations' ? 'text-[#FF7300] bg-orange-50 hover:bg-orange-50 hover:text-[#FF7300]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('integrations')}
                    >
                        <IntegrationIcon className="mr-3 h-5 w-5" />
                        Integrations
                    </Button>
                    <Button
                        variant="ghost"
                        className={`w-full justify-start ${activeTab === 'jobs' ? 'text-[#FF7300] bg-orange-50 hover:bg-orange-50 hover:text-[#FF7300]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <Building2 className="mr-3 h-5 w-5" />
                        Jobs
                    </Button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center p-2 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {state.displayName ? state.displayName[0] : "R"}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{state.displayName || "Recruiter"}</p>
                            <p className="text-xs text-gray-500 truncate">{state.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center text-gray-400 focus-within:text-gray-600">
                        <Search className="h-5 w-5 absolute ml-3 pointer-events-none" />
                        <Input
                            placeholder="Search sessions..."
                            className="pl-10 w-64 sm:w-96 border-gray-200 bg-gray-50 focus:bg-white transition-all rounded-full h-9"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Organization Dropdown */}
                        {organization && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-9 border-dashed border-gray-300 bg-transparent px-3 text-xs font-medium hover:bg-gray-100 hidden sm:flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5 text-gray-500" />
                                        <span>{organization.name}</span>
                                        <ChevronDown className="h-3 w-3 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="text-xs font-normal text-gray-500">Current Workspace</DropdownMenuLabel>
                                    <DropdownMenuItem className="gap-2 p-2 focus:bg-orange-50 focus:text-orange-600 cursor-default">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-white">
                                            <Building2 className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex flex-col space-y-0.5">
                                            <span className="text-sm font-medium">{organization.name}</span>
                                            <span className="text-xs text-gray-400 capitalize">{organization.industry?.replace('_', ' ')}</span>
                                        </div>
                                        <Check className="ml-auto h-4 w-4 text-orange-600" />
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Organization Settings</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <Button variant="ghost" size="icon" className="text-gray-500">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => signOut()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </header>

                {/* Org Settings Modal */}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Organization Settings</DialogTitle>
                            <DialogDescription>
                                Manage your organization's details here.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" value={organization?.name || ''} disabled className="bg-gray-100" />
                                <p className="text-[0.8rem] text-muted-foreground">Organization names cannot be changed.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select
                                    value={editForm.industry}
                                    onValueChange={(val) => setEditForm({ ...editForm, industry: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="software_engineering">Software Engineering</SelectItem>
                                        <SelectItem value="ai_ml">Artificial Intelligence / ML</SelectItem>
                                        <SelectItem value="data_science">Data Science</SelectItem>
                                        <SelectItem value="it_services">IT Services & Consulting</SelectItem>
                                        <SelectItem value="cyber_security">Cyber Security</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="size">Company Size</Label>
                                <Select
                                    value={editForm.size}
                                    onValueChange={(val) => setEditForm({ ...editForm, size: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10 employees</SelectItem>
                                        <SelectItem value="11-50">11-50 employees</SelectItem>
                                        <SelectItem value="50+">50+ employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateOrg} disabled={isSaving} className="bg-[#FF7300] hover:bg-[#E56700]">
                                {isSaving ? "Saving..." : "Save changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Content Body */}
                <div className="p-8 overflow-auto flex-1 bg-[#F8F9FA]">
                    <div className="max-w-6xl mx-auto">
                        {/* Dynamic Page Content */}
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            {activeTab === 'scheduler' && <InterviewScheduler />}
                            {activeTab === 'candidates' && <CandidateManager />}
                            {activeTab === 'questions' && <QuestionsManager />}
                            {activeTab === 'integrations' && <Integrations />}
                            {activeTab === 'jobs' && <JobsManager />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


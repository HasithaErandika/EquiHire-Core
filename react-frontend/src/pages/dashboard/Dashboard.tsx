import { useState } from 'react';
import { useAuthContext } from "@asgardeo/auth-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EquiHireLogo, DashboardIcon, SessionIcon, IntegrationIcon } from "@/components/ui/Icons";
import { LogOut, Bell, Settings, Search } from "lucide-react";

// Import Pages
import InterviewScheduler from './views/Scheduler';
import CandidateManager from './views/Candidates';
import Integrations from './views/Integrations';

export default function Dashboard() {
    const { state, signOut } = useAuthContext();
    const [activeTab, setActiveTab] = useState<"scheduler" | "candidates" | "integrations">("scheduler");

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
                        className={`w-full justify-start ${activeTab === 'integrations' ? 'text-[#FF7300] bg-orange-50 hover:bg-orange-50 hover:text-[#FF7300]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('integrations')}
                    >
                        <IntegrationIcon className="mr-3 h-5 w-5" />
                        Integrations
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
                        <Button variant="ghost" size="icon" className="text-gray-500">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-500">
                            <Settings className="h-5 w-5" />
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

                {/* Content Body */}
                <div className="p-8 overflow-auto flex-1 bg-[#F8F9FA]">
                    <div className="max-w-6xl mx-auto">
                        {/* Dynamic Page Content */}
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            {activeTab === 'scheduler' && <InterviewScheduler />}
                            {activeTab === 'candidates' && <CandidateManager />}
                            {activeTab === 'integrations' && <Integrations />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


/**
 * Candidates View
 *
 * Dashboard view for managing the hiring pipeline: list candidates, filter by status/activity,
 * view details (scores, context, timeline), and accept/reject with configurable threshold.
 *
 * Structure:
 * - useCandidates: data loading, filters, selection, and decision actions
 * - CandidateFilters: status dropdown, seen/unseen toggle, threshold input
 * - CandidateListTable: scrollable table with loading/empty states
 * - CandidateDetailPanel: slide-in panel with scores, context, timeline, actions
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useCandidates } from '@/hooks/useCandidates';
import {
  CandidateFilters,
  CandidateListTable,
  CandidateDetailPanel,
  CandidatePipeline,
} from '@/components/dashboard';
import { LayoutGrid, List, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CandidateManager() {
  const { state } = useAuthContext();
  const userId = state.sub;

  const {
    filteredCandidates,
    selectedCandidate,
    threshold,
    isLoading,
    isProcessing,
    statusFilter,
    setStatusFilter,
    activityFilter,
    setActivityFilter,
    setThreshold,
    setSelectedCandidate,
    handleViewDetails,
    handleApplyDecision,
    handleEvaluateCV,
  } = useCandidates({ userId });

  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
      {/* Main list: filters + table */}
      <div
        className={`flex-1 flex flex-col space-y-4 transition-all ${selectedCandidate ? 'w-1/2' : 'w-full'}`}
      >
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-xl">
                 <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500">Candidates</h2>
                <p className="text-gray-500 text-sm font-medium">Manage your intelligent hiring pipeline.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start">
              <Button 
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('table')}
                  className="text-xs font-bold gap-2 px-3 h-8"
              >
                  <List className="w-3.5 h-3.5" /> Table
              </Button>
              <Button 
                  variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('pipeline')}
                  className="text-xs font-bold gap-2 px-3 h-8"
              >
                  <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
              </Button>
            </div>
          </div>
          <CandidateFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            activityFilter={activityFilter}
            onActivityChange={setActivityFilter}
            threshold={threshold}
            onThresholdChange={setThreshold}
          />
        </div>

        {viewMode === 'table' ? (
          <CandidateListTable
            candidates={filteredCandidates}
            selectedId={selectedCandidate?.candidateId ?? null}
            isLoading={isLoading}
            onSelectCandidate={handleViewDetails}
          />
        ) : (
          <div className="flex-1 overflow-hidden">
            <CandidatePipeline 
                candidates={filteredCandidates}
                threshold={threshold}
                selectedId={selectedCandidate?.candidateId ?? null}
                onSelectCandidate={handleViewDetails}
            />
          </div>
        )}
      </div>

      {/* Detail panel (slides in when a candidate is selected) */}
      {selectedCandidate && (
        <CandidateDetailPanel
          candidate={selectedCandidate}
          threshold={threshold}
          isProcessing={isProcessing}
          onClose={() => setSelectedCandidate(null)}
          onApplyDecision={handleApplyDecision}
          onEvaluateCV={handleEvaluateCV}
        />
      )}
    </div>
  );
}

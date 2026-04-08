/**
 * @fileoverview Filter controls for the candidate list: status, activity (seen/unseen), and score weightages.
 */

import { Eye, EyeOff, Filter } from 'lucide-react';
import type { ActivityFilter, StatusFilter } from '@/types';

export interface CandidateFiltersProps {
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  activityFilter: ActivityFilter;
  onActivityChange: (v: ActivityFilter) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: 'all',         label: 'All Status',  dot: 'bg-gray-400' },
  { value: 'applied',     label: 'Applied',     dot: 'bg-blue-300' },
  { value: 'pending',     label: 'Pending',     dot: 'bg-blue-400' },
  { value: 'shortlisted', label: 'Shortlisted', dot: 'bg-teal-400' },
  { value: 'accepted',    label: 'Accepted',    dot: 'bg-green-400' },
  { value: 'rejected',    label: 'Rejected',    dot: 'bg-red-400' },
];

export function CandidateFilters({
  statusFilter,
  onStatusChange,
  activityFilter,
  onActivityChange,
}: CandidateFiltersProps) {
  return (
    <div className="flex flex-col gap-3 w-full self-start">
      <div className="flex flex-wrap items-center gap-2">
        {/* Activity toggle — All / Unseen */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => onActivityChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
              ${activityFilter === 'all'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            All
          </button>
          <button
            type="button"
            onClick={() => onActivityChange('unseen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
              ${activityFilter === 'unseen'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Unseen
          </button>
        </div>

        {/* Status select — styled as a premium dropdown */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-semibold 
              rounded-xl pl-8 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 
              focus:border-blue-400 cursor-pointer hover:border-gray-300 transition-colors"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg className="absolute right-2.5 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

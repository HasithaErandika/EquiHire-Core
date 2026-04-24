import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CandidateStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns Tailwind classes for pipeline status badges (border + bg + text).
 */
export function getCandidateStatusClasses(status: CandidateStatus): string {
  switch (status) {
    case 'accepted': return 'text-green-600 bg-green-50 border-green-200'
    case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
    case 'scheduled': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-amber-600 bg-amber-50 border-amber-200'
  }
}

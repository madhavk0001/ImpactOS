import React from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  AlertOctagon, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  XCircle,
  MinusCircle
} from 'lucide-react';

/**
 * StatusBadge ensures all states are conveyed through distinct icons, text, and colors.
 * Satisfies the strict requirement:
 * - Distinguishes OPTIMAL vs FEASIBLE vs INFEASIBLE vs ERROR vs ILLUSTRATIVE vs UNRECOGNIZED.
 */
export default function StatusBadge({ status, size = 'md', className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase().trim();

  // Size configurations
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3 py-1.5 space-x-2',
  }[size] || 'text-xs px-2.5 py-1 space-x-1.5';

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3.5 h-3.5';

  // Explicit status definitions
  switch (normalized) {
    case 'OPTIMAL':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-status-success-bg text-status-success border border-status-success/30 ${sizeClasses} ${className}`}>
          <CheckCircle2 className={`${iconSizes} shrink-0`} />
          <span className="font-sans uppercase tracking-wider font-semibold">Optimal</span>
        </span>
      );

    case 'FEASIBLE':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-status-info-bg text-status-info border border-status-info/30 ${sizeClasses} ${className}`}>
          <CheckCircle2 className={`${iconSizes} shrink-0`} />
          <span className="font-sans uppercase tracking-wider font-semibold">Feasible (Non-Optimal)</span>
        </span>
      );

    case 'INFEASIBLE':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-status-error-bg text-status-error border border-status-error/30 ${sizeClasses} ${className}`}>
          <AlertOctagon className={`${iconSizes} shrink-0`} />
          <span className="font-sans uppercase tracking-wider font-semibold">Infeasible Constraints</span>
        </span>
      );

    case 'ERROR':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-status-error-bg text-status-error border border-status-error/30 ${sizeClasses} ${className}`}>
          <XCircle className={`${iconSizes} shrink-0`} />
          <span className="font-sans uppercase tracking-wider font-semibold">Solver Error</span>
        </span>
      );

    case 'ILLUSTRATIVE':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-status-warning-bg text-status-warning border border-status-warning/40 ${sizeClasses} ${className}`} title="Illustrative sample fixture, not mathematical solver output">
          <Sparkles className={`${iconSizes} shrink-0`} />
          <span className="font-sans uppercase tracking-wider font-semibold">Illustrative Sample</span>
        </span>
      );

    case 'FUNDED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-status-success-bg text-status-success border border-status-success/30 ${sizeClasses} ${className}`}>
          <CheckCircle2 className={`${iconSizes} shrink-0`} />
          <span className="font-sans font-semibold">Funded</span>
        </span>
      );

    case 'UNFUNDED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-surface-alt text-secondary-text border border-border-hairline ${sizeClasses} ${className}`}>
          <MinusCircle className={`${iconSizes} shrink-0`} />
          <span className="font-sans font-medium">Unfunded</span>
        </span>
      );

    case 'NOT_YET_OPTIMIZED':
    case 'PENDING':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-surface-alt/70 text-secondary-text border border-border-hairline ${sizeClasses} ${className}`}>
          <Clock className={`${iconSizes} shrink-0`} />
          <span className="font-sans">Not Yet Optimized</span>
        </span>
      );

    default:
      // Requirement: Any other status: an explicit "Unrecognized status" state showing the raw value
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-surface-alt text-secondary-text border border-border-hairline ${sizeClasses} ${className}`} title={`Raw solver status: ${status}`}>
          <HelpCircle className={`${iconSizes} shrink-0 text-status-warning`} />
          <span className="font-sans font-medium">Unrecognized Status: {String(status)}</span>
        </span>
      );
  }
}


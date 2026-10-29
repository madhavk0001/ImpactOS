import React from 'react';
import { Loader2, FolderOpen, AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export function LoadingState({ message = 'Loading records...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Loader2 className="w-8 h-8 text-terracotta animate-spin mb-4" />
      <p className="text-sm font-medium text-charcoal">{message}</p>
      <p className="text-xs text-secondary-text mt-1">Please wait while the system synchronizes.</p>
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'There are no items currently available in this section.',
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-panel border border-dashed border-border-hairline bg-surface/60">
      <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center text-taupe-dark mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-display font-medium text-obsidian mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-secondary-text max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'An error occurred',
  message = 'The requested operation could not be completed.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-panel border border-status-error/30 bg-status-error-bg/30">
      <div className="w-12 h-12 rounded-full bg-status-error-bg flex items-center justify-center text-status-error mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-display font-medium text-status-error mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-secondary-text max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Retry Request
        </Button>
      )}
    </div>
  );
}


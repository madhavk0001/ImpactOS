import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  project,
  onConfirm,
  onClose,
}) {
  if (!project) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Confirm Project Removal"
      title="Remove Capital Project?"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-status-error-bg/50 border border-status-error/30 text-charcoal">
          <AlertTriangle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-status-error">
              This action will delete the candidate project from this planning scenario.
            </p>
            <p className="text-secondary-text">
              If an optimization run has already completed, deleting this project will invalidate the solution and mark the allocation stale.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-surface-alt/40 border border-border-hairline text-xs space-y-1">
          <p className="text-secondary-text font-mono uppercase text-[10px]">{project.id}</p>
          <p className="font-medium text-obsidian">{project.name}</p>
          <p className="text-secondary-text">Department: {project.department}</p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border-hairline">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            size="md" 
            onClick={() => onConfirm(project.id)}
          >
            Confirm Removal
          </Button>
        </div>
      </div>
    </Modal>
  );
}


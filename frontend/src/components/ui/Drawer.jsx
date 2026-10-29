import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  title,
  eyebrow,
  children,
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-obsidian/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          ref={drawerRef}
          className="w-screen max-w-xl bg-surface border-l border-border-hairline shadow-elevated flex flex-col h-full transform transition-all duration-300 ease-in-out"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border-hairline flex items-start justify-between bg-surface-alt/40">
            <div>
              {eyebrow && (
                <p className="text-editorial-eyebrow text-terracotta mb-1">{eyebrow}</p>
              )}
              <h2 id="drawer-title" className="text-2xl font-display font-medium text-obsidian">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-secondary-text hover:text-obsidian hover:bg-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


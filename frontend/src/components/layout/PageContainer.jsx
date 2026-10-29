import React from 'react';
import { AlertTriangle, Sparkles, X } from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

export default function PageContainer({ children, className = '' }) {
  const { isResultStale, isIllustrativeActive, toggleIllustrative } = useScenario();

  return (
    <main className="flex-1 w-full pb-16">
      {/* Global Notice Banners */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
        {/* Persistent Warning: Illustrative Sample Preview */}
        {isIllustrativeActive && (
          <div 
            role="alert" 
            className="flex items-center justify-between px-1 py-3 border-y border-border-hairline text-charcoal animate-in fade-in"
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-terracotta shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-obsidian uppercase tracking-wider mr-2">
                  Sample Preview Active:
                </span>
                <span className="text-secondary-text">
                  Illustrative sample, not solver output. Real solver results take precedence when executed.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleIllustrative(false)}
              className="text-secondary-text hover:text-obsidian p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
              title="Dismiss illustrative sample preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stale Result Banner */}
        {isResultStale && (
          <div 
            role="alert" 
            className="flex items-center space-x-2.5 px-1 py-3 border-y border-status-warning/40 text-charcoal animate-in fade-in"
          >
            <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-status-warning uppercase tracking-wider mr-2">
                Inputs Modified:
              </span>
              <span className="text-secondary-text">
                Optimization inputs or budget envelope have changed since the last run. Displayed results and allocation metrics are stale. Rerun optimization to update.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-8 ${className}`}>
        {children}
      </div>
    </main>
  );
}


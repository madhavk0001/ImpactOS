import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, AlertCircle, ShieldAlert, Download } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import AuditTable from '../components/reports/AuditTable';
import { EmptyState, LoadingState, ErrorState } from '../components/ui/States';
import { useScenario } from '../context/ScenarioContext';
import { fetchRuns } from '../../src/services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function AuditReportsPage() {
  const { sessionHistory, backendStatus } = useScenario();
  const [remoteRuns, setRemoteRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRuns = async () => {
    if (!backendStatus.connected) {
      // Backend disconnected: rely exclusively on session history
      setRemoteRuns([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRuns();
      setRemoteRuns(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve audit runs from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [backendStatus.connected]);

  // Combine remote runs and current session runs, ensuring no duplicates by run_id
  const combinedMap = new Map();

  // Add backend runs
  remoteRuns.forEach((r) => combinedMap.set(r.run_id, r));

  // Add genuine session runs (never add illustrative runs)
  sessionHistory
    .filter((r) => !r.result_object?.is_illustrative && r.run_id !== 'ILLUSTRATIVE-PREVIEW-ONLY')
    .forEach((r) => {
      if (!combinedMap.has(r.run_id)) {
        combinedMap.set(r.run_id, {
          run_id: r.run_id,
          status: r.status,
          timestamp: r.timestamp,
          budget_inr: r.budget_inr,
          cost_inr: r.cost_inr,
          benefit: r.benefit,
          funded_count: r.funded_count,
          result_object: r.result_object,
          is_illustrative: false,
        });
      }
    });

  const allAvailableRuns = Array.from(combinedMap.values()).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="INSTITUTIONAL GOVERNANCE & COMPLIANCE"
        title="Audit Reports &"
        italicAccent="Run Manifests"
        description="Immutable logs of genuine mathematical optimization executions, constraint evaluations, and formal capital allocation decisions. Illustrative preview mocks are strictly excluded from audit manifests."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={loadRuns}
          >
            Refresh Records
          </Button>
        }
      />

      {/* Disconnection or Demo Warning */}
      {!backendStatus.connected && (
        <div className="mb-6 p-4 rounded-panel bg-surface-alt/70 border border-border-hairline text-xs flex items-center justify-between text-secondary-text">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-taupe shrink-0" />
            <span>
              Backend is currently disconnected. Displaying genuine optimization runs executed during this browser session only.
            </span>
          </div>
          <span className="text-[11px] font-mono text-taupe-dark bg-surface px-2 py-0.5 rounded border border-border-hairline">
            Session History ({allAvailableRuns.length})
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && <LoadingState message="Fetching institutional run history from backend..." />}

      {/* Error state */}
      {error && !isLoading && (
        <ErrorState
          title="Could not retrieve backend run log"
          message={error}
          onRetry={loadRuns}
        />
      )}

      {/* Main Table or Empty State */}
      {!isLoading && !error && (
        <>
          {allAvailableRuns.length > 0 ? (
            <Card variant="surface" className="p-0 sm:p-2 overflow-hidden">
              <AuditTable runs={allAvailableRuns} />
            </Card>
          ) : (
            <EmptyState
              title="No genuine optimization runs recorded"
              description="No real mathematical solver executions have occurred in this session or on the connected backend. Illustrative preview fixtures are never recorded as real runs. Execute an optimization run to create an auditable record."
              actionLabel="Return to Dashboard"
              onAction={() => window.location.assign('/')}
            />
          )}
        </>
      )}
    </PageContainer>
  );
}


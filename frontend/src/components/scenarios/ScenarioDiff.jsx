import React, { useState } from 'react';
import { 
  ArrowRight, 
  PlusCircle, 
  MinusCircle, 
  Check, 
  AlertCircle, 
  History, 
  Sparkles,
  Info
} from 'lucide-react';
import { formatINR, formatBenefitScore, formatPercentage, formatDateTime } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

export default function ScenarioDiff() {
  const { sessionHistory, lastResult, isResultStale, settings, projects } = useScenario();

  // Selected run index for comparison
  const [selectedRunId, setSelectedRunId] = useState(
    sessionHistory.length >= 2 ? sessionHistory[1]?.run_id : null
  );

  const realRuns = sessionHistory.filter((r) => !r.result_object?.is_illustrative);
  const isIllustrative = Boolean(lastResult?.is_illustrative);

  // If current result is illustrative
  if (isIllustrative) {
    return (
      <Card variant="alt" className="border-dashed">
        <div className="flex items-start space-x-3 text-xs">
          <Info className="w-4 h-4 text-taupe-dark shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-obsidian uppercase tracking-wider">
              Comparison Disabled for Sample Preview
            </p>
            <p className="text-secondary-text">
              The active result is an illustrative mock preview fixture. Under ImpactOS design rules, illustrative results are excluded from formal scenario diffs and cannot be compared against real solver outcomes.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // If result is stale
  if (isResultStale) {
    return (
      <Card variant="alt" className="border-dashed">
        <div className="flex items-start space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-status-warning uppercase tracking-wider">
              Comparison Disabled: Active Result is Stale
            </p>
            <p className="text-secondary-text">
              Scenario parameters or candidate projects have changed since the last solver run. Re-execute the optimization solver to obtain a valid current result before running a comparative scenario diff.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // If less than 2 runs in session history
  if (realRuns.length < 2) {
    return (
      <Card variant="surface">
        <div className="flex items-start justify-between pb-3 border-b border-border-hairline mb-3">
          <div>
            <p className="text-editorial-eyebrow text-secondary-text mb-0.5">Scenario Differential</p>
            <h3 className="text-xl font-display font-medium text-obsidian">
              Comparative Impact Analysis
            </h3>
          </div>
          <span className="text-xs text-taupe-dark bg-surface-alt px-2 py-0.5 rounded">
            This session only
          </span>
        </div>
        <p className="text-xs text-secondary-text leading-relaxed">
          At least two genuine optimization runs are required in this browser session to compute a mathematical differential. Adjust your budget envelope or toggle candidate projects above, then run the solver again to benchmark against the baseline.
        </p>
      </Card>
    );
  }

  // Current run is realRuns[0]
  const currentRun = realRuns[0];
  // Baseline to compare against (either selectedRunId or realRuns[1])
  const baselineRun = realRuns.find((r) => r.run_id === selectedRunId) || realRuns[1];

  const currentResult = currentRun.result_object;
  const baselineResult = baselineRun.result_object;

  const currentFundedIds = currentResult?.funded_ids || [];
  const baselineFundedIds = baselineResult?.funded_ids || [];

  // Identify status changes
  const newlyFunded = currentFundedIds.filter((id) => !baselineFundedIds.includes(id));
  const dropped = baselineFundedIds.filter((id) => !currentFundedIds.includes(id));
  const retained = currentFundedIds.filter((id) => baselineFundedIds.includes(id));

  const benefitDiff = (currentRun.benefit || 0) - (baselineRun.benefit || 0);
  const costDiff = (currentRun.cost_inr || 0) - (baselineRun.cost_inr || 0);

  const getProjectName = (id) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.name : id;
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-hairline gap-3">
        <div>
          <p className="text-editorial-eyebrow text-terracotta mb-0.5">Differential</p>
          <h3 className="text-xl font-display font-medium text-obsidian">
            Scenario Delta vs. Baseline
          </h3>
        </div>

        {/* Baseline Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-secondary-text">Compare Against:</span>
          <select
            value={baselineRun.run_id}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="px-2 py-1 rounded bg-surface border border-border-hairline text-charcoal font-mono text-xs focus-visible:ring-1 focus-visible:ring-terracotta"
          >
            {realRuns.slice(1).map((r) => (
              <option key={r.run_id} value={r.run_id}>
                Run {r.run_id.slice(-6)} ({formatDateTime(r.timestamp)})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-taupe-dark bg-surface-alt px-1.5 py-0.5 rounded">
            This session only
          </span>
        </div>
      </div>

      {/* Metrics Delta Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-surface-alt/40 border border-border-hairline">
          <span className="text-[10px] uppercase tracking-wider text-secondary-text block">
            Net Benefit Delta
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl font-display font-semibold tabular-nums ${
              benefitDiff >= 0 ? 'text-status-success' : 'text-status-error'
            }`}>
              {benefitDiff >= 0 ? `+${formatBenefitScore(benefitDiff)}` : formatBenefitScore(benefitDiff)}
            </span>
            <span className="text-xs text-secondary-text">pts</span>
          </div>
          <span className="text-[11px] text-secondary-text block mt-0.5">
            Baseline: {formatBenefitScore(baselineRun.benefit)} → Current: {formatBenefitScore(currentRun.benefit)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-alt/40 border border-border-hairline">
          <span className="text-[10px] uppercase tracking-wider text-secondary-text block">
            Net Outlay Delta
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-display font-semibold text-obsidian tabular-nums">
              {formatINR(costDiff, { currencyMode: settings.currencyMode })}
            </span>
          </div>
          <span className="text-[11px] text-secondary-text block mt-0.5">
            Baseline: {formatINR(baselineRun.cost_inr, { compact: true })}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-alt/40 border border-border-hairline">
          <span className="text-[10px] uppercase tracking-wider text-secondary-text block">
            Portfolio Churn
          </span>
          <div className="flex items-baseline space-x-3 mt-1 text-sm font-semibold text-obsidian">
            <span className="text-status-success">+{newlyFunded.length} Added</span>
            <span className="text-status-error">-{dropped.length} Dropped</span>
          </div>
          <span className="text-[11px] text-secondary-text block mt-0.5">
            {retained.length} projects retained from baseline
          </span>
        </div>
      </div>

      {/* Project Shift Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Newly Funded */}
        <div className="p-4 rounded-lg bg-status-success-bg/30 border border-status-success/30 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-status-success uppercase tracking-wider">
            <PlusCircle className="w-4 h-4" />
            <span>Newly Funded Under This Scenario ({newlyFunded.length})</span>
          </div>
          {newlyFunded.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-charcoal">
              {newlyFunded.map((id) => (
                <li key={id} className="flex items-center justify-between p-1.5 rounded bg-surface/80 border border-status-success/20">
                  <span className="font-mono text-[10px] text-secondary-text font-semibold mr-2">{id}</span>
                  <span className="truncate flex-1 font-medium">{getProjectName(id)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-secondary-text italic">No new projects funded compared to baseline.</p>
          )}
        </div>

        {/* Dropped / Defunded */}
        <div className="p-4 rounded-lg bg-status-error-bg/30 border border-status-error/30 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-status-error uppercase tracking-wider">
            <MinusCircle className="w-4 h-4" />
            <span>Deferred / Dropped from Baseline ({dropped.length})</span>
          </div>
          {dropped.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-charcoal">
              {dropped.map((id) => (
                <li key={id} className="flex items-center justify-between p-1.5 rounded bg-surface/80 border border-status-error/20">
                  <span className="font-mono text-[10px] text-secondary-text font-semibold mr-2">{id}</span>
                  <span className="truncate flex-1 font-medium">{getProjectName(id)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-secondary-text italic">No baseline projects were dropped in this run.</p>
          )}
        </div>
      </div>
    </Card>
  );
}


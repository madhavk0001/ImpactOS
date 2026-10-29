import React from 'react';
import { ArrowUpRight, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { formatINR, formatPercentage, formatBenefitScore } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import Card from '../ui/Card';

export default function BaselineComparison() {
  const { lastResult, sessionHistory, settings } = useScenario();

  // Rule: Exclude illustrative results from genuine baseline comparison
  const isIllustrative = Boolean(lastResult?.is_illustrative);

  // Check if we have at least 2 real runs in sessionHistory to compare
  const realRuns = sessionHistory.filter((r) => !r.result_object?.is_illustrative);
  const hasRealBaseline = realRuns.length >= 2;

  if (isIllustrative) {
    return (
      <Card variant="alt" className="border-dashed">
        <div className="flex items-start space-x-3 text-xs">
          <Info className="w-4 h-4 text-taupe-dark shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-obsidian uppercase tracking-wider">
              Baseline Comparison Excluded for Sample Previews
            </p>
            <p className="text-secondary-text">
              Under ImpactOS policy rules, illustrative mock preview fixtures are strictly prohibited from generating baseline-versus-optimized claims. Genuine comparison unlocks once the Python FastAPI solver executes at least two institutional runs.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!hasRealBaseline) {
    return (
      <Card variant="surface">
        <div className="flex items-start justify-between pb-3 border-b border-border-hairline mb-3">
          <div>
            <p className="text-editorial-eyebrow text-secondary-text mb-0.5">Historical Delta</p>
            <h3 className="text-lg font-display font-medium text-obsidian">
              Baseline vs. Optimized Performance
            </h3>
          </div>
        </div>
        <p className="text-xs text-secondary-text">
          {realRuns.length === 1 
            ? 'One genuine solver run recorded. Execute a second scenario or rerun with modified parameters to generate delta comparisons.'
            : 'No genuine solver runs recorded in this session yet. Run the mathematical optimization solver to establish a baseline.'}
        </p>
      </Card>
    );
  }

  // Compare latest run (realRuns[0]) with previous baseline (realRuns[1])
  const current = realRuns[0];
  const baseline = realRuns[1];

  const benefitDelta = current.benefit - baseline.benefit;
  const costDelta = current.cost_inr - baseline.cost_inr;

  return (
    <Card variant="surface">
      <div className="flex items-start justify-between pb-4 border-b border-border-hairline mb-4">
        <div>
          <p className="text-editorial-eyebrow text-terracotta mb-0.5">Benchmarking</p>
          <h3 className="text-xl font-display font-medium text-obsidian">
            Baseline vs. Optimized Performance
          </h3>
        </div>
        <span className="text-[11px] font-mono bg-surface-alt px-2 py-0.5 rounded text-secondary-text">
          Run {baseline.run_id.slice(-6)} → Run {current.run_id.slice(-6)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-surface-alt/50 border border-border-hairline">
          <span className="text-[10px] uppercase tracking-wider text-secondary-text block">
            Benefit Score Improvement
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-display font-semibold text-obsidian tabular-nums">
              {benefitDelta >= 0 ? `+${formatBenefitScore(benefitDelta)}` : formatBenefitScore(benefitDelta)}
            </span>
            <span className="text-xs text-status-success font-medium">pts</span>
          </div>
          <span className="text-[11px] text-secondary-text block mt-0.5">
            Baseline: {formatBenefitScore(baseline.benefit)} → Current: {formatBenefitScore(current.benefit)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-alt/50 border border-border-hairline">
          <span className="text-[10px] uppercase tracking-wider text-secondary-text block">
            Capital Outlay Delta
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-display font-semibold text-obsidian tabular-nums">
              {formatINR(costDelta, { currencyMode: settings.currencyMode })}
            </span>
          </div>
          <span className="text-[11px] text-secondary-text block mt-0.5">
            Baseline: {formatINR(baseline.cost_inr, { compact: true })}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface-alt/50 border border-border-hairline">
          <span className="text-[10px] uppercase tracking-wider text-secondary-text block">
            Funded Projects Count
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-display font-semibold text-obsidian tabular-nums">
              {current.funded_count}
            </span>
            <span className="text-xs text-secondary-text">
              ({current.funded_count - baseline.funded_count >= 0 ? `+${current.funded_count - baseline.funded_count}` : current.funded_count - baseline.funded_count})
            </span>
          </div>
          <span className="text-[11px] text-secondary-text block mt-0.5">
            Baseline: {baseline.funded_count} projects funded
          </span>
        </div>
      </div>
    </Card>
  );
}


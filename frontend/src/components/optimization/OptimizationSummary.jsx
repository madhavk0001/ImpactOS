import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Clock, 
  Sparkles,
  ShieldCheck,
  Server
} from 'lucide-react';
import { formatINR, formatPercentage, formatBenefitScore, formatDateTime } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import StatusBadge from '../ui/StatusBadge';
import Card from '../ui/Card';

export default function OptimizationSummary({ result }) {
  const { settings, isResultStale } = useScenario();

  if (!result) return null;

  const isIllustrative = Boolean(result.is_illustrative);
  const totalCost = result.total_cost_inr;
  const budget = result.total_budget_inr;
  const remaining = result.remaining_budget_inr;
  const utilization = budget > 0 ? totalCost / budget : 0;

  return (
    <div className="space-y-6">
      {/* Solver Status Hero Banner */}
      <div className={`p-6 rounded-panel border ${
        isIllustrative 
          ? 'bg-status-warning-bg/40 border-status-warning/40' 
          : result.status === 'OPTIMAL'
          ? 'bg-status-success-bg/40 border-status-success/40'
          : result.status === 'FEASIBLE'
          ? 'bg-status-info-bg/40 border-status-info/40'
          : 'bg-surface border-border-hairline'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <StatusBadge status={result.status} size="lg" />
              {isIllustrative && (
                <span className="text-xs uppercase tracking-wider font-semibold text-status-warning">
                  (Sample Fixture Only)
                </span>
              )}
            </div>
            <h2 className="text-2xl font-display font-medium text-obsidian">
              {result.status === 'OPTIMAL'
                ? 'Mathematical Optimality Proven'
                : result.status === 'FEASIBLE'
                ? 'Feasible Allocation Found (Sub-Optimal)'
                : result.status === 'INFEASIBLE'
                ? 'Constraints Unsatisfiable'
                : result.status === 'ILLUSTRATIVE'
                ? 'Illustrative Allocation Sample'
                : `Solver Concluded: ${result.status}`}
            </h2>
            <p className="text-xs sm:text-sm text-secondary-text max-w-2xl leading-relaxed">
              {result.solver_message || 'The Google OR-Tools optimization engine resolved candidate project combinations subject to active linear constraints.'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-secondary-text block">Run Reference</span>
            <span className="font-mono text-xs font-semibold text-obsidian block">{result.run_id}</span>
            <span className="text-[11px] text-secondary-text block mt-1">
              Executed: {formatDateTime(result.timestamp)}
            </span>
          </div>
        </div>

        {isIllustrative && (
          <div className="mt-4 pt-3 border-t border-status-warning/30 flex items-center space-x-2 text-xs text-status-warning font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Notice: Illustrative sample, not solver output. Real solver results will take precedence upon connecting to the FastAPI backend.</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-editorial-eyebrow text-secondary-text mb-1">Allocated Capital</p>
          <p className="text-2xl font-display font-medium text-obsidian tabular-nums">
            {formatINR(totalCost, { currencyMode: settings.currencyMode })}
          </p>
          <p className="text-[11px] text-secondary-text mt-0.5">
            Across {result.funded_ids?.length || 0} selected projects
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-editorial-eyebrow text-secondary-text mb-1">Remaining Budget</p>
          <p className="text-2xl font-display font-medium text-obsidian tabular-nums">
            {formatINR(remaining, { currencyMode: settings.currencyMode })}
          </p>
          <p className="text-[11px] text-secondary-text mt-0.5">Unallocated surplus</p>
        </Card>

        <Card className="p-4">
          <p className="text-editorial-eyebrow text-secondary-text mb-1">Budget Utilization</p>
          <p className="text-2xl font-display font-medium text-obsidian tabular-nums">
            {formatPercentage(utilization)}
          </p>
          <p className="text-[11px] text-secondary-text mt-0.5">Of ₹{(budget / 10000000).toFixed(2)} Cr ceiling</p>
        </Card>

        <Card className="p-4">
          <p className="text-editorial-eyebrow text-secondary-text mb-1">Total Benefit Score</p>
          <p className="text-2xl font-display font-medium text-obsidian tabular-nums">
            {formatBenefitScore(result.total_benefit)}
          </p>
          <p className="text-[11px] text-secondary-text mt-0.5">Combined institutional utility</p>
        </Card>
      </div>
    </div>
  );
}


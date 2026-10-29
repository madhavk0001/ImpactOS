import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { formatINR, formatPercentage, formatBenefitScore } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import Button from '../ui/Button';

export default function HeroMetrics({ onOptimizeClick }) {
  const {
    budgetInr,
    lastResult,
    isOptimizing,
    settings,
    backendStatus,
    isIllustrativeActive,
    toggleIllustrative,
  } = useScenario();

  const isOptimized = Boolean(lastResult);
  const isIllustrative = Boolean(lastResult?.is_illustrative || isIllustrativeActive);
  const allocatedInr = isOptimized ? lastResult.total_cost_inr : null;
  const remainingInr = isOptimized ? lastResult.remaining_budget_inr : budgetInr;
  const utilization = isOptimized && budgetInr > 0 ? allocatedInr / budgetInr : null;
  const currency = { currencyMode: settings.currencyMode };

  const metrics = [
    ['Available budget', formatINR(budgetInr, currency)],
    ['Allocated', isOptimized ? formatINR(allocatedInr, currency) : '—'],
    ['Remaining', isOptimized ? formatINR(remainingInr, currency) : '—'],
    ['Utilization', isOptimized ? formatPercentage(utilization) : '—'],
    ['Benefit score', isOptimized ? formatBenefitScore(lastResult.total_benefit) : '—'],
  ];

  return (
    <section className="mb-10">
      <div className="overflow-hidden rounded-[14px] bg-obsidian text-page">
        <div className="flex flex-col gap-8 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-9">
          <div className="max-w-2xl">
            <p className="text-editorial-eyebrow text-taupe-light">
              {isIllustrative ? 'Illustrative preview' : backendStatus.connected ? 'Connected solver' : 'Scenario · demo mode'}
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-[1.02] tracking-[-0.025em] text-page sm:text-5xl">
              Capital allocation & <em className="font-medium text-taupe-light">decision support</em>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-taupe-light">
              A considered, practical approach to institutional investment and impact.
            </p>
          </div>

          <div className="w-full shrink-0 border border-white/10 bg-white/[0.035] px-5 py-5 sm:w-[280px] lg:w-[290px]">
            <p className="text-editorial-eyebrow text-taupe-light">
              {isOptimized ? 'Remaining budget' : 'Available target budget'}
            </p>
            <p className="mt-2 font-display text-3xl font-medium tabular-nums text-page">
              {formatINR(remainingInr, currency)}
            </p>
            <p className="mt-1 text-xs text-taupe">
              {isIllustrative ? 'Illustrative sample, not solver output' : isOptimized ? 'After the current allocation' : 'Awaiting solver execution'}
            </p>
            <Button
              variant="primary"
              size="md"
              isLoading={isOptimizing}
              icon={Zap}
              onClick={onOptimizeClick}
              className="mt-5 w-full"
            >
              {isIllustrative ? 'Run real optimization' : isOptimized ? 'Rerun optimization' : 'Optimize allocation'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-3.5 text-xs text-taupe sm:px-8 lg:px-10">
          <span>{isIllustrative ? 'Sample data is shown for interface preview only.' : backendStatus.connected ? 'Backend connected and ready.' : 'Solver backend disconnected.'}</span>
          {!backendStatus.connected && (
            <button
              type="button"
              onClick={() => toggleIllustrative(!isIllustrativeActive)}
              className="inline-flex items-center gap-1 text-taupe-light underline underline-offset-2 hover:text-page"
            >
              <Sparkles className="h-3.5 w-3.5 text-terracotta" />
              {isIllustrativeActive ? 'Hide sample preview' : 'Show sample preview'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 divide-y divide-border-hairline border-b border-border-hairline sm:grid-cols-5 sm:divide-x sm:divide-y-0">
        {metrics.map(([label, value], index) => (
          <div key={label} className={`py-4 ${index % 2 === 0 ? 'pr-4' : 'px-4'} sm:px-4 first:sm:pl-0 last:sm:pr-0`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary-text">{label}</p>
            <p className="mt-1 text-sm font-medium tabular-nums text-obsidian">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

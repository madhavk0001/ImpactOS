import React from 'react';
import { CheckCircle2, AlertOctagon, HelpCircle, Shield, FileCheck } from 'lucide-react';
import { formatINR, formatPercentage } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import Card from '../ui/Card';

export default function ConstraintInspector({ result, allProjects = [] }) {
  const { settings } = useScenario();

  if (!result) return null;

  const fundedProjects = allProjects.filter((p) => result.funded_ids?.includes(p.id));
  const totalCost = fundedProjects.reduce((sum, p) => sum + p.cost_inr, 0);
  const budget = result.total_budget_inr;
  const accessibleCount = fundedProjects.filter((p) => p.accessible).length;

  // Evaluate dependencies satisfaction
  const dependencyChecks = [];
  fundedProjects.forEach((p) => {
    if (p.dependencies && p.dependencies.length > 0) {
      p.dependencies.forEach((depId) => {
        const isDepFunded = result.funded_ids?.includes(depId);
        dependencyChecks.push({
          dependentProject: `${p.id} (${p.name.replace(/\[PLACEHOLDER\]\s*/, '')})`,
          requiredPrerequisite: depId,
          satisfied: isDepFunded,
        });
      });
    }
  });

  const isBudgetSatisfied = totalCost <= budget;
  const isAccessibilitySatisfied = accessibleCount >= 2; // Institutional benchmark: at least 2 accessible
  const areDependenciesSatisfied = dependencyChecks.every((d) => d.satisfied);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-editorial-eyebrow text-terracotta mb-1">Mathematical Solvability</p>
        <h3 className="text-2xl font-display font-medium text-obsidian">
          Active Invariants & Constraint Satisfaction
        </h3>
        <p className="text-xs text-secondary-text mt-1">
          Verification of linear constraints evaluated by the Google OR-Tools optimization solver:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Constraint 1: Budget Ceiling */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-hairline">
            <span className="text-xs font-semibold text-obsidian uppercase tracking-wider">
              1. Budget Ceiling
            </span>
            {isBudgetSatisfied ? (
              <span className="inline-flex items-center text-status-success text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Satisfied
              </span>
            ) : (
              <span className="inline-flex items-center text-status-error text-xs font-semibold">
                <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Violated
              </span>
            )}
          </div>
          <div className="text-xs space-y-1 text-secondary-text">
            <div className="flex justify-between">
              <span>Cap Limit:</span>
              <span className="font-semibold text-obsidian tabular-nums">
                {formatINR(budget, { currencyMode: settings.currencyMode })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Actual Outlay:</span>
              <span className="font-semibold text-obsidian tabular-nums">
                {formatINR(totalCost, { currencyMode: settings.currencyMode })}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border-hairline/60">
              <span>Surplus Reserve:</span>
              <span className="font-semibold text-status-success tabular-nums">
                {formatINR(Math.max(0, budget - totalCost), { currencyMode: settings.currencyMode })}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-secondary-text pt-1">
            Strict linear upper bound: total project capital must not exceed the approved fiscal envelope.
          </p>
        </Card>

        {/* Constraint 2: Accessibility Quota */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-hairline">
            <span className="text-xs font-semibold text-obsidian uppercase tracking-wider">
              2. Accessibility Quota
            </span>
            {isAccessibilitySatisfied ? (
              <span className="inline-flex items-center text-status-success text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Satisfied
              </span>
            ) : (
              <span className="inline-flex items-center text-status-warning text-xs font-semibold">
                <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Sub-Threshold
              </span>
            )}
          </div>
          <div className="text-xs space-y-1 text-secondary-text">
            <div className="flex justify-between">
              <span>Mandated Target:</span>
              <span className="font-semibold text-obsidian">≥ 2 Projects</span>
            </div>
            <div className="flex justify-between">
              <span>Funded Compliant:</span>
              <span className="font-semibold text-obsidian">{accessibleCount} Projects</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border-hairline/60">
              <span>Compliance Ratio:</span>
              <span className="font-semibold text-status-success">
                {formatPercentage(fundedProjects.length > 0 ? accessibleCount / fundedProjects.length : 0)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-secondary-text pt-1">
            Universal barrier-free accessibility requirement guaranteeing minimum institutional equity.
          </p>
        </Card>

        {/* Constraint 3: Dependency Precedence */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-hairline">
            <span className="text-xs font-semibold text-obsidian uppercase tracking-wider">
              3. Prerequisites Chain
            </span>
            {areDependenciesSatisfied ? (
              <span className="inline-flex items-center text-status-success text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Satisfied
              </span>
            ) : (
              <span className="inline-flex items-center text-status-error text-xs font-semibold">
                <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Broken Chain
              </span>
            )}
          </div>
          <div className="text-xs space-y-1 text-secondary-text">
            <div className="flex justify-between">
              <span>Total Dependencies:</span>
              <span className="font-semibold text-obsidian">{dependencyChecks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Satisfied Prerequisites:</span>
              <span className="font-semibold text-status-success">
                {dependencyChecks.filter((d) => d.satisfied).length} / {dependencyChecks.length}
              </span>
            </div>
          </div>
          {dependencyChecks.length > 0 ? (
            <div className="space-y-1 pt-1 border-t border-border-hairline/60">
              {dependencyChecks.map((d, i) => (
                <div key={i} className="text-[11px] flex items-center justify-between text-secondary-text">
                  <span className="truncate pr-1">{d.requiredPrerequisite} → funded</span>
                  <span className={d.satisfied ? 'text-status-success font-medium' : 'text-status-error font-medium'}>
                    {d.satisfied ? 'OK' : 'MISSING'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-secondary-text pt-1 italic">
              No inter-project dependency chains were triggered by the funded set.
            </p>
          )}
        </Card>

      </div>
    </div>
  );
}


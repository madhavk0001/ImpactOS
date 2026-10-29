import React from 'react';
import { Check, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatINR, formatBenefitScore } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import StatusBadge from '../ui/StatusBadge';
import Card from '../ui/Card';

export default function ProjectResultsList({ 
  filter = 'funded', // 'funded' | 'unfunded'
  result,
  allProjects = [] 
}) {
  const { settings } = useScenario();

  if (!result) return null;

  const targetIds = filter === 'funded' ? result.funded_ids || [] : result.unfunded_ids || [];
  const projects = allProjects.filter((p) => targetIds.includes(p.id));

  if (projects.length === 0) {
    return (
      <Card variant="alt" className="text-center py-12">
        <p className="text-sm font-medium text-obsidian">
          {filter === 'funded' ? 'No projects were selected for funding.' : 'All candidate projects were successfully funded.'}
        </p>
        <p className="text-xs text-secondary-text mt-1">
          {filter === 'funded' 
            ? 'The mathematical solver could not fund projects within the given budget or constraints.' 
            : 'Available budget was sufficient to accommodate all candidate projects.'}
        </p>
      </Card>
    );
  }

  const totalCost = projects.reduce((sum, p) => sum + p.cost_inr, 0);
  const totalBenefit = projects.reduce((sum, p) => sum + p.benefit_score, 0);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border-hairline text-xs">
        <span className="font-medium text-obsidian uppercase tracking-wider">
          {projects.length} {filter === 'funded' ? 'Funded Capital Investments' : 'Unfunded / Deferred Projects'}
        </span>
        <div className="flex items-center space-x-4 text-secondary-text tabular-nums">
          <span>Total Capital: <strong className="text-obsidian">{formatINR(totalCost, { currencyMode: settings.currencyMode })}</strong></span>
          <span>Cumulative Benefit: <strong className="text-obsidian">{formatBenefitScore(totalBenefit)} pts</strong></span>
        </div>
      </div>

      {/* Elias Varr styled table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-label={`${filter} projects list`}>
          <thead>
            <tr className="border-b border-border-hairline bg-surface/50">
              <th scope="col" className="py-2.5 px-3 text-editorial-eyebrow text-secondary-text">Project</th>
              <th scope="col" className="py-2.5 px-3 text-editorial-eyebrow text-secondary-text">Department</th>
              <th scope="col" className="py-2.5 px-3 text-editorial-eyebrow text-secondary-text text-right">Cost</th>
              <th scope="col" className="py-2.5 px-3 text-editorial-eyebrow text-secondary-text text-center">Benefit</th>
              <th scope="col" className="py-2.5 px-3 text-editorial-eyebrow text-secondary-text text-center">Accessibility</th>
              <th scope="col" className="py-2.5 px-3 text-editorial-eyebrow text-secondary-text text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-hairline text-sm">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-surface/80 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-medium text-obsidian">{p.name}</div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-secondary-text mt-0.5">
                    <span>{p.id}</span>
                    {p.isPlaceholder && (
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.2 rounded bg-surface-alt text-secondary-text border border-border-hairline">
                        Sample project
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-xs text-charcoal">{p.department}</td>
                <td className="py-3 px-3 text-right tabular-nums font-medium text-obsidian">
                  {formatINR(p.cost_inr, { currencyMode: settings.currencyMode })}
                </td>
                <td className="py-3 px-3 text-center tabular-nums text-xs font-semibold text-obsidian">
                  {formatBenefitScore(p.benefit_score)}
                </td>
                <td className="py-3 px-3 text-center">
                  {p.accessible ? (
                    <span className="inline-flex items-center text-status-success text-xs font-medium">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>ADA</span>
                    </span>
                  ) : (
                    <span className="text-secondary-text text-xs">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  <StatusBadge status={filter === 'funded' ? 'FUNDED' : 'UNFUNDED'} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


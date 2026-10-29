import React from 'react';
import { Edit2, Trash2, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { formatINR, formatBenefitScore } from '../../utils/formatters';
import StatusBadge from '../ui/StatusBadge';
import { useScenario } from '../../context/ScenarioContext';

export default function ProjectTable({
  projects = [],
  onEdit,
  onDelete,
}) {
  const { lastResult, settings } = useScenario();

  const getFundingStatus = (projectId) => {
    if (!lastResult) return 'NOT_YET_OPTIMIZED';
    return lastResult.funded_ids?.includes(projectId) ? 'FUNDED' : 'UNFUNDED';
  };

  return (
    <div className="w-full">
      {/* ================= DESKTOP TABLE VIEW (>= 768px) ================= */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-label="University Capital Improvement Projects">
          <thead>
            <tr className="border-b border-border-hairline bg-surface/40">
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold">
                Project & Scope
              </th>
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold">
                Department
              </th>
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold text-right">
                Cost ({settings.currencyMode === 'USD_MILLIONS' ? 'USD' : 'INR'})
              </th>
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold text-center">
                Score
              </th>
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold text-center">
                Accessibility
              </th>
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold">
                Prerequisites
              </th>
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold text-center">
                Allocation
              </th>
              <th scope="col" className="py-3 px-4 text-editorial-eyebrow text-secondary-text font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-hairline text-sm">
            {projects.map((project) => {
              const status = getFundingStatus(project.id);
              return (
                <tr 
                  key={project.id} 
                  className="hover:bg-surface/80 transition-colors group"
                >
                  {/* Name & ID */}
                  <td className="py-4 px-4 align-top">
                    <div className="font-medium text-obsidian flex items-center space-x-2">
                      <span>{project.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[11px] font-mono text-secondary-text tracking-wider uppercase">
                        {project.id}
                      </span>
                      {project.isPlaceholder && (
                        <span 
                          className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-surface-alt text-secondary-text border border-border-hairline"
                          title="Synthetic placeholder: Not real ImpactOS dataset"
                        >
                          Sample project
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-secondary-text mt-1 max-w-sm line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </td>

                  {/* Department */}
                  <td className="py-4 px-4 align-top text-xs text-charcoal font-medium">
                    {project.department}
                  </td>

                  {/* Cost */}
                  <td className="py-4 px-4 align-top text-right tabular-nums font-medium text-obsidian">
                    {formatINR(project.cost_inr, { currencyMode: settings.currencyMode })}
                  </td>

                  {/* Benefit Score */}
                  <td className="py-4 px-4 align-top text-center tabular-nums text-xs font-semibold text-obsidian">
                    <span className="inline-block px-2 py-0.5 rounded bg-surface-alt/70">
                      {formatBenefitScore(project.benefit_score)}
                    </span>
                  </td>

                  {/* Accessible */}
                  <td className="py-4 px-4 align-top text-center">
                    {project.accessible ? (
                      <span className="inline-flex items-center text-status-success text-xs font-medium" title="Meets ADA / Barrier-free accessibility criteria">
                        <Check className="w-4 h-4 mr-1 shrink-0" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-secondary-text text-xs" title="Standard scope">
                        <span className="w-3 h-0.5 bg-border-hairline inline-block mr-1"></span>
                        <span>No</span>
                      </span>
                    )}
                  </td>

                  {/* Dependencies */}
                  <td className="py-4 px-4 align-top text-xs text-secondary-text">
                    {project.dependencies && project.dependencies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.dependencies.map((depId) => (
                          <span 
                            key={depId}
                            className="font-mono text-[10px] bg-surface-alt px-1.5 py-0.5 rounded border border-border-hairline"
                          >
                            Req: {depId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-secondary-text italic text-xs">None</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 align-top text-center">
                    <StatusBadge status={status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 align-top text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        type="button"
                        onClick={() => onEdit(project)}
                        className="p-1.5 text-secondary-text hover:text-obsidian hover:bg-surface-alt rounded transition-colors"
                        title="Edit project details"
                        aria-label={`Edit ${project.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(project)}
                        className="p-1.5 text-secondary-text hover:text-status-error hover:bg-status-error-bg rounded transition-colors"
                        title="Remove project"
                        aria-label={`Remove ${project.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE STACKED VIEW (< 768px) ================= */}
      <div className="block md:hidden divide-y divide-border-hairline border-y border-border-hairline">
        {projects.map((project) => {
          const status = getFundingStatus(project.id);
          return (
            <div key={project.id} className="py-4 space-y-3 bg-surface/40 p-3 my-2 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-secondary-text uppercase">
                      {project.id}
                    </span>
                    {project.isPlaceholder && (
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded bg-surface-alt text-secondary-text border border-border-hairline">
                          Sample project
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-display font-medium text-obsidian mt-0.5">
                    {project.name}
                  </h4>
                  <p className="text-xs text-secondary-text mt-0.5">{project.department}</p>
                </div>
                <StatusBadge status={status} size="sm" />
              </div>

              {/* Grid specs */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border-hairline/60">
                <div>
                  <span className="text-secondary-text block text-[10px] uppercase tracking-wider">Estimated Cost</span>
                  <span className="font-semibold text-obsidian tabular-nums">
                    {formatINR(project.cost_inr, { currencyMode: settings.currencyMode })}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-text block text-[10px] uppercase tracking-wider">Benefit Score</span>
                  <span className="font-semibold text-obsidian tabular-nums">
                    {formatBenefitScore(project.benefit_score)} / 100
                  </span>
                </div>
                <div>
                  <span className="text-secondary-text block text-[10px] uppercase tracking-wider">Accessibility</span>
                  <span className="font-medium text-charcoal">
                    {project.accessible ? 'Barrier-Free (ADA)' : 'Standard'}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-text block text-[10px] uppercase tracking-wider">Dependencies</span>
                  <span className="font-medium text-charcoal">
                    {project.dependencies?.length ? project.dependencies.join(', ') : 'None'}
                  </span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border-hairline/60">
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="px-3 py-1 text-xs font-medium text-charcoal bg-surface border border-border-hairline rounded hover:bg-surface-alt"
                >
                  Edit Project
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  className="px-3 py-1 text-xs font-medium text-status-error bg-surface border border-status-error/30 rounded hover:bg-status-error-bg"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


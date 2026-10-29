import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import HeroMetrics from '../components/dashboard/HeroMetrics';
import DepartmentChart from '../components/dashboard/DepartmentChart';
import { useScenario } from '../context/ScenarioContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import { formatINR, formatBenefitScore } from '../utils/formatters';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { 
    projects, 
    lastResult, 
    runOptimization, 
    settings 
  } = useScenario();

  const handleOptimize = async () => {
    try {
      await runOptimization();
      navigate('/results');
    } catch (err) {
      // Handled in context & toast
    }
  };

  return (
    <PageContainer>
      {/* Editorial Page Header */}
      <PageHeader
        eyebrow="CAPITAL BUDGET ALLOCATION & STRATEGY"
        title="Allocate efficiently and effectively"
        description="A considered practical approach to institutional investment and impact"
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => navigate('/projects')}
            >
              Manage Projects ({projects.length})
            </Button>
          </div>
        }
      />

      {/* Hero Metrics & Primary Allocation Panel */}
      <div className="mb-8">
        <HeroMetrics onOptimizeClick={handleOptimize} />
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div>
          <DepartmentChart projects={projects} />
        </div>
      </div>

      {/* Candidate Portfolio Summary Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
          <div>
            <p className="text-editorial-eyebrow text-terracotta mb-0.5">Active Portfolio</p>
            <h3 className="text-xl font-display font-medium text-obsidian">
              Candidate Improvement Initiatives
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/projects')}
          >
            Open Full Project Table
          </Button>
        </div>

        <div className="divide-y divide-border-hairline text-sm">
          {projects.slice(0, 4).map((p) => {
            const isFunded = lastResult?.funded_ids?.includes(p.id);
            return (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] text-secondary-text">{p.id}</span>
                    <span className="font-medium text-obsidian">{p.name}</span>
                    {p.isPlaceholder && (
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-surface-alt text-secondary-text border border-border-hairline">
                        Sample project
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-text">{p.department}</p>
                </div>

                <div className="flex items-center space-x-6 text-xs tabular-nums self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-secondary-text block">Est. Cost</span>
                    <span className="font-semibold text-obsidian">
                      {formatINR(p.cost_inr, { currencyMode: settings.currencyMode })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-secondary-text block">Benefit</span>
                    <span className="font-semibold text-obsidian">{formatBenefitScore(p.benefit_score)}</span>
                  </div>
                  <div className="w-24 text-center">
                    {lastResult ? (
                      <StatusBadge status={isFunded ? 'FUNDED' : 'UNFUNDED'} size="sm" />
                    ) : (
                      <span className="text-secondary-text text-xs italic">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </PageContainer>
  );
}


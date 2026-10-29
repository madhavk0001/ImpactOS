import React, { useState } from 'react';
import { Sliders, RefreshCw, AlertTriangle, Zap, RotateCcw } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function ScenarioEditor({ onRunOptimization }) {
  const { 
    budgetInr, 
    setBudget, 
    resetDemoProjects, 
    isResultStale, 
    isOptimizing,
    settings,
    projects
  } = useScenario();

  const [localBudget, setLocalBudget] = useState(budgetInr);

  const handleBudgetChange = (e) => {
    const val = Number(e.target.value);
    setLocalBudget(val);
    setBudget(val);
  };

  const handleQuickBudgetPreset = (presetInr) => {
    setLocalBudget(presetInr);
    setBudget(presetInr);
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-hairline gap-4">
        <div>
          <p className="text-editorial-eyebrow text-terracotta mb-0.5">Parameters</p>
          <h3 className="text-xl font-display font-medium text-obsidian">
            Scenario Envelope Configuration
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={resetDemoProjects}
            title="Reset to 7 default placeholder projects and ₹5.00 Cr budget"
          >
            Reset Defaults
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Zap}
            isLoading={isOptimizing}
            onClick={onRunOptimization}
          >
            Run Solver
          </Button>
        </div>
      </div>

      {/* Budget Slider & Direct Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="budget-slider" className="text-xs font-semibold text-obsidian uppercase tracking-wider">
            Overall University Capital Budget
          </label>
          <span className="text-2xl font-display font-medium text-obsidian tabular-nums">
            {formatINR(localBudget, { currencyMode: settings.currencyMode })}
          </span>
        </div>

        <input
          id="budget-slider"
          type="range"
          min="10000000" // 1 Cr
          max="100000000" // 10 Cr
          step="2500000" // 25 Lakh
          value={localBudget}
          onChange={handleBudgetChange}
          className="w-full h-2 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-terracotta"
        />

        <div className="flex items-center justify-between text-xs text-secondary-text">
          <span>₹1.00 Cr Min</span>
          <span>₹5.00 Cr Default</span>
          <span>₹10.00 Cr Max</span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-secondary-text mr-1">Quick Envelopes:</span>
          {[
            { label: '₹3.50 Cr (Constrained)', val: 35_000_000 },
            { label: '₹5.00 Cr (Baseline)', val: 50_000_000 },
            { label: '₹6.50 Cr (Expanded)', val: 65_000_000 },
            { label: '₹8.00 Cr (Optimal Growth)', val: 80_000_000 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => handleQuickBudgetPreset(preset.val)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                localBudget === preset.val
                  ? 'bg-burgundy text-page border-burgundy'
                  : 'bg-surface border-border-hairline hover:bg-surface-alt text-charcoal'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input summary stats */}
      <div className="p-4 rounded-lg bg-surface-alt/40 border border-border-hairline text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <span className="text-secondary-text block text-[10px] uppercase">Active Candidates</span>
          <span className="font-semibold text-obsidian">{projects.length} Projects</span>
        </div>
        <div>
          <span className="text-secondary-text block text-[10px] uppercase">Aggregate Candidate Demand</span>
          <span className="font-semibold text-obsidian tabular-nums">
            {formatINR(projects.reduce((sum, p) => sum + p.cost_inr, 0), { currencyMode: settings.currencyMode })}
          </span>
        </div>
        <div>
          <span className="text-secondary-text block text-[10px] uppercase">Input State</span>
          <span className={`font-semibold ${isResultStale ? 'text-status-warning' : 'text-status-success'}`}>
            {isResultStale ? 'Modified (Solver Stale)' : 'Synchronized with Solver'}
          </span>
        </div>
      </div>
    </Card>
  );
}


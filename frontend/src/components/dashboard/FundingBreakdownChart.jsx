import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINR } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import Card from '../ui/Card';

export default function FundingBreakdownChart({ projects = [] }) {
  const { lastResult, budgetInr, settings } = useScenario();

  const isOptimized = Boolean(lastResult);

  // If optimized: funded vs unfunded
  let pieData = [];
  const COLORS = ['#4A2427', '#A79986', '#3E3D38']; // Burgundy, Taupe, Stone charcoal

  if (isOptimized) {
    const fundedCost = lastResult.total_cost_inr;
    const remainingBudget = Math.max(0, budgetInr - fundedCost);
    const unfundedCost = projects
      .filter((p) => !lastResult.funded_ids?.includes(p.id))
      .reduce((sum, p) => sum + p.cost_inr, 0);

    pieData = [
      { name: 'Allocated Capital', value: fundedCost, count: lastResult.funded_ids?.length || 0, color: '#4A2427' },
      { name: 'Unfunded Projects', value: unfundedCost, count: (lastResult.unfunded_ids?.length || 0), color: '#3E3D38' },
      { name: 'Reserve Balance', value: remainingBudget, count: null, color: '#A79986' },
    ];
  } else {
    // Before optimization: Accessible vs Standard candidate capital
    const accessibleCost = projects.filter((p) => p.accessible).reduce((sum, p) => sum + p.cost_inr, 0);
    const standardCost = projects.filter((p) => !p.accessible).reduce((sum, p) => sum + p.cost_inr, 0);

    pieData = [
      { name: 'Accessibility Qualified', value: accessibleCost, count: projects.filter((p) => p.accessible).length, color: '#803E2F' },
      { name: 'Standard Scope', value: standardCost, count: projects.filter((p) => !p.accessible).length, color: '#A79986' },
    ];
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface rounded-lg p-3 border border-border-hairline shadow-elevated text-xs space-y-1">
          <p className="font-semibold text-obsidian flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </p>
          <p className="text-secondary-text">
            Volume: <span className="font-semibold text-charcoal tabular-nums">{formatINR(data.value, { currencyMode: settings.currencyMode })}</span>
          </p>
          {data.count !== null && (
            <p className="text-secondary-text">
              Projects: <span className="font-semibold text-charcoal">{data.count}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-start justify-between pb-4 border-b border-border-hairline mb-2">
        <div>
          <p className="text-editorial-eyebrow text-terracotta mb-0.5">
            {isOptimized ? 'Solver Outcome' : 'Portfolio Composition'}
          </p>
          <h3 className="text-xl font-display font-medium text-obsidian">
            {isOptimized ? 'Funding Status Breakdown' : 'Pre-Optimization Distribution'}
          </h3>
        </div>
      </div>

      <div className="h-56 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FBF8F3" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="pt-2 border-t border-border-hairline space-y-1.5 text-xs">
        {pieData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-secondary-text">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-charcoal font-medium">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2 tabular-nums">
              {item.count !== null && (
                <span className="text-[11px] text-secondary-text">({item.count} prj)</span>
              )}
              <span className="font-semibold text-obsidian">
                {formatINR(item.value, { currencyMode: settings.currencyMode })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


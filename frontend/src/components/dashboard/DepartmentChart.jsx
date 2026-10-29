import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatINR } from '../../utils/formatters';
import { useScenario } from '../../context/ScenarioContext';
import Card from '../ui/Card';

export default function DepartmentChart({ projects = [] }) {
  const { lastResult, settings, isIllustrativeActive } = useScenario();
  const isIllustrative = Boolean(lastResult?.is_illustrative || isIllustrativeActive);

  // Aggregate department requested vs funded
  const deptDataMap = {};

  projects.forEach((p) => {
    const dept = p.department || 'Other';
    if (!deptDataMap[dept]) {
      deptDataMap[dept] = {
        department: dept,
        requestedInr: 0,
        fundedInr: 0,
        projectCount: 0,
        fundedCount: 0,
      };
    }
    deptDataMap[dept].requestedInr += p.cost_inr;
    deptDataMap[dept].projectCount += 1;

    if (lastResult?.funded_ids?.includes(p.id)) {
      deptDataMap[dept].fundedInr += p.cost_inr;
      deptDataMap[dept].fundedCount += 1;
    }
  });

  const chartData = Object.values(deptDataMap);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 border border-border-hairline text-xs space-y-1">
          <p className="font-display font-semibold text-obsidian text-sm border-b border-border-hairline pb-1">
            {label}
          </p>
          <div className="pt-1 space-y-1">
            <p className="text-secondary-text flex items-center justify-between gap-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-taupe inline-block" />
                <span>Requested Capital:</span>
              </span>
              <span className="font-semibold text-charcoal tabular-nums">
                {formatINR(payload[0]?.value, { currencyMode: settings.currencyMode })}
              </span>
            </p>
            {lastResult && payload[1] && (
              <p className="text-terracotta flex items-center justify-between gap-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-burgundy inline-block" />
                  <span>Optimized Allocation:</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {formatINR(payload[1]?.value, { currencyMode: settings.currencyMode })}
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-start justify-between pb-4 border-b border-border-hairline mb-4">
        <div>
          <p className="text-xs text-secondary-text mb-1">Capital by department</p>
          <h3 className="text-xl font-display font-semibold text-obsidian">
            Requested vs allocated
          </h3>
        </div>
        <span className="text-xs text-secondary-text font-sans">
          {isIllustrative ? 'Illustrative preview' : lastResult ? 'Current solver run' : 'Candidate demand'}
        </span>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 18, left: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#D6CCBC" horizontal={false} />
            <XAxis
              type="number"
              stroke="#6B5E55"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatINR(val, { compact: true, currencyMode: settings.currencyMode })}
            />
            <YAxis
              type="category"
              dataKey="department"
              stroke="#6B5E55"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={132}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="left"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
            />
            <Bar
              name="Requested Capital"
              dataKey="requestedInr"
              fill="#A79986" // Warm taupe
              radius={[0, 3, 3, 0]}
              maxBarSize={16}
            />
            {lastResult && (
              <Bar
                name="Optimized Allocation"
                dataKey="fundedInr"
                fill="#4A2427" // Burgundy
                radius={[0, 3, 3, 0]}
                maxBarSize={16}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}


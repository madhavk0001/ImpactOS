import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ScenarioEditor from '../components/scenarios/ScenarioEditor';
import ScenarioDiff from '../components/scenarios/ScenarioDiff';
import { useScenario } from '../context/ScenarioContext';
import Button from '../components/ui/Button';
import { Zap, GitCompare } from 'lucide-react';

export default function ScenariosPage() {
  const { runOptimization, isOptimizing, lastResult } = useScenario();

  const handleRunOptimization = async () => {
    try {
      await runOptimization();
    } catch {
      // Handled in context
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="CAPITAL ENVELOPE & SENSITIVITY MODELLING"
        title="Scenario Planning &"
        italicAccent="Sensitivity Analysis"
        description="Adjust funding envelopes and candidate project sets to evaluate downstream allocation changes, compare trade-offs against baseline models, and detect stale parameters."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Zap}
            isLoading={isOptimizing}
            onClick={handleRunOptimization}
          >
            {lastResult ? 'Rerun Scenario' : 'Solve Scenario'}
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Scenario Editor Panel */}
        <ScenarioEditor onRunOptimization={handleRunOptimization} />

        {/* Comparative Scenario Differential Panel */}
        <ScenarioDiff />
      </div>
    </PageContainer>
  );
}


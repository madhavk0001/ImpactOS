import React, { useState } from 'react';
import { 
  Sliders, 
  Server, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Info,
  Sparkles
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useScenario } from '../context/ScenarioContext';
import { formatINR } from '../utils/formatters';

export default function SettingsPage() {
  const { 
    settings, 
    updateSettings, 
    backendStatus, 
    testBackendConnection,
    isIllustrativeActive,
    toggleIllustrative 
  } = useScenario();

  const [apiUrl, setApiUrl] = useState(settings.apiUrl || 'http://localhost:8000');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    updateSettings({ apiUrl: apiUrl.trim() });
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testBackendConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({ connected: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="APPLICATION PREFERENCES"
        title="System &"
        italicAccent="Configuration"
        description="Manage financial display notations, display density, and verify Python FastAPI optimization backend connectivity."
      />

      <div className="max-w-3xl space-y-8">
        
        {/* 1. Currency & Financial Notation */}
        <Card className="space-y-4">
          <div className="pb-3 border-b border-border-hairline">
            <h3 className="text-lg font-display font-medium text-obsidian">
              Currency & Numeric Formatting
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">
              Choose how financial capital amounts are rendered across tables, metric cards, and charts.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'INR_LAKH_CRORE',
                label: 'Indian Lakh & Crore Notation (Standard Default)',
                desc: 'Amounts formatted as ₹1.25 Cr, ₹68.00 L. Matches institutional budget practices in India.',
                example: '₹1,25,00,000 → ₹1.25 Cr',
              },
              {
                id: 'INR_FULL',
                label: 'Indian Rupee Full Delimited',
                desc: 'Full comma-separated Indian numbering system.',
                example: '₹1,25,00,000',
              },
              {
                id: 'USD_MILLIONS',
                label: 'International USD Notation ($ / M / K)',
                desc: 'Illustrative international convention ($1 ~ ₹83). Useful for global academic boards.',
                example: '$1.51M / $820.0K',
              },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-start p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  settings.currencyMode === option.id
                    ? 'bg-surface-alt/70 border-burgundy'
                    : 'bg-surface border-border-hairline hover:bg-surface-alt/40'
                }`}
              >
                <input
                  type="radio"
                  name="currencyMode"
                  value={option.id}
                  checked={settings.currencyMode === option.id}
                  onChange={() => updateSettings({ currencyMode: option.id })}
                  className="mt-1 h-4 w-4 text-terracotta border-border-hairline focus:ring-terracotta"
                />
                <div className="ml-3 text-xs">
                  <span className="font-semibold text-obsidian block">{option.label}</span>
                  <span className="text-secondary-text block mt-0.5">{option.desc}</span>
                  <span className="text-[11px] font-mono text-terracotta font-medium block mt-1">
                    Preview: {option.example}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* 2. Display Density */}
        <Card className="space-y-4">
          <div className="pb-3 border-b border-border-hairline">
            <h3 className="text-lg font-display font-medium text-obsidian">
              Display Density
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">
              Control spacing scale for tables and metric lists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'comfortable',
                label: 'Comfortable (Editorial)',
                desc: 'Generous padding matching Armonia & Elias Varr design aesthetic.',
              },
              {
                id: 'compact',
                label: 'Compact (High-Density)',
                desc: 'Tighter row padding for high-volume portfolio review.',
              },
            ].map((d) => (
              <label
                key={d.id}
                className={`flex items-start p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  settings.displayDensity === d.id
                    ? 'bg-surface-alt/70 border-burgundy'
                    : 'bg-surface border-border-hairline hover:bg-surface-alt/40'
                }`}
              >
                <input
                  type="radio"
                  name="displayDensity"
                  value={d.id}
                  checked={settings.displayDensity === d.id}
                  onChange={() => updateSettings({ displayDensity: d.id })}
                  className="mt-1 h-4 w-4 text-terracotta border-border-hairline focus:ring-terracotta"
                />
                <div className="ml-3 text-xs">
                  <span className="font-semibold text-obsidian block">{d.label}</span>
                  <span className="text-secondary-text block mt-0.5">{d.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* 3. Backend Optimization Engine URL */}
        <Card className="space-y-4">
          <div className="pb-3 border-b border-border-hairline">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-medium text-obsidian">
                Optimization Backend Integration
              </h3>
              {backendStatus.connected ? (
                <span className="inline-flex items-center text-xs text-status-success font-semibold bg-status-success-bg px-2.5 py-0.5 rounded-full border border-status-success/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center text-xs text-taupe-dark font-medium bg-surface-alt px-2.5 py-0.5 rounded-full border border-border-hairline">
                  Disconnected (Demo Mode)
                </span>
              )}
            </div>
            <p className="text-xs text-secondary-text mt-0.5">
              Specify the base URL of the Python FastAPI server handling Google OR-Tools optimization.
            </p>
          </div>

          <form onSubmit={handleSaveApiUrl} className="space-y-3">
            <div>
              <label htmlFor="api-base-url" className="block text-editorial-eyebrow text-secondary-text mb-1">
                Backend Target Base URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="api-base-url"
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded bg-surface border border-border-hairline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                  >
                    Save URL
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={RefreshCw}
                    isLoading={isTesting}
                    onClick={handleTestConnection}
                  >
                    Test Connection
                  </Button>
                </div>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded text-xs border ${
                testResult.connected 
                  ? 'bg-status-success-bg/60 border-status-success/30 text-status-success font-medium'
                  : 'bg-status-error-bg/60 border-status-error/30 text-status-error'
              }`}>
                {testResult.connected ? (
                  <span>Connection successful: Backend verified via GET /health.</span>
                ) : (
                  <span>Failed to connect to {apiUrl}. Check that the FastAPI server is running with CORS enabled.</span>
                )}
              </div>
            )}
          </form>
        </Card>

        {/* 4. Demo Mode & Illustrative Preview Disclosure */}
        <Card variant="alt" className="space-y-3">
          <div className="flex items-start space-x-3 text-xs">
            <Info className="w-5 h-5 text-taupe-dark shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-obsidian uppercase tracking-wider">
                Demo Mode Architectural Disclosure
              </p>
              <p className="text-secondary-text leading-relaxed">
                ImpactOS operates in a transparent demo mode when the optimization backend is not running. All sample data is isolated in dedicated fixture files and clearly labelled. The frontend never runs a competing heuristic solver in JavaScript.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border-hairline flex items-center justify-between text-xs">
            <span className="text-secondary-text font-medium">Illustrative Sample Preview Fixture:</span>
            <Button
              variant={isIllustrativeActive ? 'danger-outline' : 'secondary'}
              size="sm"
              icon={Sparkles}
              onClick={() => toggleIllustrative(!isIllustrativeActive)}
            >
              {isIllustrativeActive ? 'Disable Sample Preview' : 'Enable Sample Preview'}
            </Button>
          </div>
        </Card>

      </div>
    </PageContainer>
  );
}


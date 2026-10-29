import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useScenario();

  const [email, setEmail] = useState('vance@impactos.edu');
  const [password, setPassword] = useState('demo123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginUser({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('demo123');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-page">
      
      {/* ================= LEFT PANEL: OBSIDIAN BRANDING ================= */}
      <div className="w-full md:w-5/12 lg:w-1/2 bg-obsidian text-page p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-obsidian-light relative overflow-hidden">
        {/* Top Monogram */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 bg-page text-obsidian flex items-center justify-center font-display font-bold text-xl">
            I
          </div>
          <div className="flex items-baseline">
            <span className="font-display font-medium text-3xl tracking-tight text-page">
              Impact
            </span>
            <span className="font-sans font-bold text-xs uppercase tracking-[0.25em] text-terracotta ml-1">
              OS
            </span>
          </div>
        </div>

        {/* Editorial Statement */}
        <div className="relative z-10 my-12 space-y-4 max-w-md">
          <p className="text-editorial-eyebrow text-taupe-light">
            Capital-Budget Allocation & Decision Support
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-light text-page leading-[1.15]">
            Optimizing university resources with <em className="italic font-normal text-taupe-light">mathematical rigor.</em>
          </h2>
          <p className="text-xs sm:text-sm text-taupe font-normal leading-relaxed pt-2">
            Providing senior administrators, provosts, and facilities directors with transparent, auditable trade-off analytics for capital-budget allocations.
          </p>
        </div>

        {/* Mandatory Demo Disclosure Badge */}
        <div className="relative z-10 p-3.5 border-y border-white/10 text-xs text-taupe space-y-1">
          <div className="flex items-center space-x-2 text-status-warning font-semibold uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Local demo access, not real authentication</span>
          </div>
          <p className="text-[11px] text-taupe leading-relaxed">
            This session uses an extensible local authentication adapter. Production deployments integrate with institutional SAML2/CAS or OpenID Connect identity providers.
          </p>
        </div>
      </div>

      {/* ================= RIGHT PANEL: LOGIN FORM ================= */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          <div>
            <p className="text-editorial-eyebrow text-terracotta mb-1">Session Access</p>
            <h1 className="text-3xl font-display font-medium text-obsidian">
              Sign In to ImpactOS
            </h1>
            <p className="text-xs sm:text-sm text-secondary-text mt-1">
              Authenticate to manage portfolio models and execute optimization runs.
            </p>
          </div>

          {error && (
            <div 
              role="alert" 
              className="p-3.5 rounded-lg bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center space-x-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-editorial-eyebrow text-secondary-text mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded bg-surface border border-border-hairline text-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="text-editorial-eyebrow text-secondary-text">
                  Password
                </label>
                <span className="text-[11px] text-secondary-text italic">
                  (Demo: any password &gt; 3 chars)
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded bg-surface border border-border-hairline text-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full py-3"
            >
              Access Planning Workspace
            </Button>
          </form>

          {/* Quick Demo Credentials Preset Selector */}
          <div className="pt-4 border-t border-border-hairline">
            <span className="text-editorial-eyebrow text-secondary-text block mb-2">
              Quick-Fill Demo Roles:
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('vance@impactos.edu')}
                className="w-full text-left p-2.5 rounded bg-surface hover:bg-surface-alt border border-border-hairline text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-obsidian block">Prof. Alistair Vance</span>
                  <span className="text-secondary-text text-[11px]">Dean of Institutional Planning</span>
                </div>
                <span className="text-[11px] font-mono text-terracotta">vance@impactos.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('provost@impactos.edu')}
                className="w-full text-left p-2.5 rounded bg-surface hover:bg-surface-alt border border-border-hairline text-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-obsidian block">Dr. Sarah Higgins</span>
                  <span className="text-secondary-text text-[11px]">Vice Provost of Academic Resources</span>
                </div>
                <span className="text-[11px] font-mono text-terracotta">provost@impactos.edu</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}


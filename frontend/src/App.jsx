import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ScenarioProvider } from './context/ScenarioContext';
import TopNavbar from './components/layout/TopNavbar';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import OptimizationResultsPage from './pages/OptimizationResultsPage';
import ScenariosPage from './pages/ScenariosPage';
import AuditReportsPage from './pages/AuditReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

function AppLayout({ children }) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-page text-charcoal">
      {/* Mandatory Top Navbar (No permanent left sidebar anywhere) */}
      <TopNavbar />

      {/* Main Routed Page Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Editorial Footer */}
      <footer className="border-t border-border-hairline bg-page py-6 text-xs text-secondary-text">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-display font-medium text-obsidian text-sm">ImpactOS</span>
            <span>— University Capital Budget Allocation & Decision Support</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Google OR-Tools & Python FastAPI Integration Layer</span>
            <span className="text-border-hairline">•</span>
            <span>Local Demo Mode Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ScenarioProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/results" element={<OptimizationResultsPage />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/reports" element={<AuditReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ScenarioProvider>
  );
}


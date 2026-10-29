import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-editorial-eyebrow text-terracotta mb-2">404 Error</p>
        <h1 className="text-4xl sm:text-5xl font-display font-medium text-obsidian mb-3">
          Page Not Found
        </h1>
        <p className="text-sm text-secondary-text max-w-md mb-8">
          The requested URL path does not correspond to an active module in the ImpactOS capital planning suite.
        </p>
        <Link to="/">
          <Button variant="primary" icon={Home}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}


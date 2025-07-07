
import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { ReceitasManager } from '@/components/ReceitasManager';
import { ContasManager } from '@/components/ContasManager';
import { InvestimentosManager } from '@/components/InvestimentosManager';
import { ReceitasEvolution } from '@/components/charts/ReceitasEvolution';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <Dashboard />
            <ReceitasEvolution />
          </div>
        );
      case 'receitas':
        return <ReceitasManager />;
      case 'contas':
        return <ContasManager />;
      case 'investimentos':
        return <InvestimentosManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;

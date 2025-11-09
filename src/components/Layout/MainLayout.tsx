import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigation } from './Navigation';
import { Dashboard } from '../Dashboard/Dashboard';
import { GoalsList } from '../Goals/GoalsList';
import { ExpensesList } from '../Expenses/ExpensesList';
import { MonthlyReports } from '../Reports/MonthlyReports';
import { ProfileSetup } from '../Profile/ProfileSetup';

export function MainLayout() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'goals':
        return <GoalsList />;
      case 'expenses':
        return <ExpensesList />;
      case 'reports':
        return <MonthlyReports />;
      case 'profile':
        return <ProfileSetup />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

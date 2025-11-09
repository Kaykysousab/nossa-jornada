import { Home, Target, ShoppingCart, BarChart3, User, LogOut } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function Navigation({ activeTab, onTabChange, onLogout }: NavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'expenses', label: 'Despesas', icon: ShoppingCart },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">NJ</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Nossa Jornada</h1>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>

        <div className="md:hidden flex overflow-x-auto gap-2 pb-3 -mx-4 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white'
                    : 'text-gray-600 bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

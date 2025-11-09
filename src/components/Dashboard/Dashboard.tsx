import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Goal, Expense } from '../../types/database';

export function Dashboard() {
  const { couple } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [monthExpenses, setMonthExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (couple) {
      loadDashboardData();
    }
  }, [couple]);

  const loadDashboardData = async () => {
    if (!couple) return;

    try {
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('couple_id', couple.id)
        .gte('expense_date', `${currentMonth}-01`)
        .lte('expense_date', `${currentMonth}-31`);

      if (goalsData) {
        setGoals(goalsData);
        const total = goalsData.reduce((sum, goal) => sum + Number(goal.current_amount), 0);
        setTotalSavings(total);
      }

      if (expensesData) {
        const total = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
        setMonthExpenses(total);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = () => {
    return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getGreeting = () => {
    if (!couple) return 'Olá!';
    const names = [couple.user1_name, couple.user2_name].filter(Boolean).join(' e ');
    return `Olá, ${names}!`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-400 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">{getGreeting()}</h1>
        <p className="text-rose-100">Cada real poupado é um passo mais perto dos nossos sonhos!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="text-green-600" size={24} />
            </div>
            <span className="text-sm text-gray-500">Total Economizado</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">
            R$ {totalSavings.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-2">{goals.length} meta(s) ativa(s)</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <span className="text-sm text-gray-500">Gastos do Mês</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">
            R$ {monthExpenses.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-2 capitalize">{getMonthName()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <span className="text-sm text-gray-500">Progresso</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">
            {goals.length > 0 ? (
              <>
                {Math.round((goals.reduce((sum, g) => sum + (Number(g.current_amount) / Number(g.target_amount) * 100), 0) / goals.length))}%
              </>
            ) : '0%'}
          </div>
          <p className="text-sm text-gray-600 mt-2">Média das metas</p>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Suas Metas</h3>
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => {
              const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
              return (
                <div key={goal.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">{goal.name}</h4>
                    <span className="text-sm text-gray-600">
                      R$ {Number(goal.current_amount).toFixed(2)} / R$ {Number(goal.target_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-rose-400 to-pink-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{progress.toFixed(1)}% concluído</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma meta ainda</h3>
          <p className="text-gray-600 mb-4">Comece criando sua primeira meta para começar a economizar!</p>
        </div>
      )}
    </div>
  );
}

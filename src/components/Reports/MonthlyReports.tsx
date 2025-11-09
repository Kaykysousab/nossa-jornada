import { useEffect, useState } from 'react';
import { BarChart3, PieChart, DollarSign, TrendingDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Expense } from '../../types/database';

export function MonthlyReports() {
  const { couple } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    if (couple) {
      loadExpenses();
    }
  }, [couple, selectedMonth]);

  const loadExpenses = async () => {
    if (!couple) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('couple_id', couple.id)
        .gte('expense_date', `${selectedMonth}-01`)
        .lte('expense_date', `${selectedMonth}-31`)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  };

  const getExpensesByCategory = () => {
    const byCategory: Record<string, number> = {};
    expenses.forEach((exp) => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + Number(exp.amount);
    });
    return Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getExpensesByPerson = () => {
    const byPerson: Record<string, number> = {};
    expenses.forEach((exp) => {
      byPerson[exp.paid_by] = (byPerson[exp.paid_by] || 0) + Number(exp.amount);
    });
    return byPerson;
  };

  const calculateBalance = () => {
    const byPerson = getExpensesByPerson();
    const user1Spent = byPerson[couple?.user1_name || ''] || 0;
    const user2Spent = byPerson[couple?.user2_name || ''] || 0;
    const sharedSpent = byPerson['Dividimos'] || 0;

    const user1Total = user1Spent + sharedSpent / 2;
    const user2Total = user2Spent + sharedSpent / 2;

    return { user1Total, user2Total, difference: user1Total - user2Total };
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Alimentação': 'bg-green-500',
      'Casa': 'bg-blue-500',
      'Lazer': 'bg-purple-500',
      'Saúde': 'bg-red-500',
      'Transporte': 'bg-orange-500',
      'Outros': 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  const categoryExpenses = getExpensesByCategory();
  const totalExpenses = getTotalExpenses();
  const balance = calculateBalance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Relatórios Mensais</h2>
          <p className="text-gray-600">Visão completa das suas finanças</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
        />
      </div>

      <div className="bg-gradient-to-r from-rose-400 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign size={32} />
          <h3 className="text-2xl font-bold">Total Gasto no Mês</h3>
        </div>
        <div className="text-5xl font-bold mb-2">R$ {totalExpenses.toFixed(2)}</div>
        <p className="text-rose-100">{expenses.length} despesas registradas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <PieChart className="text-purple-600" size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Gastos por Categoria</h3>
          </div>

          {categoryExpenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma despesa registrada</p>
          ) : (
            <div className="space-y-4">
              {categoryExpenses.map(({ category, amount }) => {
                const percentage = (amount / totalExpenses) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">{category}</span>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">R$ {amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${getCategoryColor(category)} h-3 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Divisão de Gastos</h3>
          </div>

          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma despesa registrada</p>
          ) : (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{couple?.user1_name}</span>
                  <span className="font-bold text-gray-800">R$ {balance.user1Total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Total com despesas compartilhadas
                </div>
              </div>

              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{couple?.user2_name || 'Parceiro(a)'}</span>
                  <span className="font-bold text-gray-800">R$ {balance.user2Total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Total com despesas compartilhadas
                </div>
              </div>

              <div className="bg-rose-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Saldo</h4>
                {Math.abs(balance.difference) < 0.01 ? (
                  <p className="text-green-600">Vocês estão em dia!</p>
                ) : balance.difference > 0 ? (
                  <p className="text-gray-700">
                    {couple?.user2_name || 'Parceiro(a)'} deve{' '}
                    <span className="font-bold">R$ {Math.abs(balance.difference).toFixed(2)}</span>{' '}
                    para {couple?.user1_name}
                  </p>
                ) : (
                  <p className="text-gray-700">
                    {couple?.user1_name} deve{' '}
                    <span className="font-bold">R$ {Math.abs(balance.difference).toFixed(2)}</span>{' '}
                    para {couple?.user2_name || 'Parceiro(a)'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

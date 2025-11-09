import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Expense } from '../../types/database';
import { ExpenseModal } from './ExpenseModal';
import { CategoryIcon } from './CategoryIcon';

export function ExpensesList() {
  const { couple } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Despesas</h2>
          <p className="text-gray-600">Controle dos gastos do casal</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-500 hover:to-pink-600 transition"
          >
            <Plus size={20} />
            Nova Despesa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Total do Mês</h3>
          <div className="text-3xl font-bold text-gray-800">
            R$ {getTotalExpenses().toFixed(2)}
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ShoppingCart className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma despesa registrada</h3>
          <p className="text-gray-600 mb-6">Comece a registrar suas despesas para ter um controle financeiro completo!</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-500 hover:to-pink-600 transition"
          >
            <Plus size={20} />
            Registrar Primeira Despesa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <CategoryIcon category={expense.category} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{expense.description}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="bg-gray-100 px-2 py-1 rounded">{expense.category}</span>
                        <span>{formatDate(expense.expense_date)}</span>
                        <span>Pago por: {expense.paid_by}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-800">
                    R$ {Number(expense.amount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <ExpenseModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadExpenses();
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Target, Plus, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Goal, Contribution } from '../../types/database';
import { GoalModal } from './GoalModal';
import { ContributionModal } from './ContributionModal';

export function GoalsList() {
  const { couple } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);

  useEffect(() => {
    if (couple) {
      loadGoals();
    }
  }, [couple]);

  const loadGoals = async () => {
    if (!couple) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowContributionModal(true);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Sem prazo';
    return new Date(date).toLocaleDateString('pt-BR');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Nossas Metas</h2>
          <p className="text-gray-600">Sonhos que estamos construindo juntos</p>
        </div>
        <button
          onClick={() => setShowGoalModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-500 hover:to-pink-600 transition"
        >
          <Plus size={20} />
          Novo Sonho
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Target className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma meta ainda</h3>
          <p className="text-gray-600 mb-6">Crie sua primeira meta e comece a economizar juntos!</p>
          <button
            onClick={() => setShowGoalModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-500 hover:to-pink-600 transition"
          >
            <Plus size={20} />
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
            const remaining = Number(goal.target_amount) - Number(goal.current_amount);

            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                {goal.inspiration_photo_url && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={goal.inspiration_photo_url}
                      alt={goal.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{goal.name}</h3>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Meta:</span>
                      <span className="font-semibold text-gray-800">
                        R$ {Number(goal.target_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Economizado:</span>
                      <span className="font-semibold text-green-600">
                        R$ {Number(goal.current_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Falta:</span>
                      <span className="font-semibold text-rose-600">
                        R$ {remaining.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progresso</span>
                      <span className="text-sm font-bold text-gray-800">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-rose-400 to-pink-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Calendar size={16} />
                      <span>Data alvo: {formatDate(goal.target_date)}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleAddContribution(goal)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white py-2.5 rounded-lg font-semibold hover:from-rose-500 hover:to-pink-600 transition"
                  >
                    <TrendingUp size={18} />
                    Adicionar Economia
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showGoalModal && (
        <GoalModal
          onClose={() => setShowGoalModal(false)}
          onSuccess={() => {
            setShowGoalModal(false);
            loadGoals();
          }}
        />
      )}

      {showContributionModal && selectedGoal && (
        <ContributionModal
          goal={selectedGoal}
          onClose={() => {
            setShowContributionModal(false);
            setSelectedGoal(null);
          }}
          onSuccess={() => {
            setShowContributionModal(false);
            setSelectedGoal(null);
            loadGoals();
          }}
        />
      )}
    </div>
  );
}

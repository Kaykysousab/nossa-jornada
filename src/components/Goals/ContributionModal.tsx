import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Goal } from '../../types/database';

interface ContributionModalProps {
  goal: Goal;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContributionModal({ goal, onClose, onSuccess }: ContributionModalProps) {
  const { couple } = useAuth();
  const [amount, setAmount] = useState('');
  const [contributedBy, setContributedBy] = useState(couple?.user1_name || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple) return;

    setLoading(true);
    setError('');

    try {
      const contributionAmount = parseFloat(amount);

      const { error: contributionError } = await supabase
        .from('contributions')
        .insert({
          goal_id: goal.id,
          amount: contributionAmount,
          contributed_by: contributedBy,
          notes: notes || null,
        });

      if (contributionError) throw contributionError;

      const newCurrentAmount = Number(goal.current_amount) + contributionAmount;
      const { error: updateError } = await supabase
        .from('goals')
        .update({ current_amount: newCurrentAmount })
        .eq('id', goal.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar contribuição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Adicionar Economia</h3>
              <p className="text-sm text-gray-600 mt-1">{goal.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
                placeholder="50.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quem está contribuindo?
              </label>
              <select
                value={contributedBy}
                onChange={(e) => setContributedBy(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
                required
              >
                <option value={couple?.user1_name}>{couple?.user1_name}</option>
                {couple?.user2_name && (
                  <option value={couple.user2_name}>{couple.user2_name}</option>
                )}
                <option value="Nós dois">Nós dois</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
                rows={3}
                placeholder="Alguma observação sobre essa economia..."
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-rose-500 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Heart, Calendar, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ProfileSetup() {
  const { couple, refreshCouple } = useAuth();
  const [partnerName, setPartnerName] = useState(couple?.user2_name || '');
  const [relationshipDate, setRelationshipDate] = useState(couple?.relationship_start_date || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('couples')
        .update({
          user2_name: partnerName || null,
          relationship_start_date: relationshipDate || null,
        })
        .eq('id', couple.id);

      if (error) throw error;

      await refreshCouple();
      setMessage('Perfil atualizado com sucesso!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!couple) return null;

  const isComplete = couple.user2_name && couple.relationship_start_date;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
          <Heart className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Perfil do Casal</h2>
          <p className="text-gray-600 text-sm">Configure as informações de vocês</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Seu Nome
            </label>
            <input
              type="text"
              value={couple.user1_name}
              disabled
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Nome do(a) Parceiro(a)
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
              placeholder="Nome dele(a)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={16} className="inline mr-1" />
            Data de Início do Relacionamento
          </label>
          <input
            type="date"
            value={relationshipDate}
            onChange={(e) => setRelationshipDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
          />
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm ${
            message.includes('sucesso')
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-rose-500 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : 'Salvar Perfil'}
        </button>

        {!isComplete && (
          <p className="text-center text-sm text-gray-500">
            Complete seu perfil para aproveitar melhor o app!
          </p>
        )}
      </form>
    </div>
  );
}

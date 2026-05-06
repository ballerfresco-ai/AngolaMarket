import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Withdrawal } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { CreditCard, Check, X, Clock, AlertCircle } from 'lucide-react';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  async function fetchWithdrawals() {
    const { data } = await supabase
      .from('withdrawals')
      .select('*, user:users(full_name, email)')
      .order('created_at', { ascending: false });
    
    if (data) setWithdrawals(data as any);
    setLoading(false);
  }

  async function handleAction(id: string, status: 'APROVADO' | 'REJEITADO') {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status } : w));
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando levantamentos...</div>;

  const pendingCount = withdrawals.filter(w => w.status === 'PENDENTE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Pedidos de Saque</h2>
          <p className="text-zinc-500 text-sm">Gira os pedidos de levantamento de produtores e afiliados.</p>
        </div>
        <div className="bg-orange-600/10 text-orange-600 px-4 py-1 rounded-full text-xs font-bold border border-orange-600/20">
          {pendingCount} Pendentes
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Utilizador</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Montante</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Método / Detalhes</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {withdrawals.map((withdrawal: any) => (
                <tr key={withdrawal.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{withdrawal.user?.full_name}</p>
                    <p className="text-xs text-zinc-500">{withdrawal.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 font-black text-red-500">
                    {formatCurrency(withdrawal.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-300">{withdrawal.payment_method}</span>
                      <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{withdrawal.payment_details}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {formatDate(withdrawal.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      withdrawal.status === 'APROVADO' 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : withdrawal.status === 'REJEITADO'
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {withdrawal.status === 'PENDENTE' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleAction(withdrawal.id, 'APROVADO')}
                          className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-white"
                          title="Aprovar Saque"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAction(withdrawal.id, 'REJEITADO')}
                          className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors text-white"
                          title="Rejeitar Saque"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {withdrawal.status !== 'PENDENTE' && (
                      <span className="text-xs text-zinc-600">Concluído</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {withdrawals.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              Nenhum pedido de saque encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

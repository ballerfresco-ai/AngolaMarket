import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  CreditCard,
  TrendingUp,
  History,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import WithdrawModal from '../WithdrawModal';

export default function ProducerWallet({ user }: { user: User }) {
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [{ data: walletData }, { data: withdrawData }] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', user.id).single(),
        supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (walletData) setWallet(walletData);
      if (withdrawData) setWithdrawals(withdrawData);
    } catch (err: any) {
      console.error('Erro ao buscar dados da carteira:', err);
    } finally {
      setLoading(false);
    }
  }

  const statusConfig: any = {
    'PENDENTE': { label: 'Em Análise', shadow: 'shadow-yellow-500/20', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
    'APROVADO': { label: 'Pago', shadow: 'shadow-green-500/20', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
    'REJEITADO': { label: 'Rejeitado', shadow: 'shadow-red-500/20', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 italic">A carregar os seus dados financeiros...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <WithdrawModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)} 
        balance={wallet?.balance || 0}
        userId={user.id}
        onSuccess={fetchData}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-red-600" />
            Minha Carteira
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Gira os seus ganhos e solicite pagamentos de forma rápida.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-red-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-red-600/40 min-h-[240px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <Wallet className="w-40 h-40" />
          </div>
          
          <div className="relative z-10">
            <p className="text-red-100 font-bold uppercase tracking-widest text-xs opacity-80 mb-2">Saldo Total Disponível</p>
            <h3 className="text-5xl font-black tracking-tighter">{formatCurrency(wallet?.balance || 0)}</h3>
          </div>

          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="relative z-10 w-full md:w-auto bg-white text-red-600 hover:bg-red-50 px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Solicitar Saque
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between border-dashed">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-zinc-500">
                <AlertCircle className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Informações de Saque</p>
             </div>
             <p className="text-sm text-zinc-400 leading-relaxed font-medium">
               O valor mínimo para saque é de <span className="text-zinc-100 font-black">1.000 Kz</span>. 
               Os pagamentos são processados em até <span className="text-zinc-100 font-black">24 horas úteis</span> após a solicitação.
             </p>
             <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                   <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Total Sacado</p>
                   <p className="text-lg font-black text-zinc-300">
                     {formatCurrency(withdrawals.filter(w => w.status === 'APROVADO').reduce((acc, w) => acc + w.amount, 0))}
                   </p>
                </div>
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                   <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Em Análise</p>
                   <p className="text-lg font-black text-zinc-300">
                     {formatCurrency(withdrawals.filter(w => w.status === 'PENDENTE').reduce((acc, w) => acc + w.amount, 0))}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <History className="w-5 h-5 text-zinc-500" />
          <h3 className="font-black text-lg tracking-tight">Histórico de Saques</h3>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest tracking-widest">Método</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-medium">
              {withdrawals.map((w) => {
                const StatusIcon = statusConfig[w.status]?.icon || Clock;
                return (
                  <tr key={w.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {formatDate(w.created_at)}
                    </td>
                    <td className="px-6 py-4 font-black text-white tracking-tighter">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded-lg text-zinc-400 font-bold uppercase tracking-widest">
                         {w.payment_method}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1.5 shadow-sm ${statusConfig[w.status]?.color} ${statusConfig[w.status]?.shadow}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[w.status]?.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-zinc-500 italic">
                    Nenhum saque solicitado até ao momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

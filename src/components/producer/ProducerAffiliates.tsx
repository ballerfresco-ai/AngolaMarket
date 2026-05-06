import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, AffiliateRequest } from '../../types';
import { Handshake, CheckCircle2, XCircle, Clock, User as UserIcon, Tag, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ProducerAffiliates({ user }: { user: User }) {
  const [requests, setRequests] = useState<AffiliateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [user.id]);

  async function fetchRequests() {
    const { data } = await supabase
      .from('affiliate_requests')
      .select('*, affiliate:users!affiliate_id(*), product:products(*)')
      .order('created_at', { ascending: false });
    
    // Filter by producer products manually if query joining is complex for RLS
    const filteredRows = (data as any[])?.filter(r => r.product.producer_id === user.id) || [];
    setRequests(filteredRows);
    setLoading(false);
  }

  async function handleAction(requestId: string, status: 'APROVADO' | 'REJEITADO') {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('affiliate_requests')
        .update({ status })
        .eq('id', requestId);
      
      if (error) throw error;
      setRequests(requests.map(r => r.id === requestId ? { ...r, status } : r));
    } catch (err: any) {
      alert('Erro ao processar solicitação: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDENTE');
  const activeAffiliates = requests.filter(r => r.status === 'APROVADO');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Gerir Afiliados</h2>
        <p className="text-zinc-500 text-sm">Controle quem pode promover os seus produtos e acompanhe seus parceiros.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Solicitações Pendentes */}
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Solicitações Pendentes ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 shrink-0">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{(request as any).affiliate?.full_name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Afiliado Interessado</p>
                  </div>
                </div>
                
                <div className="bg-zinc-950 border border-zinc-800/50 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img src={(request as any).product?.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{(request as any).product?.name}</p>
                    <p className="text-[10px] text-zinc-500">{(request as any).product?.category}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    disabled={!!processingId}
                    onClick={() => handleAction(request.id, 'APROVADO')}
                    className="flex-1 py-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-xl text-xs font-black transition-all border border-green-600/20"
                  >
                    Aprovar
                  </button>
                  <button 
                    disabled={!!processingId}
                    onClick={() => handleAction(request.id, 'REJEITADO')}
                    className="flex-1 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-black transition-all border border-red-600/20"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <div className="py-12 text-center bg-zinc-900 border border-dashed border-zinc-800 rounded-3xl text-zinc-600 text-sm">
                Nenhuma solicitação pendente.
              </div>
            )}
          </div>
        </div>

        {/* Afiliados Ativos */}
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Handshake className="w-4 h-4 text-green-500" />
            Afiliados Ativos ({activeAffiliates.length})
          </h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            {activeAffiliates.map((item) => (
              <div key={item.id} className="p-4 border-b border-zinc-800 last:border-0 flex items-center justify-between group hover:bg-zinc-800/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{(item as any).affiliate?.full_name}</p>
                    <p className="text-[10px] text-zinc-500">Promovendo: <span className="text-zinc-300">{(item as any).product?.name}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAction(item.id, 'REJEITADO')}
                  className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remover Afiliação"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
            {activeAffiliates.length === 0 && (
              <div className="py-12 text-center text-zinc-600 text-sm">
                Ainda não tem parceiros afiliados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

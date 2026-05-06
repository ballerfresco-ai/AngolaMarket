import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { Package, Link as LinkIcon, Copy, ExternalLink, Tag, Loader2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AffiliateLinks({ user }: { user: User }) {
  const [affiliations, setAffiliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAffiliations();
  }, [user.id]);

  async function fetchAffiliations() {
    const { data } = await supabase
      .from('affiliate_requests')
      .select('*, product:products(*)')
      .eq('affiliate_id', user.id)
      .eq('status', 'APROVADO');
    
    if (data) setAffiliations(data);
    setLoading(false);
  }

  const copyLink = (productId: string) => {
    const link = `${window.location.origin}/product/${productId}?ref=${user.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Minhas Afiliações</h2>
        <p className="text-zinc-500 text-sm">Gerencie seus links de afiliado e acompanhe seus produtos ativos.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : affiliations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {affiliations.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-red-600/30 transition-all">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                <img src={item.product?.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h3 className="font-bold text-white mb-1 truncate">{item.product?.name}</h3>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="text-xs font-black text-red-600 uppercase tracking-widest">
                    {((item.product?.affiliate_commission_rate || 0) * 100).toFixed(0)}% Comissão
                  </div>
                  <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                    Preço: {formatCurrency(item.product?.price || 0)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-mono text-zinc-500 w-full md:w-64 overflow-hidden">
                  <span className="truncate">{window.location.origin}/product/{item.product_id}?ref={user.id}</span>
                </div>
                <button 
                  onClick={() => copyLink(item.product_id)}
                  className={`p-3 rounded-xl transition-all ${copiedId === item.product_id ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  {copiedId === item.product_id ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <a 
                  href={`/product/${item.product_id}?ref=${user.id}`}
                  target="_blank"
                  className="p-3 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-zinc-900 border border-dashed border-zinc-800 rounded-3xl">
          <LinkIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold mb-4">Você ainda não tem afiliações aprovadas.</p>
          <button 
            onClick={() => {/* Navigate to browse */}}
            className="px-6 py-2 bg-red-600 text-white font-black text-xs rounded-xl uppercase tracking-widest hover:bg-red-700 transition-all"
          >
            Explorar Produtos
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, User } from '../../types';
import { Package, Search, Tag, ExternalLink, Handshake, Loader2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AffiliateBrowseProducts({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchMyRequests();
  }, [user.id]);

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'APROVADO')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  }

  async function fetchMyRequests() {
    const { data } = await supabase
      .from('affiliate_requests')
      .select('product_id')
      .eq('affiliate_id', user.id);
    
    if (data) setMyRequests(data.map(r => r.product_id));
  }

  async function handleRequestAffiliation(productId: string) {
    setRequesting(productId);
    try {
      const { error } = await supabase
        .from('affiliate_requests')
        .insert({
          affiliate_id: user.id,
          product_id: productId,
          status: 'PENDENTE'
        });
      
      if (error) throw error;
      setMyRequests([...myRequests, productId]);
    } catch (err: any) {
      alert('Erro ao solicitar afiliação: ' + err.message);
    } finally {
      setRequesting(null);
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Afiliar-se</h2>
          <p className="text-zinc-500 text-sm">Escolha produtos para promover e ganhar comissão por cada venda.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Pesquisar produtos..."
            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-red-600 transition-all w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-zinc-900 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product) => {
              const isRequested = myRequests.includes(product.id);
              return (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-red-600/30 transition-all flex flex-col"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                      {(product.affiliate_commission_rate || 0.1) * 100}% Comissão
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-3 h-3 text-red-600" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{product.category}</span>
                      </div>
                      <h3 className="font-black text-sm mb-2 line-clamp-1">{product.name}</h3>
                      <div className="text-lg font-black text-white mb-4">{formatCurrency(product.price)}</div>
                    </div>

                    {isRequested ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Solicitado
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleRequestAffiliation(product.id)}
                        disabled={requesting === product.id}
                        className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-zinc-800"
                      >
                        {requesting === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Handshake className="w-4 h-4" />
                            Solicitar Afiliação
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

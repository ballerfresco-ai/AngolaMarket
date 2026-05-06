import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Check, X, Package, Eye, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, producer:users(full_name)')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data as any);
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: 'APROVADO' | 'PENDENTE') {
    const { error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, status } : p));
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando produtos...</div>;

  const pendingCount = products.filter(p => p.status === 'PENDENTE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Gestão de Produtos</h2>
          <p className="text-zinc-500 text-sm">Aprove ou rejeite produtos enviados por produtores.</p>
        </div>
        <div className="bg-red-600/10 text-red-600 px-4 py-1 rounded-full text-xs font-bold border border-red-600/20">
          {pendingCount} Pendentes
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produtor</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-800" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Package className="w-5 h-5 text-zinc-600" />
                        </div>
                      )}
                      <span className="font-bold text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {product.producer?.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      product.status === 'APROVADO' 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {product.status === 'PENDENTE' && (
                        <button 
                          onClick={() => handleStatusChange(product.id, 'APROVADO')}
                          className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-white"
                          title="Aprovar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {product.status === 'APROVADO' && (
                        <button 
                          onClick={() => handleStatusChange(product.id, 'PENDENTE')}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Voltar para Pendente"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

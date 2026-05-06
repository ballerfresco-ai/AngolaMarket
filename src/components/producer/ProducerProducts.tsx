import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Product } from '../../types';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  MoreVertical,
  Filter,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function ProducerProducts({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDENTE' | 'APROVADO' | 'REJEITADO'>('ALL');

  useEffect(() => {
    fetchProducts();
  }, [user.id]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem a certeza que deseja eliminar este produto? Esta ação é irreversível.')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Erro ao eliminar produto: ' + err.message);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusColors: any = {
    'PENDENTE': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'APROVADO': 'bg-green-500/10 text-green-500 border-green-500/20',
    'REJEITADO': 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 italic">A carregar os seus produtos...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            Meus Produtos
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Gerencie o seu inventário e acompanhe o estado dos seus produtos.</p>
        </div>
        <Link 
          to="/dashboard/add-product"
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Procurar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-red-600 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center p-1">
            {(['ALL', 'PENDENTE', 'APROVADO', 'REJEITADO'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                  filterStatus === s 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                {s === 'ALL' ? 'TODOS' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto font-medium">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Produto</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Preço</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 shadow-sm">
                        <img src={p.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm tracking-tight truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-zinc-500 italic">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-red-500 tracking-tighter">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${p.stock > 10 ? 'bg-green-500' : p.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                       <span className="text-sm font-bold text-zinc-300">{p.stock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 hover:bg-red-600/20 text-zinc-500 hover:text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-16 text-center text-zinc-500 space-y-2">
               <Package className="w-12 h-12 mx-auto opacity-10 mb-4" />
               <p className="font-medium italic">Nenhum produto encontrado.</p>
               <Link to="/dashboard/add-product" className="text-red-500 text-xs font-black hover:underline uppercase tracking-widest pt-4 block">
                 Comançar a vender agora →
               </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

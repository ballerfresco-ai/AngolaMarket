import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Truck, Plus, Trash2, MapPin } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function AdminDeliveryFees() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newFee, setNewFee] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  async function fetchFees() {
    const { data } = await supabase
      .from('delivery_fees')
      .select('*')
      .order('neighborhood');
    
    if (data) setFees(data);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newNeighborhood || !newFee) return;

    const { error } = await supabase
      .from('delivery_fees')
      .insert({
        neighborhood: newNeighborhood,
        fee: parseFloat(newFee)
      });

    if (!error) {
      setNewNeighborhood('');
      setNewFee('');
      fetchFees();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('delivery_fees').delete().eq('id', id);
    fetchFees();
  }

  if (loading) return <div className="p-8 text-center">Carregando taxas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Taxas de Entrega</h2>
          <p className="text-zinc-500 text-sm">Gerencie o custo de entrega por bairro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl sticky top-8">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-600" />
              Adicionar Bairro
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Bairro</label>
                <input 
                  type="text"
                  placeholder="Ex: Talatona"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-600 transition-colors"
                  value={newNeighborhood}
                  onChange={(e) => setNewNeighborhood(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Taxa (Kz)</label>
                <input 
                  type="number"
                  placeholder="Ex: 2000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-600 transition-colors"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all active:scale-95"
              >
                Salvar Bairro
              </button>
            </div>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Bairro</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor da Taxa</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                        <span className="font-bold text-sm tracking-tight">{fee.neighborhood}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-red-500">
                      {formatCurrency(fee.fee)}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(fee.id)}
                        className="p-2 hover:bg-red-600/20 text-zinc-600 hover:text-red-600 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

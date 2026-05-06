import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Truck, Plus, Trash2, MapPin, Edit2, X, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function AdminDeliveryFees() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newFee, setNewFee] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFees(true);
  }, []);

  async function fetchFees(isInitial = false) {
    if (isInitial) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_fees')
        .select('*')
        .order('neighborhood');
      
      if (error) throw error;
      if (data) setFees(data);
    } catch (err: any) {
      console.error('Erro ao buscar taxas:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }

  async function handleSave() {
    if (!newNeighborhood || !newFee) {
      alert('Por favor, preencha o bairro e o valor da taxa.');
      return;
    }

    const feeValue = parseFloat(newFee);
    if (isNaN(feeValue)) {
      alert('O valor da taxa deve ser um número válido.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing
        const { error, data } = await supabase
          .from('delivery_fees')
          .update({
            neighborhood: newNeighborhood.trim(),
            fee: feeValue
          })
          .eq('id', editingId)
          .select();

        if (error) throw error;
        console.log('Taxa atualizada com sucesso:', data);
        setEditingId(null);
      } else {
        // Insert new
        const { error, data } = await supabase
          .from('delivery_fees')
          .insert({
            neighborhood: newNeighborhood.trim(),
            fee: feeValue
          })
          .select();

        if (error) {
          if (error.code === '23505') {
            throw new Error('Este bairro já possui uma taxa cadastrada.');
          }
          throw error;
        }
        console.log('Nova taxa adicionada:', data);
      }

      setNewNeighborhood('');
      setNewFee('');
      await fetchFees();
      
      if (editingId) {
        alert('Taxa de entrega atualizada com sucesso!');
      } else {
        alert('Nova taxa de entrega adicionada com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro na operação de salvamento:', err);
      alert(err.message || 'Ocorreu um erro ao processar a sua solicitação. Verifique se tem permissões de administrador.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem a certeza que deseja eliminar esta taxa?')) return;

    try {
      const { error } = await supabase.from('delivery_fees').delete().eq('id', id);
      if (error) throw error;
      await fetchFees();
    } catch (err: any) {
      console.error('Erro ao eliminar:', err);
      alert('Erro ao eliminar a taxa: ' + err.message);
    }
  }

  function startEdit(fee: any) {
    setEditingId(fee.id);
    setNewNeighborhood(fee.neighborhood);
    setNewFee(fee.fee.toString());
    // Scroll to form if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setNewNeighborhood('');
    setNewFee('');
  }

  if (loading) return <div className="p-8 text-center text-zinc-500">A carregar taxas de entrega...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight underline decoration-red-600 decoration-4">Taxas de Entrega</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Gerencie o custo de entrega por bairro de Luanda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl sticky top-8 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-yellow-500" />
                    Editar Bairro
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-red-600" />
                    Adicionar Bairro
                  </>
                )}
              </h3>
              {editingId && (
                <button 
                  onClick={cancelEdit}
                  className="p-1 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Bairro</label>
                <input 
                  type="text"
                  placeholder="Ex: Talatona"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-600 transition-all font-medium"
                  value={newNeighborhood}
                  onChange={(e) => setNewNeighborhood(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Taxa (Kz)</label>
                <input 
                  type="number"
                  placeholder="Ex: 2000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-600 transition-all font-black text-red-500"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={submitting}
                className={`w-full py-4 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                  submitting 
                    ? 'bg-zinc-800 cursor-not-allowed' 
                    : editingId 
                      ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/20' 
                      : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                }`}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {editingId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingId ? 'Atualizar Taxa' : 'Salvar Bairro'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50">
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Bairro</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Valor da Taxa</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {fees.map((fee) => (
                  <tr key={fee.id} className={`hover:bg-zinc-800/30 transition-colors group ${editingId === fee.id ? 'bg-yellow-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editingId === fee.id ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{fee.neighborhood}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-red-500 tracking-tighter text-lg">
                      {formatCurrency(fee.fee)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startEdit(fee)}
                          className="p-2 hover:bg-yellow-600/20 text-zinc-600 hover:text-yellow-500 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(fee.id)}
                          className="p-2 hover:bg-red-600/20 text-zinc-600 hover:text-red-600 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fees.length === 0 && !loading && (
              <div className="p-12 text-center text-zinc-500 italic">
                Nenhuma taxa de entrega configurada no momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import { ShoppingBag, Truck, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateStatus(orderId: string, type: 'status' | 'delivery_status', newValue: string) {
    setUpdateLoading(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ [type]: newValue })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, [type]: newValue } : o) as any);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setUpdateLoading(null);
    }
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, product:products(name), client:users(full_name, email)')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data as any);
    setLoading(false);
  }

  const statusColors: any = {
    'PENDENTE': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'PROCESSANDO': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'ENTREGUE': 'bg-green-500/10 text-green-500 border-green-500/20',
    'CANCELADO': 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const deliveryStatusColors: any = {
    'PENDENTE': 'bg-zinc-800 text-zinc-400',
    'EM_ENTREGA': 'bg-blue-600/10 text-blue-500 border-blue-600/20',
    'ENTREGUE': 'bg-green-600/10 text-green-500 border-green-600/20',
  };

  const filteredOrders = orders.filter(o => 
    (o.product as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.client as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.includes(searchTerm)
  );

  if (loading) return <div className="p-8 text-center">Carregando pedidos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Todos os Pedidos</h2>
          <p className="text-zinc-500 text-sm">Controlo total de todas as transações da plataforma.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Procurar pedido..."
            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm w-full md:w-[300px] outline-none focus:border-red-600 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-[10px] font-mono text-zinc-500">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">{order.product?.name}</p>
                    <p className="text-[10px] text-zinc-500">Qtd: {order.quantity}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{order.client?.full_name}</p>
                    <p className="text-[10px] text-zinc-500">{order.client_phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black">{formatCurrency(order.total_price)}</p>
                    <p className="text-[10px] text-zinc-500">+{formatCurrency(order.delivery_fee)} entrega</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, 'status', e.target.value)}
                      disabled={updateLoading === order.id}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border bg-zinc-950 outline-none focus:border-red-600 ${statusColors[order.status]}`}
                    >
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="PROCESSANDO">PROCESSANDO</option>
                      <option value="ENTREGUE">ENTREGUE</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.delivery_status || 'PENDENTE'}
                      onChange={(e) => updateStatus(order.id, 'delivery_status', e.target.value)}
                      disabled={updateLoading === order.id}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border bg-zinc-950 outline-none focus:border-red-600 ${deliveryStatusColors[order.delivery_status || 'PENDENTE']}`}
                    >
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="EM_ENTREGA">EM ENTREGA</option>
                      <option value="ENTREGUE">ENTREGUE</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

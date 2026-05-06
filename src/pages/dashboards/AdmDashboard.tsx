import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Product, Order, Withdrawal } from '../../types';
import { 
  Users, 
  Package, 
  TrendingUp, 
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion } from 'motion/react';

export default function AdmDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    totalSales: 0,
    platformRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: userCount },
        { count: productCount },
        { data: ordersData },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
      ]);

      const totalSales = ordersData?.reduce((acc, order) => acc + (order.status === 'ENTREGUE' ? Number(order.total_price) : 0), 0) || 0;
      const platformRevenue = totalSales * 0.1; // 10% commission

      setStats({
        users: userCount || 0,
        products: productCount || 0,
        orders: ordersData?.length || 0,
        totalSales,
        platformRevenue
      });

      // Fetch recent orders with details
      const { data: recOrders } = await supabase
        .from('orders')
        .select('*, product:products(name), client:users(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recOrders) setRecentOrders(recOrders as any);
      setLoading(false);
    }

    fetchStats();
  }, []);

  const chartData = [
    { name: 'Seg', v: 4000 },
    { name: 'Ter', v: 3000 },
    { name: 'Qua', v: 2000 },
    { name: 'Qui', v: 2780 },
    { name: 'Sex', v: 1890 },
    { name: 'Sáb', v: 2390 },
    { name: 'Dom', v: 3490 },
  ];

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black mb-2">Painel do Administrador</h1>
        <p className="text-zinc-500">Visão geral do desempenho da plataforma AngolaMarket em tempo real.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Utilizadores" 
          value={stats.users.toString()} 
          icon={Users} 
          trend="+12%" 
          positive 
        />
        <StatCard 
          label="Produtos" 
          value={stats.products.toString()} 
          icon={Package} 
          trend="+5%" 
          positive 
        />
        <StatCard 
          label="Vendas Totais" 
          value={formatCurrency(stats.totalSales)} 
          icon={TrendingUp} 
          trend="+20%" 
          positive 
        />
        <StatCard 
          label="Receita Platforma" 
          value={formatCurrency(stats.platformRevenue)} 
          icon={CreditCard} 
          trend="+15%" 
          positive 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Fluxo de Vendas (7 Dias)</h3>
            <select className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs px-2 py-1 outline-none">
              <option>Esta Semana</option>
              <option>Mês Passado</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="v" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col">
          <h3 className="font-bold text-lg mb-6">Pedidos Recentes</h3>
          <div className="flex-1 space-y-4">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{order.product?.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{order.client?.full_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{formatCurrency(order.total_price)}</p>
                  <p className="text-[10px] text-zinc-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 text-center text-xs text-zinc-500 hover:text-white font-medium transition-colors">
            Ver Todos os Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, positive }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-700 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl group-hover:bg-red-600 group-hover:border-red-600 transition-all">
          <Icon className="w-5 h-5 group-hover:text-white" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${positive ? 'text-green-500' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

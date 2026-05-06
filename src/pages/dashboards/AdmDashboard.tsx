import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users as UsersIcon, 
  Package, 
  TrendingUp, 
  CreditCard,
  LayoutDashboard,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  LogOut
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Import Admin Components
import AdminProducts from '../../components/admin/AdminProducts';
import AdminUsers from '../../components/admin/AdminUsers';
import AdminOrders from '../../components/admin/AdminOrders';
import AdminDeliveryFees from '../../components/admin/AdminDeliveryFees';
import AdminWithdrawals from '../../components/admin/AdminWithdrawals';

type Tab = 'overview' | 'products' | 'users' | 'orders' | 'fees' | 'withdrawals';

export default function AdmDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    totalSales: 0,
    platformRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
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
      const platformRevenue = totalSales * 0.1;

      setStats({
        users: userCount || 0,
        products: productCount || 0,
        orders: ordersData?.length || 0,
        totalSales,
        platformRevenue
      });

      const { data: recOrders } = await supabase
        .from('orders')
        .select('*, product:products(name), client:users(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recOrders) setRecentOrders(recOrders);
      setLoading(false);
    }

    fetchStats();
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'users', label: 'Utilizadores', icon: UsersIcon },
    { id: 'orders', label: 'Pedidos', icon: TrendingUp },
    { id: 'fees', label: 'Taxa Entrega', icon: Truck },
    { id: 'withdrawals', label: 'Saques', icon: CreditCard },
  ];

  if (loading) return <div className="p-8 text-center text-zinc-500">A processar dados do sistema...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === item.id 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 truncate" />
            <span>{item.label}</span>
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewSection stats={stats} recentOrders={recentOrders} />
            )}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'fees' && <AdminDeliveryFees />}
            {activeTab === 'withdrawals' && <AdminWithdrawals />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function OverviewSection({ stats, recentOrders }: any) {
  const chartData = [
    { name: 'Seg', v: 4000 },
    { name: 'Ter', v: 3000 },
    { name: 'Qua', v: 2000 },
    { name: 'Qui', v: 2780 },
    { name: 'Sex', v: 1890 },
    { name: 'Sáb', v: 2390 },
    { name: 'Dom', v: 3490 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Administração</h1>
        <p className="text-zinc-500 font-medium">Controle total da AngolaMarket.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Usuários" value={stats.users.toString()} icon={UsersIcon} trend="+12%" positive />
        <StatCard label="Produtos" value={stats.products.toString()} icon={Package} trend="+5%" positive />
        <StatCard label="Vendas Brutas" value={formatCurrency(stats.totalSales)} icon={TrendingUp} trend="+20%" positive />
        <StatCard label="Revenue" value={formatCurrency(stats.platformRevenue)} icon={CreditCard} trend="+15%" positive />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <h3 className="font-bold text-lg mb-8">Fluxo de Vendas</h3>
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
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="v" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <h3 className="font-bold text-lg mb-6">Pedidos Recentes</h3>
          <div className="space-y-4">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate tracking-tight">{order.product?.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{order.client?.full_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-red-500 tracking-tighter">{formatCurrency(order.total_price)}</p>
                </div>
              </div>
            ))}
          </div>
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
        <div className={`flex items-center gap-1 text-[10px] font-black ${positive ? 'text-green-500' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}


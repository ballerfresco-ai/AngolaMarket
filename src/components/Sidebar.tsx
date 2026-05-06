import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  MapPin,
  CheckCircle,
  Truck,
  Link as LinkIcon
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function Sidebar({ user }: { user: User }) {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const menuItems = {
    ADM: [
      { path: '/dashboard', label: 'Início', icon: LayoutDashboard },
      { path: '/dashboard/approve-products', label: 'Produtos Pendentes', icon: Package },
      { path: '/dashboard/manage-users', label: 'Utilizadores', icon: Users },
      { path: '/dashboard/manage-orders', label: 'Todos os Pedidos', icon: Truck },
      { path: '/dashboard/delivery-fees', label: 'Taxas de Entrega', icon: MapPin },
      { path: '/dashboard/withdrawals', label: 'Saques Pendentes', icon: Wallet },
    ],
    PRODUTOR: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dashboard/my-products', label: 'Meus Produtos', icon: Package },
      { path: '/dashboard/producer-orders', label: 'Vendas', icon: ShoppingCart },
      { path: '/dashboard/wallet', label: 'Carteira', icon: Wallet },
    ],
    AFILIADO: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dashboard/marketplace', label: 'Produtos', icon: Package },
      { path: '/dashboard/affiliate-links', label: 'Meus Links', icon: LinkIcon },
      { path: '/dashboard/wallet', label: 'Carteira', icon: Wallet },
    ],
    CLIENTE: [
      { path: '/dashboard', label: 'Meus Pedidos', icon: ShoppingCart },
      { path: '/dashboard/profile', label: 'Perfil', icon: Settings },
    ]
  };

  const navItems = menuItems[user.role] || [];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-800">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-white text-sm">AM</div>
          <span className="font-bold text-lg tracking-tight">Angola<span className="text-red-600">Market</span></span>
        </NavLink>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              isActive 
                ? "bg-red-600 text-white shadow-md shadow-red-600/20" 
                : "text-zinc-500 hover:text-white hover:bg-zinc-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-red-600 border border-zinc-700">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">{user.full_name}</p>
            <p className="text-xs text-zinc-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
}

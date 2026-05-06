import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from '../types';
import Sidebar from '../components/Sidebar';

// Dashboard Components
import AdmDashboard from './dashboards/AdmDashboard';
import ProducerDashboard from './dashboards/ProducerDashboard';
import AffiliateDashboard from './dashboards/AffiliateDashboard';
import ClientDashboard from './dashboards/ClientDashboard';

// Admin Components
import AdminProducts from '../components/admin/AdminProducts';
import AdminUsers from '../components/admin/AdminUsers';
import AdminOrders from '../components/admin/AdminOrders';
import AdminDeliveryFees from '../components/admin/AdminDeliveryFees';
import AdminWithdrawals from '../components/admin/AdminWithdrawals';

// Producer Components
import ProducerAddProduct from '../components/producer/ProducerAddProduct';
import ProducerProducts from '../components/producer/ProducerProducts';
import ProducerOrders from '../components/producer/ProducerOrders';
import ProducerWallet from '../components/producer/ProducerWallet';

// Placeholder/Future pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-[400px] border border-dashed border-zinc-800 rounded-3xl text-zinc-500">
    Página "{title}" está em desenvolvimento.
  </div>
);

export default function Dashboard({ user }: { user: User }) {
  const getInitialDashboard = () => {
    switch (user.role) {
      case 'ADM': return <AdmDashboard />;
      case 'PRODUTOR': return <ProducerDashboard user={user} />;
      case 'AFILIADO': return <AffiliateDashboard user={user} />;
      case 'CLIENTE': return <ClientDashboard user={user} />;
      default: return <Navigate to="/" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar user={user} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="container mx-auto max-w-6xl">
          <Routes>
            <Route index element={getInitialDashboard()} />
            
            {/* ADM Routes */}
            {user.role === 'ADM' && (
              <>
                <Route path="approve-products" element={<AdminProducts />} />
                <Route path="manage-users" element={<AdminUsers />} />
                <Route path="manage-orders" element={<AdminOrders />} />
                <Route path="delivery-fees" element={<AdminDeliveryFees />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
              </>
            )}

            {/* Producer Routes */}
            {user.role === 'PRODUTOR' && (
              <>
                <Route path="add-product" element={<ProducerAddProduct user={user} />} />
                <Route path="my-products" element={<ProducerProducts user={user} />} />
                <Route path="producer-orders" element={<ProducerOrders user={user} />} />
                <Route path="wallet" element={<ProducerWallet user={user} />} />
              </>
            )}

            {/* Affiliate Routes */}
            {user.role === 'AFILIADO' && (
              <>
                <Route path="marketplace" element={<Placeholder title="Mercado de Produtos" />} />
                <Route path="affiliate-links" element={<Placeholder title="Meus Links" />} />
                <Route path="wallet" element={<Placeholder title="Minha Carteira" />} />
              </>
            )}

            {/* Client/General Routes */}
            <Route path="profile" element={<Placeholder title="Meu Perfil" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

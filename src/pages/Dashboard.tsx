import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from '../types';
import Sidebar from '../components/Sidebar';

// Dashboard Components
import AdmDashboard from './dashboards/AdmDashboard';
import ProducerDashboard from './dashboards/ProducerDashboard';
import AffiliateDashboard from './dashboards/AffiliateDashboard';
import ClientDashboard from './dashboards/ClientDashboard';
import Notifications from './Notifications';

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
    <div className="min-h-screen bg-zinc-950">
      <main className="p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <Routes>
            <Route index element={getInitialDashboard()} />
            {/* Outras rotas podem ser acessadas via abas nos componentes de dashboard */}
          </Routes>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User } from './types';
import { MessageSquare, Phone } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Orders from './pages/Orders';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(loadingState => {
        if (loadingState) return false;
        return false;
      });
    }, 8000);

    const checkUser = async () => {
      try {
        if (!(supabase as any)._isConfigured) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser(profile);
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || 'Usuário',
              role: (session.user.user_metadata?.role as any) || 'CLIENTE',
              created_at: session.user.created_at
            } as User);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        setUser(profile || {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Usuário',
          role: (session.user.user_metadata?.role as any) || 'CLIENTE',
          created_at: session.user.created_at
        } as User);
      } else {
        setUser(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const WhatsAppButton = () => (
    <a
      href="https://wa.me/244950461466"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl shadow-green-500/30 transition-all hover:scale-110 flex items-center justify-center group"
      title="Falar no WhatsApp"
    >
      <MessageSquare className="w-6 h-6 fill-current" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 whitespace-nowrap font-bold text-sm">
        Suporte WhatsApp
      </span>
    </a>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (user) return <>{children}</>;
    return <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-600 selection:text-white relative">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/product/:id" element={<ProductDetails user={user} />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard user={user!} /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart user={user!} /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders user={user!} /></ProtectedRoute>} />
        </Routes>
        <WhatsAppButton />
      </div>
    </BrowserRouter>
  );
}

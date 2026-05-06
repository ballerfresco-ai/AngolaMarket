import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User } from './types';

// Pages (to be created)
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
    // Safety timeout: stop loading after 8 seconds no matter what
    const timeout = setTimeout(() => {
      setLoading(loadingState => {
        if (loadingState) {
          console.warn('Initialization timed out. Forcing UI render.');
          return false;
        }
        return false;
      });
    }, 8000);

    // Check initial session
    const checkUser = async () => {
      try {
        console.log('Checking user session...');
        // Verify if supabase is the real one
        if (!(supabase as any)._isConfigured) {
          console.warn('Supabase is not configured. Running in limited mode.');
          setLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao buscar sessão inicial:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Sessão encontrada no carregamento inicial:', session.user.id);
          
          // Use a direct fetch with timeout
          const fetchProfile = async () => {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.warn('Erro ao buscar perfil (usuário logado mas sem perfil?):', profileError);
            }
            return profile;
          };

          // Race the fetch against a 3s timeout
          const profile = await Promise.race([
            fetchProfile(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          ]);

          if (profile) {
            console.log('Perfil sincronizado com sucesso:', profile.role);
            setUser(profile);
          } else {
            console.log('Usando dados de reserva (perfil lento ou não encontrado)');
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || 'Usuário',
              role: (session.user.user_metadata?.role as any) || 'CLIENTE',
              created_at: session.user.created_at
            } as User);
          }
        }
 else {
          console.log('Nenhuma sessão activa encontrada.');
        }
      } catch (err) {
        console.error('Erro crítico na inicialização do App:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    let subscription: any = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Evento de Autenticação:', event, session?.user?.id);
        
        if (session?.user) {
          const fetchAndSetProfile = async () => {
            try {
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
            } catch (err) {
              console.error('Erro ao processar auth change:', err);
            }
          };
          fetchAndSetProfile();
        } else {
          setUser(null);
        }
      });
      subscription = data?.subscription;
    } catch (err) {
      console.warn('Could not set up auth state listener:', err);
    }

    return () => {
      clearTimeout(timeout);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Helper element for protected routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
    
    // If we have a user state, we're definitely good
    if (user) return <>{children}</>;
    
    // If no user, redirect to login
    return <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/product/:id" element={<ProductDetails user={user} />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard/*" 
            element={<ProtectedRoute><Dashboard user={user!} /></ProtectedRoute>} 
          />
          <Route 
            path="/cart" 
            element={<ProtectedRoute><Cart user={user!} /></ProtectedRoute>} 
          />
          <Route 
            path="/orders" 
            element={<ProtectedRoute><Orders user={user!} /></ProtectedRoute>} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

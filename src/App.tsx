import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
        // Verify if supabase is the dummy or real one
        if ((supabase as any)._isDummy) {
          console.warn('Supabase is not configured. Running in limited mode.');
          setLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }

          if (profile) {
            console.log('Profile found:', profile.role);
            setUser(profile);
          } else {
            console.warn('Profile not found for user:', session.user.id);
            // Fallback: set basic info from session metadata so app doesn't loop
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || 'Usuário',
              role: (session.user.user_metadata?.role as any) || 'CLIENTE',
              created_at: session.user.created_at
            } as User);
          }
        } else {
          console.log('No session found');
        }
      } catch (err) {
        console.error('Error during site initialization:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    let subscription: any = null;
    try {
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser(profile);
          } else {
            // Fallback for session found without DB profile yet
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || 'Usuário',
              role: (session.user.user_metadata?.role as any) || 'CLIENTE',
              created_at: session.user.created_at
            } as User);
          }
        } else {
          setUser(null);
        }
      });
      subscription = result.data?.subscription;
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

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-600 selection:text-white">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/product/:id" element={<ProductDetails user={user} />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard/*" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/cart" 
            element={user ? <Cart user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/orders" 
            element={user ? <Orders user={user} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

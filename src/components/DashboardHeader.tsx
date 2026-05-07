import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Home, LogOut, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  activeTabLabel: string;
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
}

export default function DashboardHeader({
  title,
  subtitle,
  activeTabLabel,
  tabs,
  activeTabId,
  onTabChange
}: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-6 pb-6 border-b border-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-1 tracking-tight uppercase">{title}</h1>
          <p className="text-zinc-500 font-medium flex items-center gap-2">
            <span className="text-white font-bold">{activeTabLabel}</span>
            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
            {subtitle}
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all text-white shadow-xl flex items-center gap-2 group"
          >
            <MoreVertical className="w-6 h-6 group-hover:text-red-500 transition-colors" />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest px-2">Opções</span>
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <p className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-2">Navegação do Painel</p>
                    
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                          activeTabId === tab.id 
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}

                    <div className="h-[1px] bg-zinc-800 my-2" />
                    
                    <button
                      onClick={() => navigate('/')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                    >
                      <Home className="w-4 h-4" />
                      Ir para Marketplace
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Terminar Sessão
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

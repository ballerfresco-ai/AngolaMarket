import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { Users, Shield, UserCircle, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data as any);
    setLoading(false);
  }

  const roleColors: any = {
    'ADM': 'bg-red-500/10 text-red-500 border-red-500/20',
    'PRODUTOR': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'AFILIADO': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'CLIENTE': 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  };

  if (loading) return <div className="p-8 text-center">Carregando utilizadores...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Gestão de Utilizadores</h2>
        <p className="text-zinc-500 text-sm">Visualize e gira todos os utilizadores registados na plataforma.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome / Email</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Bairro</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Registado em</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.full_name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {user.neighborhood || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-zinc-400" />
                      </button>
                      {user.role !== 'ADM' && (
                        <button className="p-2 bg-zinc-800 hover:bg-red-600/20 group rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-zinc-400 group-hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

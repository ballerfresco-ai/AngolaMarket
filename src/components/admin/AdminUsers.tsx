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

  async function handleRoleChange(userId: string, newRole: string) {
    if (!confirm(`Deseja alterar o cargo deste utilizador para ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err: any) {
      alert('Erro ao alterar cargo: ' + err.message);
    }
  }

  const roleColors: any = {
    'ADM': 'bg-red-500/10 text-red-500 border-red-500/20',
    'PRODUTOR': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'AFILIADO': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'CLIENTE': 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">A carregar utilizadores...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Gestão de Utilizadores</h2>
        <p className="text-zinc-500 text-sm font-medium">Visualize e gira todos os utilizadores registados na plataforma.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Nome / Email</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Cargo</th>
                <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-medium">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <UserCircle className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{user.full_name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border outline-none transition-all cursor-pointer ${roleColors[user.role]}`}
                    >
                      <option value="ADM">ADM</option>
                      <option value="PRODUTOR">PRODUTOR</option>
                      <option value="AFILIADO">AFILIADO</option>
                      <option value="CLIENTE">CLIENTE</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-[10px] text-zinc-500 italic mr-4">
                        Desde {formatDate(user.created_at)}
                      </p>
                      {user.role !== 'ADM' && (
                        <button className="p-2 hover:bg-red-600/20 group rounded-xl transition-all">
                          <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-500" />
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

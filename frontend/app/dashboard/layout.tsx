'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, FolderKanban, Users, CheckSquare, Shield } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (!user) return <div className="p-8 text-center text-zinc-500">Loading Workspace...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Dynamic Sidebar Navigation Component */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col justify-between p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <FolderKanban size={22} /> CyphLab Panel
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 capitalize px-1">{user.role?.name} Workspace</p>
          </div>

          <nav className="space-y-1">
            {user.role?.name === 'admin' && (
              <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-lg">
                <Shield size={18} /> Admin Core Console
              </div>
            )}
            {user.role?.name === 'manager' && (
              <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-lg">
                <Users size={18} /> Project Operations
              </div>
            )}
            {user.role?.name === 'member' && (
              <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-lg">
                <CheckSquare size={18} /> My Tasks Board
              </div>
            )}
          </nav>
        </div>

        <div className="border-t border-zinc-100 pt-4 space-y-3">
          <div className="px-2">
            <p className="text-sm font-semibold text-zinc-800 truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area Workspace */}
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
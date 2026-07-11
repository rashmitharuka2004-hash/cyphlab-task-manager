'use client';

import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface Task {
  id: number;
  status: string;
}

interface Project {
  id: number;
  name: string;
  tasks?: Task[];
}

interface Stats {
  total_users: number;
  total_projects: number;
  total_tasks: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, statsRes, projectsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles'),
        api.get('/analytics/stats'),
        api.get('/projects')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setStats(statsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error('Failed to load admin console data.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: number, roleId: number) => {
    setUpdatingUserId(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role_id: roleId });
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user.id === userId) {
            const selectedRole = roles.find(r => r.id === roleId);
            if (selectedRole) {
              return { ...user, role: selectedRole };
            }
          }
          return user;
        })
      );
      // Refresh stats
      const statsRes = await api.get('/analytics/stats');
      setStats(statsRes.data);
    } catch (err) {
      alert('Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Compute charts data
  let adminCount = 0;
  let managerCount = 0;
  let memberCount = 0;
  users.forEach(u => {
    if (u.role.name === 'admin') adminCount++;
    else if (u.role.name === 'manager') managerCount++;
    else if (u.role.name === 'member') memberCount++;
  });

  const rolesDistributionData = [
    { name: 'Admins', value: adminCount, color: '#8b5cf6' },
    { name: 'Managers', value: managerCount, color: '#3b82f6' },
    { name: 'Members', value: memberCount, color: '#71717a' }
  ].filter(d => d.value > 0);

  const tasksPerProjectData = projects.map(p => ({
    name: p.name,
    'Tasks Count': p.tasks?.length || 0
  })).filter(d => d['Tasks Count'] > 0);

  return (
    <div className="space-y-8">
      {/* Header and KPI Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Admin Core Console</h2>
          <p className="text-sm text-zinc-500 mt-0.5 font-normal">Manage workspace user authorizations, roles, and platform permissions.</p>
        </div>

        {stats && (
          <div className="flex gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Users</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_users}</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Projects</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_projects}</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Tasks</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_tasks}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-zinc-400">
          Loading platform metrics...
        </div>
      ) : (
        <>
          {/* Charts section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Roles Breakdown Pie Chart */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3 col-span-1">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Users Role Distribution</h4>
              <div className="h-48">
                {rolesDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rolesDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {rolesDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-zinc-400 text-center py-20">No users found.</p>
                )}
              </div>
            </div>

            {/* Tasks per Project Bar Chart */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3 md:col-span-2">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Tasks Distribution Across Projects</h4>
              <div className="h-48">
                {tasksPerProjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksPerProjectData}>
                      <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="Tasks Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-zinc-400 text-center py-20">No tasks created under active projects.</p>
                )}
              </div>
            </div>
          </div>

          {/* User Table Grid */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-150 bg-zinc-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Workspace Users Directory</h3>
              <span className="text-xs bg-zinc-200 text-zinc-700 font-semibold px-2.5 py-0.5 rounded-full">
                {users.length} Active Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-400 uppercase bg-zinc-50/20">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email Address</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-zinc-50/50 transition">
                      <td className="px-6 py-4 font-medium text-zinc-900">{user.name}</td>
                      <td className="px-6 py-4 text-zinc-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          user.role.name === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                            : user.role.name === 'manager' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}>
                          {user.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          disabled={updatingUserId === user.id}
                          value={user.role.id}
                          onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                          className="bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer disabled:opacity-50 transition"
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              Make {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

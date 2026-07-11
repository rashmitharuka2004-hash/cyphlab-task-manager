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

interface User {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
}

interface Task {
  id: number;
  assigned_to: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assignee?: User;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  due_date: string;
  manager_id: number;
  members?: User[];
  tasks?: Task[];
}

interface Stats {
  total_projects: number;
  total_tasks: number;
  total_members: number;
}

export default function ManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // New Project Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Assign Members Form
  const [assignProjectId, setAssignProjectId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // New Task Form
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>('');

  const fetchData = async () => {
    try {
      const [projectsRes, usersRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
        api.get('/analytics/stats')
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data.filter((u: User) => u.role.name !== 'admin')); // Filter out admins
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load manager operations data.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name, description, due_date: dueDate });
      setName('');
      setDescription('');
      setDueDate('');
      fetchData();
    } catch (err) {
      alert("Failed to create project space.");
    }
  };

  const handleAssignMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectId) {
      alert('Please select a project first.');
      return;
    }
    try {
      await api.post(`/projects/${assignProjectId}/assign`, { user_ids: selectedUserIds });
      setSelectedUserIds([]);
      setAssignProjectId('');
      alert('Workspace members assigned successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to assign members to the project.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskProjectId || !taskAssignedTo) {
      alert('Please select a project and assignee first.');
      return;
    }
    try {
      await api.post('/tasks', {
        project_id: parseInt(taskProjectId),
        assigned_to: parseInt(taskAssignedTo),
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        due_date: taskDueDate || null
      });
      setTaskProjectId('');
      setTaskAssignedTo('');
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setTaskDueDate('');
      alert('Task created and assigned successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to assign task to workspace member.');
    }
  };

  const handleUserCheckboxChange = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  // Get members assigned to currently selected task project
  const currentTaskProjectMembers = projects.find(p => p.id === parseInt(taskProjectId))?.members || [];

  // Compute charts data
  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  projects.forEach(p => {
    p.tasks?.forEach(t => {
      if (t.status === 'todo') todoCount++;
      else if (t.status === 'in_progress') inProgressCount++;
      else if (t.status === 'done') doneCount++;
    });
  });

  const taskStatusData = [
    { name: 'To Do', value: todoCount, color: '#a1a1aa' },
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },
    { name: 'Done', value: doneCount, color: '#10b981' }
  ].filter(d => d.value > 0); // Only render slices with values > 0

  const projectProgressData = projects.map(p => {
    const total = p.tasks?.length || 0;
    const completed = p.tasks?.filter(t => t.status === 'done').length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      name: p.name,
      'Completion %': progress
    };
  });

  const taskAllocationData = users.map(u => {
    let count = 0;
    projects.forEach(p => {
      p.tasks?.forEach(t => {
        if (t.assigned_to === u.id) count++;
      });
    });
    return {
      name: u.name,
      'Tasks Assigned': count
    };
  }).filter(d => d['Tasks Assigned'] > 0); // Only show users with assigned tasks

  return (
    <div className="space-y-8">
      {/* Header and KPI Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Project Operations Suite</h2>
          <p className="text-sm text-zinc-500 mt-0.5 font-normal">Deploy project spaces, build task structures, and orchestrate workspace tracks.</p>
        </div>

        {stats && (
          <div className="flex gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">My Projects</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_projects}</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Tasks</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_tasks}</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Team Size</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_members}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading execution charts...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Operations and Assignment Deck Forms (Left 1/3) */}
          <div className="space-y-8 lg:col-span-1">
            {/* Create Project Card */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">Deploy Project Deck</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Project Name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder-zinc-400"
                    placeholder="e.g., Cloud Architecture Sync"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Description Brief</label>
                  <textarea
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder-zinc-400"
                    placeholder="Provide goals and scope details..." rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Target Deadline</label>
                  <input
                    type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition">
                  Create Project Space
                </button>
              </form>
            </div>

            {/* Assign Members Card */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">Orchestrate Team Assign</h3>
              <form onSubmit={handleAssignMembers} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Target Project</label>
                  <select
                    required value={assignProjectId} onChange={(e) => setAssignProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-800 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-2">Select Workspace Members</label>
                  <div className="max-h-36 overflow-y-auto space-y-2 border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
                    {users.map(u => (
                      <label key={u.id} className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={(e) => handleUserCheckboxChange(u.id, e.target.checked)}
                          className="rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                        />
                        <span>{u.name} <span className="text-[10px] text-zinc-400 capitalize">({u.role.name})</span></span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition">
                  Assign Members
                </button>
              </form>
            </div>

            {/* Create & Assign Task Card */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">Deploy Workspace Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Target Project</label>
                  <select
                    required value={taskProjectId} onChange={(e) => {
                      setTaskProjectId(e.target.value);
                      setTaskAssignedTo(''); // Reset assignee
                    }}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-800 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Task Title</label>
                  <input
                    type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder-zinc-400"
                    placeholder="e.g. Set up API gateway route guards"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Task Description</label>
                  <textarea
                    value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder-zinc-400"
                    placeholder="Provide task goals..." rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Priority</label>
                    <select
                      value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded-lg text-xs text-zinc-800 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Due Date</label>
                    <input
                      type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-2 py-1.2 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Assignee</label>
                  <select
                    required value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm text-zinc-800 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    disabled={!taskProjectId}
                  >
                    <option value="">{taskProjectId ? 'Select Member' : 'Select Project First'}</option>
                    {currentTaskProjectMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition">
                  Create and Assign Task
                </button>
              </form>
            </div>
          </div>

          {/* Render Charts and Active Decks (Right 2/3) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Visual Analytics Charts Deck */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Workspace Analytics Charts</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Status Pie Chart */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Tasks Status Breakdown</h4>
                  <div className="h-48">
                    {taskStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {taskStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-zinc-400 text-center py-20">No tasks created yet to chart status.</p>
                    )}
                  </div>
                </div>

                {/* Task Assignment Bar Chart */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Task Distribution By Member</h4>
                  <div className="h-48">
                    {taskAllocationData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={taskAllocationData}>
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="Tasks Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-zinc-400 text-center py-20">No tasks assigned to members.</p>
                    )}
                  </div>
                </div>

                {/* Project Completion Progress Bar Chart */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3 md:col-span-2">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Projects Completed %</h4>
                  <div className="h-48">
                    {projectProgressData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectProgressData} layout="vertical">
                          <XAxis type="number" stroke="#a1a1aa" fontSize={10} domain={[0, 100]} />
                          <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={10} width={80} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="Completion %" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-zinc-400 text-center py-20">No active projects to monitor progress.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Active Projects & Tasks</h3>
              {projects.map((proj) => {
                const totalTasks = proj.tasks?.length || 0;
                const completedTasks = proj.tasks?.filter(t => t.status === 'done').length || 0;
                const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <div key={proj.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                      <div>
                        <h4 className="font-bold text-zinc-900 text-lg">{proj.name}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Deadline: {proj.due_date || 'No Date'}</p>
                      </div>
                      <span className="text-xs bg-zinc-100 text-zinc-700 font-semibold px-2.5 py-0.5 rounded-full capitalize">
                        {proj.status}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-600 line-clamp-3 leading-relaxed">{proj.description || 'No description provided.'}</p>

                    {/* Team Members List */}
                    <div className="space-y-2">
                      <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Members</span>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.members && proj.members.length > 0 ? (
                          proj.members.map(m => (
                            <span key={m.id} className="inline-flex items-center text-xs bg-zinc-100/80 text-zinc-700 border border-zinc-200 rounded-md px-2 py-0.5 font-medium">
                              {m.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400 italic">No workspace members assigned yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-zinc-500">
                        <span>Project Progress</span>
                        <span>{progressPercent}% ({completedTasks}/{totalTasks} Tasks Done)</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-2">
                        <div
                          className="bg-zinc-900 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Tasks Details List */}
                    <div className="space-y-2">
                      <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Project Tasks</span>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {proj.tasks && proj.tasks.length > 0 ? (
                          proj.tasks.map(task => (
                            <div key={task.id} className="flex justify-between items-center text-xs border border-zinc-150 rounded-lg p-2.5 bg-zinc-50/50 hover:bg-zinc-50 transition">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-zinc-800">{task.title}</span>
                                <span className="block text-[10px] text-zinc-400">
                                  Assignee: {task.assignee?.name || 'Unassigned'} | Due: {task.due_date || 'No Date'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  task.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-zinc-200 text-zinc-700'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  task.status === 'done' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400 italic block py-2">No tasks deployed under this project.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-400">
                  No projects managed under this workspace.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
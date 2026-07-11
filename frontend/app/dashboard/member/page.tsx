'use client';

import { useEffect, useState } from 'react';
import api from '../../services/api';

interface Assignee {
  id: number;
  name: string;
  email: string;
}

interface Task {
  id: number;
  project_id: number;
  assigned_to: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assignee: Assignee;
  projectName?: string; // Attached locally
}

interface Project {
  id: number;
  name: string;
  description: string;
  due_date: string;
  tasks: Task[];
}

interface Stats {
  total_assigned_projects: number;
  total_assigned_tasks: number;
}

export default function MemberDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);

      const [projectsRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/analytics/stats')
      ]);

      const allProjects: Project[] = projectsRes.data;
      setProjects(allProjects);
      setStats(statsRes.data);

      // Filter tasks assigned to the current user and attach project names
      const tasks: Task[] = [];
      allProjects.forEach(proj => {
        if (proj.tasks) {
          proj.tasks.forEach(t => {
            if (t.assigned_to === parsedUser.id) {
              tasks.push({
                ...t,
                projectName: proj.name
              });
            }
          });
        }
      });
      setMyTasks(tasks);
    } catch (err) {
      console.error('Failed to load member tracks.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      setMyTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      // Refresh stats
      const statsRes = await api.get('/analytics/stats');
      setStats(statsRes.data);
    } catch (err) {
      alert('Failed to update task state.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getOverdueStatus = (dueDate: string, status: string) => {
    if (!dueDate || status === 'done') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  return (
    <div className="space-y-8">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Tasks Board</h2>
          <p className="text-sm text-zinc-500 mt-0.5 font-normal">Track your workflow tasks and update status checklist entries dynamically.</p>
        </div>

        {stats && (
          <div className="flex gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">My Projects</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_assigned_projects}</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-3 shadow-sm text-center">
              <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">My Tasks</span>
              <span className="text-xl font-bold text-zinc-800">{stats.total_assigned_tasks}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading your board workspace...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Todo column */}
          <div className="bg-zinc-100/50 rounded-xl p-4 border border-zinc-200/60 flex flex-col space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">To Do</h3>
              <span className="text-xs bg-zinc-200 text-zinc-600 font-medium px-2 py-0.5 rounded-full">
                {myTasks.filter(t => t.status === 'todo').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[60vh]">
              {myTasks.filter(t => t.status === 'todo').map(task => {
                const overdue = getOverdueStatus(task.due_date, task.status);
                return (
                  <div key={task.id} className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm space-y-3 hover:shadow transition">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-semibold truncate max-w-[70%]">
                        {task.projectName}
                      </span>
                      {overdue && (
                        <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full font-bold">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
                    </div>
                    {task.due_date && (
                      <p className="text-[10px] text-zinc-400">Due Date: {task.due_date}</p>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-50">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        task.priority === 'high' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : task.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {task.priority}
                      </span>
                      <button
                        disabled={updatingTaskId === task.id}
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                        className="text-xs bg-zinc-950 text-white font-medium px-2.5 py-1 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition"
                      >
                        Start Work
                      </button>
                    </div>
                  </div>
                );
              })}
              {myTasks.filter(t => t.status === 'todo').length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-6">No tasks pending</p>
              )}
            </div>
          </div>

          {/* In Progress column */}
          <div className="bg-zinc-100/50 rounded-xl p-4 border border-zinc-200/60 flex flex-col space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">In Progress</h3>
              <span className="text-xs bg-zinc-200 text-zinc-600 font-medium px-2 py-0.5 rounded-full">
                {myTasks.filter(t => t.status === 'in_progress').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[60vh]">
              {myTasks.filter(t => t.status === 'in_progress').map(task => {
                const overdue = getOverdueStatus(task.due_date, task.status);
                return (
                  <div key={task.id} className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm space-y-3 hover:shadow transition">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-semibold truncate max-w-[70%]">
                        {task.projectName}
                      </span>
                      {overdue && (
                        <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full font-bold">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
                    </div>
                    {task.due_date && (
                      <p className="text-[10px] text-zinc-400">Due Date: {task.due_date}</p>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-50">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        task.priority === 'high' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : task.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {task.priority}
                      </span>
                      <button
                        disabled={updatingTaskId === task.id}
                        onClick={() => handleStatusChange(task.id, 'done')}
                        className="text-xs bg-green-600 text-white font-medium px-2.5 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
              {myTasks.filter(t => t.status === 'in_progress').length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-6">No active tasks in track</p>
              )}
            </div>
          </div>

          {/* Done column */}
          <div className="bg-zinc-100/50 rounded-xl p-4 border border-zinc-200/60 flex flex-col space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Done</h3>
              <span className="text-xs bg-zinc-200 text-zinc-600 font-medium px-2 py-0.5 rounded-full">
                {myTasks.filter(t => t.status === 'done').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[60vh]">
              {myTasks.filter(t => t.status === 'done').map(task => (
                <div key={task.id} className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm space-y-3 opacity-75 hover:opacity-100 transition">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded font-semibold truncate max-w-[70%]">
                      {task.projectName}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 text-sm line-through text-zinc-500">{task.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{task.description}</p>
                  </div>
                  {task.due_date && (
                    <p className="text-[10px] text-zinc-400">Due Date: {task.due_date}</p>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-50">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 text-zinc-500">
                      Completed
                    </span>
                    <button
                      disabled={updatingTaskId === task.id}
                      onClick={() => handleStatusChange(task.id, 'todo')}
                      className="text-xs border border-zinc-300 text-zinc-600 font-medium px-2 py-1 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition"
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              ))}
              {myTasks.filter(t => t.status === 'done').length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-6">No completed tasks yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Role;
use App\Models\Project;
use App\Models\Task;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(User::with('role')->get(), 200);
    }

    public function getUsers(Request $request)
    {
        return response()->json(User::with('role')->get(), 200);
    }

    public function getStats(Request $request)
    {
        $user = $request->user()->load('role');
        $roleName = $user->role->name;

        if ($roleName === 'admin') {
            return response()->json([
                'role' => 'admin',
                'total_users' => User::count(),
                'total_projects' => Project::count(),
                'total_tasks' => Task::count(),
            ], 200);
        } elseif ($roleName === 'manager') {
            $managedProjectIds = Project::where('manager_id', $user->id)->pluck('id');
            
            $totalProjects = $managedProjectIds->count();
            $totalTasks = Task::whereIn('project_id', $managedProjectIds)->count();
            
            // Get unique member count assigned to manager's projects
            $totalMembers = \DB::table('project_user')
                ->whereIn('project_id', $managedProjectIds)
                ->distinct('user_id')
                ->count('user_id');

            return response()->json([
                'role' => 'manager',
                'total_projects' => $totalProjects,
                'total_tasks' => $totalTasks,
                'total_members' => $totalMembers,
            ], 200);
        } else {
            // member
            $assignedProjectCount = \DB::table('project_user')
                ->where('user_id', $user->id)
                ->count();
            
            $assignedTaskCount = Task::where('assigned_to', $user->id)->count();

            return response()->json([
                'role' => 'member',
                'total_assigned_projects' => $assignedProjectCount,
                'total_assigned_tasks' => $assignedTaskCount,
            ], 200);
        }
    }

    public function getRoles(Request $request)
    {
        return response()->json(Role::all(), 200);
    }

    public function updateUserRole(Request $request, $id)
    {
        $fields = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'role_id' => $fields['role_id'],
        ]);

        return response()->json($user->load('role'), 200);
    }
}

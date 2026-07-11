<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Project;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Project::with(['manager', 'members', 'tasks.assignee'])->get(), 200);
    }

    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $project = Project::create([
            'manager_id' => $request->user()->id,
            'name' => $fields['name'],
            'description' => $fields['description'] ?? null,
            'due_date' => $fields['due_date'] ?? null,
            'status' => 'todo',
        ]);

        return response()->json($project, 201);
    }

    public function assignMembers(Request $request, $id)
    {
        $fields = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $project = Project::findOrFail($id);
        $project->members()->sync($fields['user_ids']);

        return response()->json([
            'message' => 'Members assigned successfully.',
            'project' => $project->load('members')
        ], 200);
    }
}

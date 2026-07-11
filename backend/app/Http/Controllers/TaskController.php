<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Task;

class TaskController extends Controller
{
    public function store(Request $request)
    {
        $fields = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'assigned_to' => 'required|exists:users,id',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'priority' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $task = Task::create([
            'project_id' => $fields['project_id'],
            'assigned_to' => $fields['assigned_to'],
            'title' => $fields['title'],
            'description' => $fields['description'] ?? null,
            'status' => 'todo',
            'priority' => $fields['priority'] ?? 'medium',
            'due_date' => $fields['due_date'] ?? null,
        ]);

        return response()->json($task, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $fields = $request->validate([
            'status' => 'required|string',
        ]);

        $task = Task::findOrFail($id);
        $task->update([
            'status' => $fields['status'],
        ]);

        return response()->json($task, 200);
    }
}

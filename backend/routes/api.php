<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// Public Gateways
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Core Protected Application System Route Group
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) { return $request->user()->load('role'); });
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::get('/analytics/stats', [AdminController::class, 'getStats']);

    // 1. Administrator Controlled Domain
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [AdminController::class, 'index']);
        Route::get('/admin/roles', [AdminController::class, 'getRoles']);
        Route::put('/admin/users/{id}/role', [AdminController::class, 'updateUserRole']);
    });

    // 2. Project Manager & Admin Shared Domain
    Route::middleware('role:manager,admin')->group(function () {
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::post('/projects/{id}/assign', [ProjectController::class, 'assignMembers']);
        Route::post('/tasks', [TaskController::class, 'store']);
    });

    // 3. Shared Standard View Domains (Admin, Manager, & Member can read or transition state)
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::put('/tasks/{id}/status', [TaskController::class, 'updateStatus']);
});
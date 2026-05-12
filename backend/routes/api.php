<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status'  => 'ok',
        'service' => 'Study Mission Control API',
        'version' => '2.0.0',
        'phase'   => 4,
    ]);
});

// Static exam dates
Route::get('/dates', [StudyController::class, 'dates']);

// Auth routes (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (require Sanctum token)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // Auth management
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'me']);

    // Core study endpoints
    Route::post('/forecast', [StudyController::class, 'forecast']);
    Route::post('/simulate', [StudyController::class, 'simulate']);
});

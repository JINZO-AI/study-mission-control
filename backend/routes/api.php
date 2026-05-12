<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ForecastController;
use App\Http\Controllers\SimulateController;
use App\Http\Controllers\DateController;

// Public routes
Route::get('/health', fn() => response()->json(['status' => 'healthy']));
Route::get('/dates', [DateController::class, 'index']);

// Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',   [AuthController::class, 'logout']);
    Route::get('/me',        [AuthController::class, 'me']);
    Route::post('/forecast', [ForecastController::class, 'forecast']);
    Route::post('/simulate', [SimulateController::class, 'simulate']);
});

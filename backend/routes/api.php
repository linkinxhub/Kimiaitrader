<?php

use App\Http\Controllers\Api\AdminBootstrapController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DynamicModuleController;
use App\Http\Controllers\Api\FormController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\PublicSiteController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ThemeController;
use Illuminate\Support\Facades\Route;

Route::prefix('public')->group(function (): void {
    Route::get('bootstrap', [PublicSiteController::class, 'bootstrap']);
    Route::get('pages/resolve', [PublicSiteController::class, 'resolve']);
    Route::get('forms/{slug}', [FormController::class, 'showPublic']);
    Route::post('forms/{slug}/submit', [FormController::class, 'submit']);
});

Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('admin/bootstrap', [AdminBootstrapController::class, 'index']);
    Route::apiResource('pages', PageController::class);
    Route::apiResource('forms', FormController::class)->except(['show']);
    Route::apiResource('menus', MenuController::class);
    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings', [SettingController::class, 'update']);
    Route::get('themes', [ThemeController::class, 'index']);
    Route::put('themes/{theme}', [ThemeController::class, 'update']);
    Route::post('themes/{theme}/activate', [ThemeController::class, 'activate']);
    Route::apiResource('dashboards', DashboardController::class);
    Route::get('modules/{module}', [DynamicModuleController::class, 'index']);
    Route::post('modules/{module}', [DynamicModuleController::class, 'store']);
    Route::get('modules/{module}/{id}', [DynamicModuleController::class, 'show']);
    Route::put('modules/{module}/{id}', [DynamicModuleController::class, 'update']);
    Route::delete('modules/{module}/{id}', [DynamicModuleController::class, 'destroy']);
});

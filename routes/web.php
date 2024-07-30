<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Content\ContentController;
use App\Http\Controllers\Content\ProjectController;
use App\Http\Controllers\Content\MixController;
use App\Http\Controllers\Content\AppController;
use App\Http\Middleware\IsAdmin;

Route::get('/', [HomeController::class, 'index'])->name('home');


// Contents
Route::group(['middleware' => ['auth', 'verified', IsAdmin::class]], function () {
    Route::resource('contents', ContentController::class)->except(['index', 'show']);
});
Route::get('contents/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified', IsAdmin::class])->name('contents.dashboard');

Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
Route::get('projects/{slug}', [ProjectController::class, 'show'])->name('projects.show');
Route::get('mixes', [MixController::class, 'index'])->name('mixes.index');
Route::get('mixes/{slug}', [MixController::class, 'show'])->name('mixes.show');
Route::get('apps', [AppController::class, 'index'])->name('apps.index');
Route::get('apps/{slug}', [AppController::class, 'show'])->name('apps.show');


Route::middleware('auth', 'verified')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});


require __DIR__ . '/auth.php';

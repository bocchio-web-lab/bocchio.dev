<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProjectController;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::resource('projects', ProjectController::class)->only(['index', 'create', 'show']);


// Route::prefix('admin')->group(function () {
//     Route::view('/', 'admin.dashboard');
//     Route::view('/users', 'admin.users');
//     Route::view('/settings', 'admin.settings');
// });

// Route::get('/products/{id}', function ($id) {
//     // codice per recuperare il prodotto con l'ID specificato
//     });

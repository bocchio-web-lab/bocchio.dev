<?php

namespace App\Http\Controllers;

use App\Models\Home;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('layouts.content')
            ->with('title', 'Home')
            ->with('description', 'Welcome to the home page');
    }
}

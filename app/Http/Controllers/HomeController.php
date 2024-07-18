<?php

namespace App\Http\Controllers;

use App\Models\Home;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $homes = Cache::remember('homes', 3600, function() {
            return Home::orderBy('created_at', 'ASC')->get();
        });

        return view('pages.home')
            ->with('cards', $homes);
    }
}

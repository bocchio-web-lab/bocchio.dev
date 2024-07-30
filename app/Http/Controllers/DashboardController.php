<?php

namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $contents = Content::select('id', 'slug', 'published', 'type', 'title')
            ->orderBy('created_at', 'DESC')
            ->get();

        return view('contents.dashboard')
            ->with('contents', $contents);
    }
}

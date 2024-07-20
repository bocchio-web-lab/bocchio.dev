<?php

namespace App\Http\Controllers\Content;

use App\Models\Content;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $cards = Content::orderBy('created_at', 'DESC')
                ->select('slug', 'title', 'description', 'img')
                ->where('type', 'app')
                ->where('published', true)
                ->get();

        foreach ($cards as $card) {
            $card->slug = route('apps.show', $card->slug);
        }

        return view('contents.index')
            ->with('title', 'Apps')
            ->with('description', 'List of personal apps completed or on the to-do list for the future.')
            ->with('cards', $cards);
    }

    /**
     * Display the specified resource.
     */
    public function show($slug)
    {
        $appPage = Content::where('slug', $slug)
            ->where('type', 'app')
            ->first();

        if (!$appPage) return abort(404);

        return view('contents.show')->with('content', $appPage);
    }
}

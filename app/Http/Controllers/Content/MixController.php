<?php

namespace App\Http\Controllers\Content;

use App\Models\Content;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MixController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $cards = Content::orderBy('created_at', 'DESC')
                ->select('slug', 'title', 'description', 'img')
                ->where('type', 'mix')
                ->where('published', true)
                ->get();

        foreach ($cards as $card) {
            $card->slug = route('mixes.show', $card->slug);
        }

        return view('contents.index')
            ->with('title', 'Mixes')
            ->with('description', 'List of uncategorized pages, mostly related to myself or my activities.')
            ->with('cards', $cards);
    }

    /**
     * Display the specified resource.
     */
    public function show($slug)
    {
        $mixPage = Content::where('slug', $slug)
            ->where('type', 'mix')
            ->first();

        if (!$mixPage) return abort(404);

        return view('contents.show')->with('content', $mixPage);
    }
}

<?php

namespace App\Http\Controllers\Content;

use App\Models\Content;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $cards = Content::orderBy('created_at', 'DESC')
                ->select('slug', 'title', 'description', 'img', 'tags')
                ->where('type', 'project')
                ->where('published', true)
                ->get();

        foreach ($cards as $card) {
            $card->slug = route('projects.show', $card->slug);
        }

        return view('contents.index')
            ->with('title', 'Projects')
            ->with('description', 'List of personal projects completed or on the to-do list for the future.')
            ->with('cards', $cards);
    }

    /**
     * Display the specified resource.
     */
    public function show($slug)
    {
        $projectPage = Content::where('slug', $slug)
            ->where('type', 'project')
            ->first();

        if (!$projectPage) return abort(404);

        $projectPage->tags = (array )$projectPage->tags;

        return view('contents.show')->with('content', $projectPage);
    }
}

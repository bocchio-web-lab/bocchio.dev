<?php

namespace App\Http\Controllers\Content;

use App\Models\Content;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContentController extends Controller
{
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('contents.create')
            ->with('title', 'New content')
            ->with('description', 'Create a new content page.');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:project,mix,app',
            'title' => 'required|string|max:255',
        ]);

        $content = Content::create([
            'type' => $request->input('type'),
            'slug' => Str::slug($request->input('title')),
            'title' => $request->input('title'),
        ]);

        return redirect()->route('contents.edit', $content->slug);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($slug)
    {
        $content = Content::where('slug', $slug)->first();

        if (!$content) return abort(404, 'Content to be edited not found.');

        // print_r($content->tags);
        // echo (gettype($content->tags));
        // return;

        return view('contents.edit')->with('content', $content);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $slug)
    {
        $request->validate([
            'published' => 'required|boolean',
            'phase' => 'required|integer',
            'type' => 'required|in:project,mix,app',
            'slug' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'img' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'gallery' => 'nullable|json',
            'tags' => 'nullable|json',
        ]);

        $content = Content::where('slug', $slug)->first();

        $content->published = $request->input('published');
        $content->phase = $request->input('phase');
        $content->slug = $request->input('slug');
        $content->title = $request->input('title');
        $content->description = $request->input('description');
        $content->img = $request->input('img');
        $content->content = $request->input('content');
        $content->gallery = json_decode($request->input('gallery'));
        $content->tags = json_decode($request->input('tags'));

        $content->save();

        return redirect()->route('contents.edit', $content->slug);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($slug)
    {
        $content = Content::where('slug', $slug)->first();
        $content->delete();

        return redirect()->route('contents.dashboard');
    }
}

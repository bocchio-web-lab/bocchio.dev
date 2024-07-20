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
            'type' => 'required|in:contents,mixes',
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

        return view('contents.edit')->with('content', $content);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'published' => 'required|boolean',
            'content_phase' => 'required|in:not_started,in_progress,completed',
            'slug' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'img' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'gallery' => 'nullable|json',
            'tags' => 'nullable|json',
        ]);

        $content = Content::find($id);

        $content->published = $request->input('published');
        $content->content_phase = $request->input('content_phase');
        $content->slug = $request->input('slug');
        $content->title = $request->input('title');
        $content->description = $request->input('description');
        $content->img = $request->input('img');
        $content->content = $request->input('content');
        $content->gallery = $request->input('gallery');
        $content->tags = $request->input('tags');

        $content->save();

        return redirect()->route('contents.edit', ['id' => $content->id]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $content = Content::find($id);
        $content->delete();

        return redirect()->route('dashboard');
    }
}

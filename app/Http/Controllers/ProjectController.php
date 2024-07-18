<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = Cache::remember('projects', 3600, function() {
            return Project::orderBy('created_at', 'ASC')->where('published', true)->get();
        });

        foreach ($projects as $project) {

            $project->slug = route('projects.show', $slug = $project->slug);
            $project->tags = json_decode($project->tags);
            $project->gallery = json_decode($project->gallery);

        }

        // echo '<pre>' . json_encode($projects, JSON_PRETTY_PRINT) . '</pre>';
        // return;

        return view('pages.projects.index')
    ->with('cards', $projects);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('pages.projects.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // // Date must be in format Y-M-D. Must also not already exist in entries table date column
        // // Selected mood_id must exist in the moods table under column id
        // $request->validate([
        //     'date' => 'required|date_format:Y-m-d|unique:entries,date,',
        //     'notes' => 'string|nullable',
        //     'mood_id' => 'required|exists:moods,id',
        // ]);

        // Entry::create($request->all());

        // return redirect()->route('entries.index')
        //     ->with('success', 'Entry created.');
    }

    /**
     * Display the specified resource.
     */
    public function show($slug)
    {
        $project = Project::where('slug', $slug)->first();

        $project->tags = json_decode($project->tags);
        $project->gallery = json_decode($project->gallery);

        return view('pages.projects.show')
            ->with('project', $project);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project)
    {
        // $moods = Cache::remember('moods', 3600, function() {
        //     return Mood::all();
        // });

        // return view('entries.edit', compact('entry', 'moods'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project)
    {
        // Date must be in format Y-M-D. Must also not already exist in entries table date column
        // Selected mood_id must exist in the moods table under column id
        $request->validate([
            'date' => 'required|date_format:Y-m-d|unique:entries,date,'. $entry->id,
            'notes' => 'string|nullable',
            'mood_id' => 'required|exists:moods,id',
        ]);

        $updatedEntry = $request->all();
        $entry->update($updatedEntry);

        return redirect()->route('entries.show', [$entry->id])
            ->with('success', 'Entry updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project)
    {
        $entry->delete();

        return redirect()->route('entries.index')
            ->with('success', 'Entry deleted.');
    }
}

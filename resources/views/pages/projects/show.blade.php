@extends('layouts.base', ['title' => 'Projects', 'description' => 'Index page for projects'])

@section('main')
    <main class=" justify-center items-center w-full">

        <div id="project-displayer" class="bg-white rounded-2xl p-4 w-11/12 my-4 mx-auto md:max-w-4xl md:p-8">
            <h1 class="font-heading font-extrabold text-center mb-4"> {{ $project->title }} </h1>
            <img src="{{ $project->img }}" alt="{{ $project->title }}">

            {!! $project->content !!}

            @if (count($project->gallery) > 0)
                <h2>Gallery</h2>
                <div class="grid grid-cols-3">
                    @foreach ($project->gallery as $gallery)
                        <img src="{{ $gallery }}" alt="{{ $project->title }}">
                    @endforeach
                </div>
            @endif

            <div class="flex justify-center items-center">
                <a href="{{ route('projects.index') }}" class="btn btn-primary">Back to Projects</a>
            </div>
        </div>

    </main>
@endsection

{{-- @extends('layouts.base', ['title' => 'Projects', 'description' => 'Index page for contents']) --}}

<x-layout-content :title="$content->title" :description="$content->description">

    {{-- @if (Auth::check() && Auth::user()->is_admin == 1)
        <div class="bg-white rounded-2xl p-4 my-4 mx-auto md:p-8 lg:px-14 lg:py-10">
            <div class="flex justify-center text-center m-auto gap-4">

                <a href="{{ route('contents.edit', ['id' => $content->id]) }}">
                    <x-buttons.primary>Edit this content</x-buttons.primary>
                </a>

                <form method="POST" action="{{ route('contents.destroy', ['id' => $content->id]) }}">
                    @csrf
                    @method('DELETE')
                    <x-buttons.danger type="submit" onclick="return confirm('Are you sure?')">Delete this
                        content</x-buttons.danger>
            </div>
        </div>
    @endif --}}

    <div class="show-section bg-white rounded-2xl p-4 my-4 mx-auto md:p-8 lg:px-14 lg:py-10">

        {{-- Heading of the content --}}
        <h1 class="font-heading font-extrabold text-3xl text-center mb-4 md:text-5xl"> {{ $content->title }} </h1>

        <figure>
            <img src="{{ $content->img }}" alt="{{ $content->title }}">
            <figcaption>{{ $content->title }}</figcaption>
        </figure>
        <p>{!! $content->description !!}</p>

        @include('components.tags', ['tags' => $content->tags])

        {{-- Body of the content --}}
        {!! $content->content !!}

        {{-- Gallery of the content --}}
        @isset($content->gallery)
            <div>
                <h2>Gallery</h2>
                <div class="columns-1 sm:columns-2 gap-6 my-6">
                    @foreach ($content->gallery as $gallery)
                        <div class=" break-inside-avoid mb-8">
                            <img src="{{ $gallery }}" alt="{{ $content->title }}">
                        </div>
                    @endforeach
                </div>
            </div>
        @endisset

    </div>

</x-layout-content>

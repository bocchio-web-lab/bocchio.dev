@extends('layouts.base', ['title' => 'Projects', 'description' => 'Index page for projects'])

@section('main')
    <main>

        @include('components.cards-container', ['cards' => $cards])

    </main>
@endsection

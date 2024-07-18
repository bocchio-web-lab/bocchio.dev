@extends('layouts.base', ['title' => 'Home'])

@section('main')
    <main>

        @include('components.cards-container', ['cards' => $cards])

    </main>
@endsection

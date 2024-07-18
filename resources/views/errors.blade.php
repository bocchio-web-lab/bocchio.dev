@php

    $card = [
        'title' => 'Error 404',
        'paragraphs' => [
            'Looks like the page you are looking for does not exist.',
            'Don\'t worry, it happens to the best of us :)',
        ],
        'image' => [
            'src' => 'https://via.placeholder.com/150',
            'alt' => 'Placeholder',
        ],
        'link' => '/',
    ];

@endphp


@extends('layouts.base', ['title' => 'Error 404'])

@section('main')
    <main>

        <section>

            @include('components.card', ['card' => $card])

        </section>

    </main>
@endsection

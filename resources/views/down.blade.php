@php

    $card = [
        'title' => 'Maintenance',
        'paragraphs' => ['The site is currently under maintenance.', 'We apologize for the inconvenience.'],
        'image' => [
            'src' => 'https://via.placeholder.com/150',
            'alt' => 'Placeholder',
        ],
        'link' => '/',
    ];

@endphp

@extends('layouts.base', ['title' => 'Maintenance'])

@section('main')
    <main>

        <section>

            @include('components.card', ['card' => $card])

        </section>

    </main>
@endsection

<!DOCTYPE html>
<html lang="en">

@include('elements.head', [
    'title' => $title ?? 'Bocchio\'s Site',
    'description' => $description ?? null,
])

<body class="bg-black">

    @include('components.header')

    @yield('main')

    @include('elements.footer')

    {{-- @include('elements.particles') --}}

</body>

</html>

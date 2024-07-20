@props(['title', 'description'])

<!DOCTYPE html>
<html lang="en">

<x-partials.head :title="$title" :description="$description" />

<body class="bg-black flex flex-col min-h-screen">

    <x-partials.header />
    <x-slogan />

    @if (isset($slot) && $slot->hasActualContent())
        <main {{ $attributes->merge(['class' => 'w-11/12 mx-auto my-4 max-w-4xl']) }}>
            {{ $slot }}
        </main>
    @endif

    <x-partials.footer />

    <x-particles />

</body>

</html>

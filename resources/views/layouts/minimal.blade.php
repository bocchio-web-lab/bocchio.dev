@props(['title' => 'Welcome', 'description' => ''])

<!DOCTYPE html>
<html lang="en">

<x-partials.head :title="$title" :description="$description" />

<body class="bg-black flex flex-col min-h-screen">

    <main class="flex items-center justify-center w-full p-4 m-auto">
        <div {{ $attributes->merge(['class' => 'bg-white shadow-md rounded px-8 pt-6 pb-8 m-auto w-full']) }}>
            {{ $slot }}
        </div>
    </main>

    {{-- Footer --}}
    <footer class="bg-white p-4 w-full mt-auto">
        <a href="{{ route('home') }}">
            <p class="font-heading font-extrabold whitespace-nowrap text-center text-gray-500 sm:text-xl">
                Tommaso Bocchietti &copy; {{ date('Y') }}
            </p>
        </a>
    </footer>

    {{-- @include('components.particles') --}}

</body>

</html>

<!DOCTYPE html>
<html lang="en">

@include('elements.head', [
    'title' => $title ?? 'Bocchio\'s Site',
    'description' => $description ?? null,
])

<body class="bg-black">

    @yield('main')

    @include('elements.particles')

    <div class="bg-white p-4 fixed bottom-0 w-full">
        <p class="text-center text-gray-500 font-heading font-extrabold text-base">
            Tommaso Bocchietti &copy; {{ date('Y') }}
        </p>
    </div>

</body>

</html>

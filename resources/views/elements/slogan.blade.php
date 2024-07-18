@php
    $isHome = Route::is('home');
@endphp

@if ($isHome)
    <div class="flex items-center p-4 justify-center w-full -z-10 md:p-8 h-screen absolute top-0">
        <p
            class="opacity-0 font-['Bungee_Shade'] font-extrabold text-app-color text-3xl text-center animate-sloganReveal sm:text-5xl md:text-7xl xl:text-9xl">
            Get Things Done!
        </p>
    </div>

    <div class="h-screen w-full"></div>
@else
    <p class="font-['Bungee_Shade'] text3D font-extrabold text-app-color text-2xl text-center my-8 md:my-12 md:text-5xl">
        Get Things Done!
    </p>
@endif

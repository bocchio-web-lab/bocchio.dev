<div @class([
    'flex items-center justify-center w-full p-4 md:p-8',
    'm-auto' => Route::is('home'),
])>
    <p
        {{ $attributes->class([
            "font-['Bungee_Shade'] font-extrabold text-app-color text-center",
            'opacity-0 text-4xl animate-sloganReveal sm:text-5xl md:text-7xl xl:text-9xl mb-8 md:mb-12' => Route::is('home'),
            'text3D text-2xl md:text-5xl' => !Route::is('home'),
        ]) }}>
        Get Things Done!
    </p>

</div>

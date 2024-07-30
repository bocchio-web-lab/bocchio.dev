@if (App::environment('local'))

    <div class="opacity-0 fixed -z-50 top-0 w-full h-screen animate-particleReveal bg-black">
        @for ($i = 0; $i < 100; $i++)
            <figure class="particle absolute bg-white m-0 rounded-full"></figure>
        @endfor
    </div>

@endif

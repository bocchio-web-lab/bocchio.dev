@php

    $footerItems = [
        ['url' => 'https://github.com/Bocchio01', 'icon' => 'GitHub.png', 'alt' => 'GitHub logo'],
        ['url' => 'https://t.me/Bocchio01', 'icon' => 'Telegram.png', 'alt' => 'Telegram logo'],
        // ['url' => 'https://www.instagram.com/bocchio_01/', 'icon' => 'Instagram.png', 'alt' => 'Instagram logo'],
        ['url' => 'mailto:webmaster@bocchio.dev', 'icon' => 'Email.png', 'alt' => 'Email logo'],
    ];

@endphp

<footer @class(['mt-auto' => !Route::is('home')])>

    <nav class="bg-white border rounded-md px-4 lg:px-6 py-2.5">
        <div class="justify-center items-center m-auto max-w-sm">

            <ul class="flex flex-row justify-around gap-4 mx-4">

                @foreach ($footerItems as $item)
                    <li>
                        <a href="{{ $item['url'] }}" rel="nofollow noopener noreferrer" target="_blank">
                            <span>
                                <img src="https://res.cloudinary.com/bocchio/image/upload/v1632947036/{{ $item['icon'] }}"
                                    alt="{{ $item['alt'] }}" class="h-8 md:h-10">
                            </span>
                        </a>
                    </li>
                @endforeach

            </ul>

            <p
                class="font-heading font-extrabold whitespace-nowrap text-center text-gray-500 border-t border-gray-500 mt-4 sm:text-xl">
                Tommaso Bocchietti &copy; {{ date('Y') }}
            </p>

        </div>
    </nav>

</footer>

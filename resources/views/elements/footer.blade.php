@php

    $footerItems = [
        ['url' => 'https://github.com/Bocchio01', 'icon' => 'GitHub.png', 'alt' => 'GitHub logo'],
        ['url' => 'https://t.me/Bocchio01', 'icon' => 'Telegram.png', 'alt' => 'Telegram logo'],
        ['url' => 'https://www.instagram.com/bocchio_01/', 'icon' => 'Instagram.png', 'alt' => 'Instagram logo'],
        ['url' => 'mailto:webmaster@bocchio.dev', 'icon' => 'Email.png', 'alt' => 'Email logo'],
    ];

@endphp

<footer class="w-full rounded-md bg-white mt-8">

    <nav class="max-w-md m-auto p-4 ustify-center items-center">
        <p class="font-heading font-extrabold text-xl text-center">You can also find me here</p>
        <ul class="grid grid-cols-4 mx-auto my-4">

            @foreach ($footerItems as $item)
                <li>
                    <a href="{{ $item['url'] }}" rel="nofollow noopener noreferrer" target="_blank">
                        <span>
                            <img src="https://res.cloudinary.com/bocchio/image/upload/v1632947036/{{ $item['icon'] }}"
                                alt="{{ $item['alt'] }}" class="w-12 m-auto md:w-14">
                        </span>
                    </a>
                </li>
            @endforeach

        </ul>

        <p class="font-heading font-extrabold text-xl text-center m-4">
            <a href="{{ url('dashboard') }}">Personal area</a>
        </p>

        <p class="font-heading font-extrabold border-t mt-4 pt-2 border-gray-500 text-gray-500 text-center text-2xl">
            Tommaso
            Bocchietti ©
            {{ date('Y') }}</p>
    </nav>

</footer>

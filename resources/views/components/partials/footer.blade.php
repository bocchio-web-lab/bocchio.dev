<footer @class(['mt-auto' => !Route::is('home')])>

    <nav class="bg-white border rounded-md px-4 lg:px-6 py-2.5">
        <div class="justify-center items-center m-auto max-w-sm">

            <ul class="flex flex-row justify-around gap-4 mx-4">

                <li>
                    <a href="https://t.me/Bocchio01" rel="nofollow noopener noreferrer" target="_blank">
                        <x-icons.telegram class="rounded-full h-8 md:h-10" />
                    </a>
                </li>

                <li>
                    <a href="https://github.com/Bocchio01" rel="nofollow noopener noreferrer" target="_blank">
                        <x-icons.github class="rounded-full h-8 md:h-10" />
                    </a>
                </li>

                <li>
                    <a href="mailto:webmaster@bocchio.dev" rel="nofollow noopener noreferrer" target="_blank">
                        <x-icons.email class="rounded-full h-8 md:h-10" />
                    </a>
                </li>

            </ul>

            <p
                class="font-heading font-extrabold whitespace-nowrap text-center text-gray-500 border-t border-gray-500 mt-4 sm:text-xl">
                Tommaso Bocchietti &copy; {{ date('Y') }}
            </p>

        </div>
    </nav>

</footer>

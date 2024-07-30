@php

    $menuItems = [
        ['name' => 'Projects', 'url' => '/projects'],
        ['name' => 'Apps', 'url' => '/apps'],
        ['name' => 'Mixes', 'url' => '/mixes'],
    ];

@endphp

<header>

    <nav class="bg-white border rounded-md px-4 lg:px-6 py-2.5">
        <div class="flex flex-wrap justify-between items-center m-auto max-w-screen-xl">

            {{-- Left block --}}
            <a href="{{ route('home') }}" class="group flex items-center gap-4">
                <x-icons.gear-bulb class="h-9 sm:h-14" />
                <span
                    class="font-heading font-extrabold whitespace-nowrap group-hover:text-app-color group-hover:underline sm:text-xl">
                    Tommaso Bocchietti
                </span>
            </a>

            {{-- Right block --}}
            <div class="flex gap-6 self-center">

                {{-- Large screen menu (Projects, Apps...) --}}
                <div class="hidden justify-between items-center w-full lg:flex lg:w-auto">
                    <ul class="flex flex-col mt-4 lg:flex-row lg:space-x-8 lg:mt-0">
                        @foreach ($menuItems as $menuItem)
                            <li>
                                <a href="{{ url($menuItem['url']) }}"
                                    class="font-heading font-extrabold block py-2 pr-4 pl-3 text-right border-b border-gray-100 hover:bg-gray-50 hover:text-app-color lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 sm:text-xl hover:underline">{{ $menuItem['name'] }}</a>
                            </li>
                        @endforeach
                    </ul>
                </div>

                {{-- Small screen hamburger button menu --}}
                <button id="hamburgerIcon" type="button"
                    class="inline-flex items-center p-2 ml-1 text-sm text-black rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    aria-controls="mobile-menu-2" aria-expanded="false">
                    <span class="sr-only">Open main menu</span>
                    <svg id="hamburgerClosedSvg" class="block w-6 h-6" fill="currentColor" viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd"
                            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clip-rule="evenodd"></path>
                    </svg>
                    <svg id="hamburgerOpenSvg" class="hidden w-6 h-6" fill="currentColor" viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"></path>
                    </svg>
                </button>

                {{-- Profile menu --}}
                <div class="group self-center">

                    {{-- Profile icon --}}
                    @auth
                        <x-icons.profile-user class="h-9 sm:h-14" alt="{{ auth()->user()->name }}" />
                    @else
                        <x-icons.guest class="h-8 md:h-10 w-auto m-auto content-center" />
                    @endauth

                    {{-- Profile menu --}}
                    <div class="hidden relative w-0 h-0 z-10 ml-auto focus:outline-none group-hover:block hover:block">
                        <ul
                            class="flex flex-col absolute w-44 -left-44 bg-white origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                            <li class="text-right py-2 px-4 border-b border-gray-100">
                                {{ auth()->user()->name ?? 'Guest' }}
                            </li>
                            @auth

                                @if (auth()->user()->is_admin)
                                    <li class="text-right text-gray-500 py-1 px-4 hover:bg-gray-50">
                                        <a href="{{ route('contents.dashboard') }}" class="block">
                                            Content dashboard
                                        </a>
                                    </li>
                                @endif
                                @if (auth()->user()->hasVerifiedEmail())
                                    <li class="text-right text-gray-500 py-1 px-4 hover:bg-gray-50">
                                        <a href="{{ route('profile.edit') }}" class="block">
                                            Your profile
                                        </a>
                                    </li>
                                @else
                                    <li class="text-right text-gray-500 py-1 px-4 hover:bg-gray-50">
                                        <a href="{{ route('verification.notice') }}" class="block">
                                            Verify your email
                                        </a>
                                    </li>
                                @endif

                                <li class="text-right text-gray-500 py-1 px-4 hover:bg-gray-50">
                                    <a tabindex="0" role="button" class="block"
                                        onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                                        Log out
                                    </a>
                                </li>
                            @else
                                <li class="text-right text-gray-500 py-1 px-4 hover:bg-gray-50">
                                    <a href="{{ route('login') }}" class="block">
                                        Log in
                                    </a>
                                </li>
                                <li class="text-right text-gray-500 py-1 px-4 hover:bg-gray-50">
                                    <a href="{{ route('register') }}" class="block">
                                        Sign up
                                    </a>
                                </li>
                            @endauth
                        </ul>
                    </div>
                </div>

            </div>

            {{-- Hamburger dropdown menu --}}
            <div class="hidden justify-between items-center w-full lg:h-0 lg:invisible" id="hamburgerDropdownMenu">
                <ul class="flex flex-col lg:space-x-8">
                    @foreach ($menuItems as $menuItem)
                        <li>
                            <a href="{{ url($menuItem['url']) }}"
                                class="font-heading font-extrabold block py-2 pr-4 pl-3 text-right border-b border-gray-100 hover:bg-gray-50 hover:text-app-color lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 sm:text-xl hover:underline">{{ $menuItem['name'] }}</a>
                        </li>
                    @endforeach
                </ul>
            </div>


        </div>
    </nav>

    <form id="logout-form" action="{{ route('logout') }}" method="POST">
        @csrf
    </form>

</header>

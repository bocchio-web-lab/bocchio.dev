<x-layout-content :title="$title" :description="$description">

    {{-- @if (Auth::check() && Auth::user()->is_admin == 1)
        <div class="bg-white rounded-2xl p-4 my-4 mx-auto md:p-8 lg:px-14 lg:py-10">
            <div class="flex justify-center text-center m-auto gap-4">

                <a href="{{ route('projects.create') }}">
                    <x-buttons.primary>Create new project</x-buttons.primary>
                </a>

            </div>
        </div>
    @endif --}}

    @isset($cards)

        <div class="grid gap-6">

            @foreach ($cards as $card)
                @include('components.card', ['card' => $card])
            @endforeach

        </div>

    @endisset

</x-layout-content>

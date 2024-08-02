<div
    class="card-content group flex flex-wrap gap-8 justify-center rounded-xl border w-full p-4 bg-white transition-transform hover:scale-105 md:p-10">

    <div class="grow-[2] basis-96 content-center ">

        <div class="text-center mb-4">
            <h3 class="font-heading font-extrabold text-2xl sm:text-3xl">
                {{ $card['title'] }}
            </h3>
            <x-phase :phase="$card->phase" />
        </div>

        <p>{!! $card['description'] !!}</p>

        {{-- <x-tags :tags="$card->tags" /> --}}

        <a href="{{ url($card['slug']) }}" class="hidden w-full md:block">
            <x-buttons.primary class="mt-6 justify-center w-full">Read the content</x-buttons.primary>
        </a>

    </div>

    <div class="content-center grow-[1] basis-60">
        <img src="{{ $card['img'] }}" alt="{{ $card['title'] }}"
            class="rounded-3xl max-h-60 m-auto transition-transform bg-white group-hover:scale-110" />
    </div>

    <a href="{{ url($card['slug']) }}" class="block w-full md:hidden">
        <x-buttons.primary class="justify-center w-full">Read the content</x-buttons.primary>
    </a>

</div>

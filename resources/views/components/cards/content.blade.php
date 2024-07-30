<div
    class="group flex flex-wrap gap-8 justify-center rounded-xl border w-full p-4 bg-white transition-transform hover:scale-105 md:p-10">

    <div class="grow-[2] basis-96 content-center ">

        <h3 class="font-heading font-extrabold text-xl text-center my-4 sm:text-2xl md:text-3xl md:mt-0">
            {{ $card['title'] }}
        </h3>

        <p>{!! $card['description'] !!}</p>

        <x-tags :tags="$card->tags" />

        <a href="{{ url($card['slug']) }}" class="hidden md:block">
            <x-buttons.primary class="mt-4 justify-center">Read the content</x-buttons.primary>
        </a>

    </div>

    <div class="content-center grow-[1] basis-60">
        <img src="{{ $card['img'] }}" alt="{{ $card['title'] }}"
            class="rounded-3xl max-h-60 m-auto transition-transform bg-white group-hover:scale-110" />

        <a href="{{ url($card['slug']) }}" class="mt-4 md:hidden">
            <x-buttons.primary class="mt-4 justify-center w-full">Read the content</x-buttons.primary>
        </a>
    </div>


</div>

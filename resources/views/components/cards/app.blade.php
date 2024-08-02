<div
    class="group flex flex-col gap-4 justify-center rounded-xl border p-4 bg-white transition-transform hover:scale-105 md:p-10">

    <div>

        <div class="text-center mb-2">

            <h3 class="font-heading font-extrabold text-2xl sm:text-3xl">
                {{ $card['title'] }}
            </h3>

        </div>

        <p>{!! $card['description'] !!}</p>

    </div>

    <img src="{{ $card['img'] }}" alt="{{ $card['title'] }}"
        class="rounded-3xl max-h-60 m-auto transition-transform bg-white group-hover:scale-110" />

    <a href="{{ url($card['slug']) }}" class="block w-full">
        <x-buttons.primary class="justify-center w-full">Learn more</x-buttons.primary>
    </a>

</div>

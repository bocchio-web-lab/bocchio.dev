<div
    class="group flex flex-col justify-center rounded-xl border p-4 bg-white transition-transform hover:scale-105 md:p-10">

    <h3 class="font-heading font-extrabold text-center sm:text-xl md:text-2xl">
        {{ $card['title'] }}
    </h3>

    <p class="mb-4">{!! $card['description'] !!}</p>

    <img src="{{ $card['img'] }}" alt="{{ $card['title'] }}"
        class="rounded-3xl max-h-60 m-auto transition-transform bg-white group-hover:scale-110" />

    <a href="{{ url($card['slug']) }}">
        <x-buttons.primary class="w-full justify-center mt-4">Learn More</x-buttons.primary>
    </a>

</div>

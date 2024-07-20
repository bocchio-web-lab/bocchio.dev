<a href="{{ url($card['slug']) }}" class="group">

    <div
        class="flex flex-wrap gap-8 justify-center rounded-xl border w-full p-4 bg-white transition-transform group-hover:scale-105 group-hover:bg-gray-500 md:p-10">

        <div class="grow-[2] basis-96 content-center ">

            <h3 class="font-heading font-extrabold text-xl text-center my-4 sm:text-2xl md:text-3xl md:mt-0">
                {{ $card['title'] }}
            </h3>

            <p>{!! $card['description'] !!}</p>

            @include('components.tags', ['tags' => $card['tags']])

        </div>

        <div class="content-center grow-[1] basis-60">
            <img src="{{ $card['img'] }}" alt="{{ $card['title'] }}"
                class="rounded-3xl max-h-60 m-auto transition-transform bg-white group-hover:scale-110" />
        </div>



    </div>

</a>

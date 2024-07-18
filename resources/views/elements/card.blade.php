<a href="{{ url($card['slug']) }}" class="group">

    <div
        class="card flex flex-wrap justify-center rounded-xl border w-full p-4 bg-white transition-transform group-hover:scale-105 group-hover:bg-gray-500 md:p-10">

        <div class="grow-[2] basis-96 content-center ">

            <h3 class="font-heading font-extrabold text-2xl text-center my-4 md:text-4xl md:mt-0">{{ $card['title'] }}
            </h3>

            <p class="">{!! $card['description'] !!}</p>

            @isset($card['tags'])
                <div class="flex flex-row flex-wrap w-10/12 justify-around m-auto gap-2 mt-4">
                    @foreach ($card['tags'] as $tag)
                        <span
                            class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#{{ $tag }}</span>
                    @endforeach
                </div>
            @endisset

        </div>

        <div class="m-4 content-center grow-[1] basis-60">
            <img src="{{ $card['img'] }}" alt="{{ $card['title'] }}"
                class="rounded-3xl max-h-60 m-auto transition-transform bg-white p-4 group-hover:scale-110" />
        </div>



    </div>

</a>

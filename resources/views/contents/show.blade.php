<x-layout-content :title="$content->title" :description="$content->description" class="max-w-4xl">

    <div class="bg-white rounded-2xl p-4 my-4 mx-auto md:p-8 lg:px-14 lg:py-10">

        {{-- Heading of the content --}}
        <div class="text-center mb-4">
            <h1 class="font-heading font-extrabold mb-2 text-3xl md:text-5xl"> {{ $content->title }} </h1>
            <x-phase :phase="$content->phase" />
        </div>

        <div class="show-section">
            <figure>
                <img src="{{ $content->img }}" alt="{{ $content->title }}">
                <figcaption>{{ $content->title }}</figcaption>
            </figure>

            <p>{!! $content->description !!}</p>

            @include('components.tags', ['tags' => $content->tags])

            {{-- Body of the content --}}
            {!! $content->content !!}

            {{-- Gallery of the content --}}
            @isset($content->gallery)
                <div>
                    <h2>Gallery</h2>
                    <div class="columns-1 sm:columns-2 gap-6 my-6">
                        @foreach ($content->gallery as $gallery)
                            <div class=" break-inside-avoid mb-8">
                                <img src="{{ $gallery }}" alt="{{ $content->title }}">
                            </div>
                        @endforeach
                    </div>
                </div>
            @endisset
        </div>


    </div>

</x-layout-content>

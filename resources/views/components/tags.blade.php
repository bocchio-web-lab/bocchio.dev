@props(['tags'])

@isset($tags)
    <div class="flex flex-row flex-wrap w-10/12 justify-around m-auto gap-2 mt-4">
        @foreach ($tags as $tag)
            <span
                class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#{{ $tag }}</span>
        @endforeach
    </div>
@endisset

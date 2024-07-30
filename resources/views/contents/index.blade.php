<x-layout-content :title="$title" :description="$description" @class([
    'max-w-4xl' => !Route::is('apps.index'),
    'max-w-screen-xl' => Route::is('apps.index'),
])>

    <div @class([
        'grid gap-6 mb-6',
        'grid-cols-1 justify-stretch items-stretch md:grid-cols-2 lg:grid-cols-3' => Route::is(
            'apps.index'),
    ])>

        @forelse ($cards as $card)
            @if (Route::is('apps.index'))
                <x-cards.app :card="$card" />
            @else
                <x-cards.content :card="$card" />
            @endif
        @empty
            <div class="flex items-center justify-center w-full h-96 col-span-full">
                <p class="text-lg text-gray-500">No content found.</p>
            </div>
        @endforelse

    </div>

</x-layout-content>

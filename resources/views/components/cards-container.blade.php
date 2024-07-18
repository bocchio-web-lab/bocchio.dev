@php

    $containerType = $containerType ?? 'list';

@endphp

<section>

    <div class="grid gap-6 w-11/12 max-w-screen-lg m-auto justify-center">

        @foreach ($cards as $card)
            @include('elements.card', ['card' => $card])
        @endforeach

    </div>


    {{-- @includeIf('components.pagination', ['pagination' => $pagination]) --}}

</section>

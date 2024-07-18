<!DOCTYPE html>
<html lang="it">

@include('components.head', ['title' => 'Projects', 'description' => 'Index page for projects'])

<body class="layout-base">


    @include('components.header')

    @include('components.slogan')

    <main>

        <section>

            @foreach ($cards as $card)
                @include('components.card', ['card' => $card])
            @endforeach

        </section>

        @include('components.pagination', ['batch' => $batch, 'total' => $total])

    </main>

    @include('components.footer')

    @include('components.background')



</body>

</html>

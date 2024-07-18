<!DOCTYPE html>
<html lang="it">

@include('components.head', ['title' => 'Mixes', 'description' => 'Index page for mixes'])

<body class="layout-base">

    @include('components.header')

    @include('components.slogan')

    <main>

        <section>

            @foreach ($cards as $card)
                @include('components.card', ['card' => $card])
            @endforeach

        </section>

    </main>

    @include('components.footer')

    @include('components.background')

</body>

</html>

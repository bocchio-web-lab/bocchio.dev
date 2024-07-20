<!DOCTYPE html>
<html lang="it">

@include('components.head', ['title' => 'Portals', 'description' => 'Index page for portals'])

<body class="layout-base">

    @include('components.header')

    @include('components.slogan')

    <main>

        <section style="display: flex">

            @foreach ($cards as $card)
                @include('components.card', ['card' => $card, 'type' => 'micro'])
            @endforeach

        </section>
        {{-- Route::get('/products/{id}', function ($id) {
        // codice per recuperare il prodotto con l'ID specificato
        })->name('product.show'); --}}

    </main>

    @include('components.footer')

    @include('components.background')

</body>

</html>

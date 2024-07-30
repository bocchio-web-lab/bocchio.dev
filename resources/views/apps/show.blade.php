<x-layout-content :title="$app->$title" :description="$app->$description" class="max-w-screen-xl">

    @include('apps.partials.' . $app->slug)

</x-layout-content>

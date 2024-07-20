<x-layout-minimal :title="'New project'" :description="'Form page for creating a new project entry'" class="max-w-lg">

    <form method="POST" action="{{ route('projects.store') }}">
        @csrf

        <!-- Title -->
        <div>
            <x-inputs.label for="title" :value="'Title'" />
            <x-inputs.text id="title" type="text" name="title" required autofocus />
            <x-inputs.errorbox :messages="$errors->get('title')" class="mt-2" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Create new project</x-buttons.primary>
        </div>
    </form>

</x-layout-minimal>

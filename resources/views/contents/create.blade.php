<x-layout-minimal :title="'New content'" :description="'Form page for creating a new content entry'" class="max-w-lg">

    <form method="POST" action="{{ route('contents.store') }}">
        @csrf

        <!-- Title -->
        <div>
            <x-inputs.label for="title" :value="'Title'" />
            <x-inputs.text id="title" type="text" name="title" required autofocus />
            <x-inputs.errorbox :messages="$errors->get('title')" class="mt-2" />
        </div>

        {{-- Type --}}
        <div class="mt-4">
            <x-inputs.label for="type" :value="'Type'" />
            <x-inputs.select id="type" name="type" required>
                <option value="project">Project</option>
                <option value="mix">Mix</option>
                <option value="app">App</option>
            </x-inputs.select>
            <x-inputs.errorbox :messages="$errors->get('type')" class="mt-2" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Create new content</x-buttons.primary>
        </div>
    </form>

</x-layout-minimal>

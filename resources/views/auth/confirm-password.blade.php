<x-layout-minimal :title="'Password confirmation'" :description="'Confirmation password page'" class="max-w-lg">

    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        This is a secure area of the application. Please confirm your password before continuing.
    </div>

    <form method="POST" action="{{ route('password.confirm') }}">
        @csrf

        <!-- Password -->
        <div class="mt-4">
            <x-inputs.label for="password" :value="'Password'" />
            <x-inputs.text id="password" type="password" name="password" required autocomplete="current-password" />
            <x-inputs.errorbox :messages="$errors->get('password')" class="mt-2" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="sumbit">Confirm</x-buttons.primary>
        </div>
    </form>

</x-layout-minimal>

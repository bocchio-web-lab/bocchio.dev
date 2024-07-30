<x-layout-minimal :title="'Forgot password'" :description="'Page to ask a rest of the password.'" class="max-w-lg">

    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        If you have forgotten your password, we can email you a link to reset it. Just enter your email address below.
    </div>

    <!-- Session Status -->
    <x-inputs.successbox class="mb-4" :messages="session('status')" />

    <form method="POST" action="{{ route('password.email') }}">
        @csrf

        <!-- Email Address -->
        <div>
            <x-inputs.label for="email" :value="'Email'" />
            <x-inputs.text id="email" type="email" name="email" :value="old('email')" required autofocus />
            <x-inputs.errorbox :messages="$errors->get('email')" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Send Link</x-buttons.primary>
        </div>
    </form>

</x-layout-minimal>

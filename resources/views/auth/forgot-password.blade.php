<x-layout-minimal>
    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        If you have forgotten your password, we can email you a link to reset it. Just enter your email address below.
    </div>

    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('password.email') }}">
        @csrf

        <!-- Email Address -->
        <div>
            <x-inputs.label for="email" :value="__('Email')" />
            <x-inputs.text id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required
                autofocus />
            <x-inputs.errorbox :messages="$errors->get('email')" class="mt-2" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary>Send Link</x-buttons.primary>
        </div>
    </form>
</x-layout-minimal>

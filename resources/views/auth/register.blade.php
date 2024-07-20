<x-layout-minimal :title="'Register'" :description="'Sign up page'" class="max-w-lg">

    <form method="POST" action="{{ route('register') }}">
        @csrf

        <!-- Name -->
        <div>
            <x-inputs.label for="name" :value="'Name'" />
            <x-inputs.text id="name" type="name" name="name" :value="old('name')" required autofocus
                autocomplete="name" />
            <x-inputs.errorbox :messages="$errors->get('name')" />
        </div>


        <!-- Email Address -->
        <div class="mt-4">
            <x-inputs.label for="email" :value="'Email'" />
            <x-inputs.text id="email" type="email" name="email" :value="old('email')" required autofocus
                autocomplete="username" />
            <x-inputs.errorbox :messages="$errors->get('email')" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-inputs.label for="password" :value="'Password'" />
            <x-inputs.text id="password" type="password" name="password" required autocomplete="new-password" />
            <x-inputs.errorbox :messages="$errors->get('password')" />
        </div>


        <!-- Confirm Password -->
        <div class="mt-4">
            <x-inputs.label for="password_confirmation" :value="'Confirm Password'" />
            <x-inputs.text id="password_confirmation" type="password" name="password_confirmation" required
                autocomplete="new-password" />
            <x-inputs.errorbox :messages="$errors->get('password_confirmation')" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <a class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-color"
                href="{{ route('login') }}">
                Already registered?
            </a>

            <x-buttons.primary type="submit">Register</x-buttons.primary>
        </div>
    </form>
</x-layout-minimal>

<x-layout-minimal :title="'Login'" :description="'Log in page'" class="max-w-lg">

    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}">
        @csrf

        <!-- Email Address -->
        <div>
            <x-inputs.label for="email" :value="'Email'" />
            <x-inputs.text id="email" type="email" name="email" :value="old('email')" required autofocus
                autocomplete="username" />
            <x-inputs.errorbox :messages="$errors->get('email')" class="mt-2" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-inputs.label for="password" :value="'Password'" />
            <x-inputs.text id="password" type="password" name="password" required autocomplete="current-password" />
            <x-inputs.errorbox :messages="$errors->get('password')" class="mt-2" />
        </div>

        <!-- Remember Me -->
        <div class="mt-4">
            <label for="remember_me" class="inline-flex items-center gap-2">
                <input id="remember_me" type="checkbox" class="shadow focus:ring-app-color" name="remember">
                <span class="text-sm text-gray-600 ">Remember me</span>
            </label>
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            @if (Route::has('password.request'))
                <a class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-app-color"
                    href="{{ route('password.request') }}">
                    Forgot your password?
                </a>
            @endif

            <x-buttons.primary type="submit">Log in</x-buttons.primary>
        </div>
    </form>

</x-layout-minimal>

<x-layout-minimal :title="'Register'" :description="'Sign up page'" class="max-w-lg flex flex-col gap-4">

    <form method="POST" action="{{ route('profile.update') }}" class="border rounded-md p-4">
        @csrf
        @method('patch')

        <!-- Name -->
        <div>
            <x-inputs.label for="name" :value="'Name'" />
            <x-inputs.text id="name" type="text" name="name" :value="old('name', Auth::user()->name)" required autofocus
                autocomplete="name" />
            <x-inputs.errorbox :messages="$errors->get('name')" />
        </div>

        <!-- Email Address -->
        <div class="mt-4">
            <x-inputs.label for="email" :value="'Email'" />
            <x-inputs.text id="email" type="email" name="email" :value="old('email', Auth::user()->email)" required :readonly="true" />
            <x-inputs.errorbox :messages="$errors->get('email')" />
        </div>

        <!-- Avatar -->
        <div class="mt-4">
            <x-inputs.label for="avatar" :value="'Avatar'" />
            <x-inputs.select id="avatar" name="avatar" required autofocus autocomplete="avatar">
                <option value="1"> <img
                        src="https://res.cloudinary.com/bocchio/image/upload/v1632947036/GitHub.png"
                        class="h-8 md:h-10"></option>
                <option value="2"> <img
                        src="https://res.cloudinary.com/bocchio/image/upload/v1632947036/GitHub.png"
                        class="h-8 md:h-10"></option>
                <option value="3"> <img
                        src="https://res.cloudinary.com/bocchio/image/upload/v1632947036/GitHub.png"
                        class="h-8 md:h-10"></option>
                <option value="4"> <img
                        src="https://res.cloudinary.com/bocchio/image/upload/v1632947036/GitHub.png"
                        class="h-8 md:h-10"></option>
                <option value="5"> <img
                        src="https://res.cloudinary.com/bocchio/image/upload/v1632947036/GitHub.png"
                        class="h-8 md:h-10"></option>
            </x-inputs.select>

            <x-inputs.errorbox :messages="$errors->get('name')" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Update profile</x-buttons.primary>
        </div>
    </form>

    {{-- Update password --}}
    <form method="POST" action="{{ route('password.update') }}" class="border rounded-md p-4">
        @csrf
        @method('put')

        <!-- Current password -->
        <div>
            <x-inputs.label for="update_password_current_password" :value="'Current password'" />
            <x-inputs.text id="update_password_current_password" type="password" name="current_password" required
                autocomplete="current-password" />
            <x-inputs.errorbox :messages="$errors->get('current_password')" />
        </div>

        <!-- New password -->
        <div class="mt-4">
            <x-inputs.label for="update_password_password" :value="'New password'" />
            <x-inputs.text id="update_password_password" type="password" name="password" required
                autocomplete="new-password" />
            <x-inputs.errorbox :messages="$errors->get('password')" />
        </div>

        <!-- Confirmation new password -->
        <div class="mt-4">
            <x-inputs.label for="update_password_password_confirmation" :value="'Confirm new password'" />
            <x-inputs.text id="update_password_password_confirmation" type="password" name="password_confirmation"
                required autocomplete="new-password" />
            <x-inputs.errorbox :messages="$errors->get('password_confirmation')" />
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Update password</x-buttons.primary>
        </div>

    </form>


    {{-- Delete user profile --}}
    <form method="POST" action="{{ route('profile.destroy') }}" class="border rounded-md p-4">
        @csrf
        @method('DELETE')
        <x-buttons.danger type="submit" class="w-full justify-center">Delete account</x-buttons.danger>
    </form>

    {{-- route('profile.update') --}}
    {{-- route('verification.send') --}}
    {{--
        @if (session('status') === 'password-updated')
            <p
                x-data="{ show: true }"
                x-show="show"
                x-transition
                x-init="setTimeout(() => show = false, 2000)"
                class="text-sm text-gray-600 dark:text-gray-400"
            >{{ __('Saved.') }}</p>
        @endif
    --}}

    {{-- <div
        class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
                <div
                    class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">Deactivate account</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">Are you sure you want to deactivate your account? All of your
                            data will be permanently removed. This action cannot be undone.</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button type="button"
                class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">Deactivate</button>
            <button type="button"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
        </div>
    </div> --}}

</x-layout-minimal>

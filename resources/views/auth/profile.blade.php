<x-layout-minimal :title="'Register'" :description="'Sign up page'" class="max-w-lg flex flex-col gap-4 p-6">

    <form method="POST" action="{{ route('profile.update') }}" class="border rounded-md p-4">
        @csrf
        @method('patch')

        @if (session('status') === 'profile-updated')
            <x-inputs.successbox :messages="'Profile updated successfully'" class="mb-4" />
        @endif

        <!-- Name -->
        <div>
            <x-inputs.label for="name" :value="'Name'" />
            <x-inputs.text id="name" type="text" name="name" :value="old('name', $user->name)" required autofocus
                autocomplete="name" />
            <x-inputs.errorbox :messages="$errors->get('name')" />
        </div>

        <!-- Email Address -->
        <div class="mt-4">
            <x-inputs.label for="email" :value="'Email'" />
            <x-inputs.text id="email" type="email" name="email" :value="old('email', $user->email)" required :readonly="true" />
            <x-inputs.errorbox :messages="$errors->get('email')" />
        </div>

        {{--
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

            <x-inputs.errorbox :messages="$errors->get('avatar')" />
        </div>
        --}}

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Update profile</x-buttons.primary>
        </div>
    </form>

    {{-- Update password --}}
    <form method="POST" action="{{ route('password.update') }}" class="border rounded-md p-4">
        @csrf
        @method('put')

        @if (session('status') === 'password-updated')
            <x-inputs.successbox :messages="'Password updated successfully'" class="mb-4" />
        @endif

        <!-- Current password -->
        <div>
            <x-inputs.label for="update_password_current_password" :value="'Current password'" />
            <x-inputs.text id="update_password_current_password" type="password" name="current_password" required
                autocomplete="current-password" />
            <x-inputs.errorbox :messages="$errors->updatePassword->get('current_password')" />
        </div>

        <!-- New password -->
        <div class="mt-4">
            <x-inputs.label for="update_password_password" :value="'New password'" />
            <x-inputs.text id="update_password_password" type="password" name="password" required
                autocomplete="new-password" />
            <x-inputs.errorbox :messages="$errors->updatePassword->get('password')" />
        </div>

        <!-- Confirmation new password -->
        <div class="mt-4">
            <x-inputs.label for="update_password_password_confirmation" :value="'Confirm new password'" />
            <x-inputs.text id="update_password_password_confirmation" type="password" name="password_confirmation"
                required autocomplete="new-password" />
            {{-- <x-inputs.errorbox :messages="$errors->get('password_confirmation')" /> --}}
        </div>

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Update password</x-buttons.primary>
        </div>

    </form>


    {{-- Delete user profile --}}
    <div class="border rounded-md p-4">
        <x-inputs.errorbox :messages="$errors->userDeletion->get('password')" class="mb-4" />

        <x-buttons.danger class="w-full justify-center"
            onclick="document.getElementById('modal-delete-profile').classList.remove('hidden')">Delete
            account</x-buttons.danger>
    </div>

    {{-- route('verification.send') --}}


    <x-modal :id="'modal-delete-profile'">
        <div>
            <h3 class="block mb-1 font-bold text-base text-gray-700">Delete account</h3>
            <p class="mt-2 text-sm text-gray-500">
                If you delete your account, you wont be able to get any data back in the future.
                All the registered API keys and apps data will be destroyed.
                This action cannot be undone.
                <br>
                Confirm your password to delete your account.
            </p>
        </div>

        <form method="POST" action="{{ route('profile.destroy') }}" id="delete_account_form" class="mt-4">
            @csrf
            @method('DELETE')

            <!-- Current password -->
            <div>
                <x-inputs.label for="delete_account_current_password" :value="'Current password'" />
                <x-inputs.text id="delete_account_current_password" type="password" name="password" required
                    autocomplete="current-password" />
            </div>
        </form>

        <div class="flex items-center justify-end mt-4 gap-4">

            <x-buttons.primary
                onclick="document.getElementById('modal-delete-profile').classList.add('hidden')">Cancel</x-buttons.primary>
            <x-buttons.danger
                onclick="event.preventDefault(); document.getElementById('delete_account_form').submit()">Delete
                account</x-buttons.danger>
        </div>
    </x-modal>

</x-layout-minimal>

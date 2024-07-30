<x-layout-minimal :title="'Email verification'" :description="'Verify your email page'" class="max-w-lg">

    @if (session('status') == 'verification-link-sent')
        <x-inputs.successbox class="mb-4" :messages="'A new verification link has been sent to the email address you provided during registration.'" />
    @endif

    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we
        just emailed to you? If you didn't receive the email, we will gladly send you another.
    </div>

    <form method="POST" action="{{ route('verification.send') }}">
        @csrf

        <div class="flex items-center justify-end mt-4 gap-4">
            <x-buttons.primary type="submit">Resend Verification Email</x-buttons.primary>
        </div>
    </form>

</x-layout-minimal>

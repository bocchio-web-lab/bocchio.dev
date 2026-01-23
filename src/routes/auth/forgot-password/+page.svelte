<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { ActionData } from './$types';

    interface Props {
        form: ActionData;
    }

    let { form }: Props = $props();

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Forgot Password</title>
</svelte:head>

<Card.Root class="mx-auto max-w-sm">
    <Card.Header>
        <Card.Title>Forgot Password</Card.Title>
        <Card.Description>Enter your email address and we'll send you a password reset link.</Card.Description>
    </Card.Header>

    <Card.Content>
    <form
        method="POST"
        use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
                await update();
                isSubmitting = false;
            };
        }}
    >
            {#if form?.success}
                <div
                    class="rounded-md border border-green-500 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
                >
                    {form.message || 'Password reset link sent! Check your email.'}
                </div>
            {:else if form?.error}
                <div
                    class="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
                >
                    {form.error}
                </div>
            {/if}

            <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form?.email || ''}
                    required
                    autocomplete="email"
                />
                {#if form?.errors?.email}
                    <p class="text-sm text-destructive">{form.errors.email[0]}</p>
                {/if}
            </div>

            <Button type="submit" class="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
        </form>
        </Card.Content>

        <Card.Footer class="flex flex-col gap-4">
            <div class="flex items-center justify-between text-sm">
                <a href="/auth/login" class="text-primary hover :underline">Back to Login</a>
                <a href="/auth/register" class="text-primary hover:underline">Create Account</a>
            </div>
        </Card.Footer>

</Card.Root>

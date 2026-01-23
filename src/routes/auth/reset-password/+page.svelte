<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Reset Password</title>
</svelte:head>

<div class="container mx-auto flex h-screen items-center justify-center px-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Reset Password</Card.Title>
			<Card.Description>Enter your new password below.</Card.Description>
		</Card.Header>
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
			<input type="hidden" name="token" value={data.token} />
			<input type="hidden" name="email" value={data.email} />

			<Card.Content class="space-y-4">
				{#if form?.error}
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
						type="email"
						value={data.email}
						disabled
						class="bg-muted"
					/>
				</div>

				<div class="space-y-2">
					<Label for="password">New Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="••••••••"
						required
						minlength="8"
						autocomplete="new-password"
					/>
					{#if form?.errors?.password}
						<p class="text-sm text-destructive">{form.errors.password[0]}</p>
					{/if}
					<p class="text-xs text-muted-foreground">Must be at least 8 characters</p>
				</div>

				<div class="space-y-2">
					<Label for="password_confirmation">Confirm Password</Label>
					<Input
						id="password_confirmation"
						name="password_confirmation"
						type="password"
						placeholder="••••••••"
						required
						minlength="8"
						autocomplete="new-password"
					/>
					{#if form?.errors?.password_confirmation}
						<p class="text-sm text-destructive">{form.errors.password_confirmation[0]}</p>
					{/if}
				</div>
			</Card.Content>
			<Card.Footer class="flex flex-col gap-4">
				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{isSubmitting ? 'Resetting...' : 'Reset Password'}
				</Button>
				<a href="/auth/login" class="text-center text-sm text-primary hover:underline">
					Back to Login
				</a>
			</Card.Footer>
		</form>
	</Card.Root>
</div>

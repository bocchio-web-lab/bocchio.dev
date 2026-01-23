<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Register</title>
</svelte:head>

<Card.Root class="mx-auto max-w-sm">
	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
	>
		<Card.Header>
			<Card.Title class="text-xl">Sign Up</Card.Title>
			<Card.Description>Enter your information to create an account</Card.Description>
		</Card.Header>

		<Card.Content>
			{#if form?.error}
				<div class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}

			<div class="grid gap-4">
				<div class="grid gap-2">
					<Label for="name">Full Name</Label>
					<Input
						id="name"
						name="name"
						value={form?.name ?? ''}
						placeholder="John Doe"
						required
						disabled={loading}
						class={form?.errors?.name ? 'border-destructive' : ''}
					/>
					{#if form?.errors?.name}
						<p class="text-sm text-destructive">{form.errors.name[0]}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						name="email"
						value={form?.email ?? ''}
						placeholder="you@example.com"
						required
						disabled={loading}
						class={form?.errors?.email ? 'border-destructive' : ''}
					/>
					{#if form?.errors?.email}
						<p class="text-sm text-destructive">{form.errors.email[0]}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						name="password"
						required
						disabled={loading}
						class={form?.errors?.password ? 'border-destructive' : ''}
					/>
					{#if form?.errors?.password}
						<p class="text-sm text-destructive">{form.errors.password[0]}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="password_confirmation">Confirm Password</Label>
					<Input
						id="password_confirmation"
						type="password"
						name="password_confirmation"
						required
						disabled={loading}
					/>
				</div>

				<Button
					type="submit"
					class="w-full"
					disabled={loading}
				>
					{loading ? 'Creating account...' : 'Create an account'}
				</Button>
			</div>

			<div class="mt-4 text-center text-sm">
				Already have an account?
				<a
					href="/auth/login"
					class="underline"
				>
					Sign in
				</a>
			</div>
		</Card.Content>
	</form>
</Card.Root>

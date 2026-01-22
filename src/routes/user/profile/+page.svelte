<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from '../dashboard/$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Profile</title>
</svelte:head>

<div class="container mx-auto py-8">
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Welcome to your Profile</Card.Title>
			<Card.Description>You are successfully logged in!</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				<div>
					<p class="text-sm font-medium">Name:</p>
					<p class="text-lg">{data.user?.name}</p>
				</div>
				<div>
					<p class="text-sm font-medium">Email:</p>
					<p class="text-lg">{data.user?.email}</p>
				</div>
				{#if data.user?.email_verified_at}
					<div>
						<p class="text-sm font-medium">Email verified:</p>
						<p class="text-sm text-green-600">
							{new Date(data.user.email_verified_at).toLocaleDateString()}
						</p>
					</div>
				{/if}
			</div>
		</Card.Content>
		<Card.Footer>
			<form
				method="POST"
				action="/auth/logout"
			>
				<Button
					type="submit"
					variant="destructive">Logout</Button
				>
			</form>
		</Card.Footer>
	</Card.Root>
</div>

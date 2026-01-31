<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Profile - {data.user?.name}</title>
</svelte:head>

<div class="container mx-auto space-y-8 py-8">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Profile</h1>
		<p class="text-muted-foreground">Manage your account information</p>
	</div>

	<!-- User Information -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Account Information</Card.Title>
			<Card.Description>Your personal details and account status</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-6">
				<div class="grid gap-4">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Name</p>
						<p class="text-lg font-medium">{data.user?.name}</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Email</p>
						<p class="text-lg">{data.user?.email}</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Email Verification Status</p>
						{#if data.user?.email_verified_at}
							<div class="flex items-center gap-2">
								<Badge variant="default">Verified</Badge>
								<span class="text-sm text-muted-foreground">
									on {new Date(data.user.email_verified_at).toLocaleDateString()}
								</span>
							</div>
						{:else}
							<Badge variant="destructive">Not Verified</Badge>
						{/if}
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Member Since</p>
						<p class="text-sm">
							{data.user?.created_at
								? new Date(data.user.created_at).toLocaleDateString()
								: 'Unknown'}
						</p>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Account Actions -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Account Actions</Card.Title>
			<Card.Description>Manage your account security and preferences</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex flex-col gap-2">
				<Button variant="outline" disabled>
					Change Password
					<span class="ml-2 text-xs text-muted-foreground">(Coming soon)</span>
				</Button>
				<Button variant="outline" disabled>
					Update Profile
					<span class="ml-2 text-xs text-muted-foreground">(Coming soon)</span>
				</Button>
			</div>
		</Card.Content>
		<Card.Footer class="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
			<form method="POST" action="/auth/logout">
				<Button type="submit" variant="destructive">Logout</Button>
			</form>
			<Button variant="outline" class="text-destructive" disabled>
				Delete Account
				<span class="ml-2 text-xs text-muted-foreground">(Coming soon)</span>
			</Button>
		</Card.Footer>
	</Card.Root>
</div>

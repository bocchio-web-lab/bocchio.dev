<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const navItems = [
		{ href: '', label: 'Dashboard', exact: true },
		{ href: '/content', label: 'Content' },
		{ href: '/tags', label: 'Tags' },
		{ href: '/comments', label: 'Comments' }
	];

	function isActive(item: { href: string; exact?: boolean }) {
		const basePath = `/portals/cms/${data.tenant.public_slug}`;
		const currentPath = $page.url.pathname;

		if (item.exact) {
			return currentPath === basePath || currentPath === basePath + '/';
		}
		return currentPath.startsWith(basePath + item.href);
	}

	function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (role) {
			case 'owner':
				return 'default';
			case 'admin':
				return 'default';
			case 'editor':
				return 'secondary';
			default:
				return 'outline';
		}
	}
</script>

<svelte:head>
	<title>{data.tenant.name} - CMS Portal</title>
</svelte:head>

<div class="border-b">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center gap-4">
				<div>
					<h1 class="text-xl font-semibold">{data.tenant.name}</h1>
					<p class="text-xs text-muted-foreground">CMS Portal</p>
				</div>
				<Badge variant={getRoleBadgeVariant(data.userRole)}>
					{data.userRole}
				</Badge>
			</div>
			<Button href="/user/dashboard" variant="outline" size="sm">Back to Dashboard</Button>
		</div>
	</div>
</div>

<div class="border-b">
	<div class="container mx-auto px-4">
		<nav class="flex gap-1">
			{#each navItems as item}
				<Button
					href={`/portals/cms/${data.tenant.public_slug}${item.href}`}
					variant={isActive(item) ? 'default' : 'ghost'}
					size="sm"
					class="rounded-none border-b-2 {isActive(item)
						? 'border-primary'
						: 'border-transparent'}"
				>
					{item.label}
				</Button>
			{/each}
		</nav>
	</div>
</div>

<div class="container mx-auto px-4 py-8">
	<slot />
</div>

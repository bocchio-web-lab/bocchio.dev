<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	function getStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'published':
				return 'default';
			case 'draft':
				return 'secondary';
			case 'archived':
				return 'outline';
			default:
				return 'outline';
		}
	}
</script>

<svelte:head>
	<!-- <title>{data.tenant.name} - Dashboard</title> -->
</svelte:head>

<div class="space-y-8">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">CMS Dashboard</h2>
		<p class="text-muted-foreground">Overview of your content management system</p>
	</div>

	<!-- Statistics Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Published Posts</Card.Description>
				<Card.Title class="text-3xl">{data.stats.postsCount}</Card.Title>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/content?type=post`} size="sm" variant="outline">
					View All
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Published Pages</Card.Description>
				<Card.Title class="text-3xl">{data.stats.pagesCount}</Card.Title>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/content?type=page`} size="sm" variant="outline">
					View All
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Published Projects</Card.Description>
				<Card.Title class="text-3xl">{data.stats.projectsCount}</Card.Title>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/content?type=project`} size="sm" variant="outline">
					View All
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Pending Comments</Card.Description>
				<Card.Title class="text-3xl">{data.stats.pendingCommentsCount}</Card.Title>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/comments`} size="sm" variant="outline">
					Moderate
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Total Tags</Card.Description>
				<Card.Title class="text-3xl">{data.stats.tagsCount}</Card.Title>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/tags`} size="sm" variant="outline">
					Manage
				</Button>
			</Card.Footer>
		</Card.Root>
	</div>

	<!-- Recent Content -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Recent Content</Card.Title>
			<Card.Description>Latest updates to your content</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.recentContent && data.recentContent.length > 0}
				<div class="space-y-4">
					{#each data.recentContent as item}
						<div class="flex items-center justify-between border-b pb-4 last:border-0">
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="text-xs">{item.type}</Badge>
									<Badge variant={getStatusBadgeVariant(item.status)} class="text-xs">
										{item.status}
									</Badge>
								</div>
								<h3 class="font-medium leading-none">{item.title}</h3>
								<p class="text-sm text-muted-foreground">
									by {item.author?.name || 'Unknown'} •
									{new Date(item.updated_at).toLocaleDateString()}
								</p>
							</div>
							<Button
								href={`/portals/cms/${data.tenant.public_slug}/content/${item.id}`}
								size="sm"
								variant="ghost"
							>
								Edit
							</Button>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-center py-8">
					No content yet. Create your first post, page, or project!
				</p>
			{/if}
		</Card.Content>
		<Card.Footer>
			<Button href={`/portals/cms/${data.tenant.public_slug}/content/new`}>
				Create New Content
			</Button>
		</Card.Footer>
	</Card.Root>

	<!-- Quick Actions -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title>Create Content</Card.Title>
				<Card.Description>Start writing a new piece</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/content/new`} class="w-full">
					New Content
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Manage Tags</Card.Title>
				<Card.Description>Organize your content</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/tags`} class="w-full" variant="outline">
					Manage Tags
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Moderate Comments</Card.Title>
				<Card.Description>Review pending comments</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href={`/portals/cms/${data.tenant.public_slug}/comments`} class="w-full" variant="outline">
					View Comments
				</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</div>

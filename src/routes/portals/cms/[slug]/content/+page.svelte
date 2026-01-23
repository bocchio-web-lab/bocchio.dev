<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { PageData } from './$types';

	export let data: PageData;

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

	function updateFilter(param: string, value: string) {
		const url = new URL($page.url);
		if (value) {
			url.searchParams.set(param, value);
		} else {
			url.searchParams.delete(param);
		}
		url.searchParams.delete('page'); // Reset to first page on filter change
		goto(url.toString());
	}

	function changePage(newPage: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url.toString());
	}
</script>

<svelte:head>
	<title>Content - {data.tenant.name}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Content Management</h2>
			<p class="text-muted-foreground">Manage all your posts, pages, and projects</p>
		</div>
		<Button href={`/portals/cms/${data.tenant.public_slug}/content/new`}>
			Create New Content
		</Button>
	</div>

	<!-- Filters -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Filters</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex gap-4">
				<div class="w-48">
					<Select.Root
						onSelectedChange={(v) => updateFilter('type', v?.value || '')}
						selected={{ value: data.filters.type, label: data.filters.type || 'All Types' }}
					>
						<Select.Trigger>
							<Select.Value placeholder="Content Type" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Types</Select.Item>
							<Select.Item value="post">Posts</Select.Item>
							<Select.Item value="page">Pages</Select.Item>
							<Select.Item value="project">Projects</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="w-48">
					<Select.Root
						onSelectedChange={(v) => updateFilter('status', v?.value || '')}
						selected={{
							value: data.filters.status,
							label: data.filters.status || 'All Status'
						}}
					>
						<Select.Trigger>
							<Select.Value placeholder="Status" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Status</Select.Item>
							<Select.Item value="draft">Draft</Select.Item>
							<Select.Item value="published">Published</Select.Item>
							<Select.Item value="archived">Archived</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				{#if data.filters.type || data.filters.status}
					<Button
						variant="outline"
						on:click={() => goto(`/portals/cms/${data.tenant.public_slug}/content`)}
					>
						Clear Filters
					</Button>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Content List -->
	<Card.Root>
		<Card.Header>
			<Card.Title>
				Content Items
				<span class="text-muted-foreground text-sm font-normal">
					({data.pagination.total} total)
				</span>
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if data.content && data.content.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Title</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Author</Table.Head>
							<Table.Head>Updated</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.content as item}
							<Table.Row>
								<Table.Cell class="font-medium">
									<div>
										<div>{item.title}</div>
										{#if item.excerpt}
											<div class="text-xs text-muted-foreground line-clamp-1">
												{item.excerpt}
											</div>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">{item.type}</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
								</Table.Cell>
								<Table.Cell>{item.author?.name || 'Unknown'}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">
									{new Date(item.updated_at).toLocaleDateString()}
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button
										href={`/portals/cms/${data.tenant.public_slug}/content/${item.id}`}
										size="sm"
										variant="outline"
									>
										Edit
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>

				<!-- Pagination -->
				{#if data.pagination.lastPage > 1}
					<div class="flex items-center justify-between pt-4">
						<div class="text-sm text-muted-foreground">
							Page {data.pagination.currentPage} of {data.pagination.lastPage}
						</div>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={data.pagination.currentPage === 1}
								on:click={() => changePage(data.pagination.currentPage - 1)}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={data.pagination.currentPage >= data.pagination.lastPage}
								on:click={() => changePage(data.pagination.currentPage + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			{:else}
				<div class="text-center py-12">
					<p class="text-muted-foreground mb-4">No content found</p>
					<Button href={`/portals/cms/${data.tenant.public_slug}/content/new`}>
						Create Your First Content
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

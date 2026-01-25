<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const status_options = [
		{ value: '', label: 'All Status' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'published', label: 'Published' },
		{ value: 'archived', label: 'Archived' }
	];

	// To be retrived from server (unique for each tenant)
	const type_options = [
		{ value: '', label: 'All Types' },
		{ value: 'post', label: 'Posts' },
		{ value: 'page', label: 'Pages' },
		{ value: 'project', label: 'Projects' }
	];

	let status = $state('');
	let type = $state('');

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
		<Button href={`/portals/cms/${data.tenant.public_slug}/content/new`}>Create New Content</Button>
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
						type="single"
						name="type"
						bind:value={type}
						onValueChange={(val) => updateFilter('type', val)}
					>
						<Select.Trigger class="w-45">
							{type_options.find((f) => f.value === type)?.label ?? 'Select a type'}
						</Select.Trigger>
						<Select.Content>
							{#each type_options as option (option.value)}
								<Select.Item
									value={option.value}
									label={option.label}
								>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="w-48">
					<Select.Root
						type="single"
						name="status"
						bind:value={status}
						onValueChange={(val) => updateFilter('status', val)}
					>
						<Select.Trigger class="w-45">
							{status_options.find((f) => f.value === status)?.label ?? 'Select a status'}
						</Select.Trigger>
						<Select.Content>
							{#each status_options as option (option.value)}
								<Select.Item
									value={option.value}
									label={option.label}
								>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				{#if data.filters.type || data.filters.status}
					<Button
						variant="outline"
						onclick={() => {
							goto(`/portals/cms/${data.tenant.public_slug}/content`);
							status = '';
							type = '';
						}}
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
				<span class="text-sm font-normal text-muted-foreground">
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
											<div class="line-clamp-1 text-xs text-muted-foreground">
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
								onclick={() => changePage(data.pagination.currentPage - 1)}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={data.pagination.currentPage >= data.pagination.lastPage}
								onclick={() => changePage(data.pagination.currentPage + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			{:else}
				<div class="py-12 text-center">
					<p class="mb-4 text-muted-foreground">No content found</p>
					<Button href={`/portals/cms/${data.tenant.public_slug}/content/new`}>
						Create Your First Content
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<script lang="ts">
	import AtomicCard from '$lib/components/atomic/card.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { goto } from '$app/navigation';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const posts = $derived(data.pagination?.data || []);
	let expandedSlug: string | null = $state(null);

	function toggleExpand(slug: string) {
		expandedSlug = expandedSlug === slug ? null : slug;
	}
</script>

<svelte:head>
	<title>Blog</title>
	<meta
		name="description"
		content="Some of my thoughts on robotics, control systems, and mechatronics."
	/>
</svelte:head>

<div class="grid gap-6">
	{#each posts as post}
		<AtomicCard
			data={{
				title: post.title,
				content: post.body,
				date: post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				}) : undefined
			}}
			class="cursor-pointer"
			preview={expandedSlug !== post.slug}
			clickable={true}
			onclick={() => toggleExpand(post.slug)}
		/>
	{/each}
</div>

{#if data.pagination && data.pagination.total > data.pagination.per_page}
<div class="mt-12 flex justify-center">
	<Pagination.Root
		count={data.pagination?.total || 0}
		perPage={data.pagination?.per_page || 10}
	>
		{#snippet children({ pages, currentPage })}
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.Previous onclick={() => goto(`?page=${currentPage - 1}`)} />
				</Pagination.Item>

				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link
								{page}
								isActive={currentPage === page.value}
								onclick={() => goto(`?page=${page.value}`)}
							>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}

				<Pagination.Item>
					<Pagination.Next onclick={() => goto(`?page=${currentPage + 1}`)} />
				</Pagination.Item>
			</Pagination.Content>
		{/snippet}
	</Pagination.Root>
</div>
{/if}
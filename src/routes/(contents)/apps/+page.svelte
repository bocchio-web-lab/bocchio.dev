<script lang="ts">
	import AtomicCard from '$lib/components/atomic/card.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { goto } from '$app/navigation';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const apps = $derived(data.pagination?.data || []);

	function handleAppClick(app: typeof apps[0]) {
		if (app.meta?.externalLinks?.[0]?.url) {
			window.open(app.meta.externalLinks[0].url, '_blank', 'noopener,noreferrer');
		}
	}
</script>

<svelte:head>
	<title>Apps</title>
	<meta
		name="description"
		content="A collection of web applications developed by Tommaso Bocchietti."
	/>
</svelte:head>

<div class="grid justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each apps as app}
		<AtomicCard
			data={{
				title: app.title,
				content: app.excerpt || '',
				image: (app.meta?.headerImages?.[0] as string) || undefined
			}}
			class="cursor-pointer"
			clickable={true}
			on:click={() => handleAppClick(app)}
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

<script lang="ts">
	import {
		Timeline,
		TimelineItem,
		TimelineSeparator,
		TimelineDot,
		TimelineConnector,
		TimelineContent,
		TimelineOppositeContent
	} from 'svelte-vertical-timeline';
	import { goto } from '$app/navigation';
	import AtomicCard from '$lib/components/atomic/card.svelte';
	import * as Pagination from '$lib/components/ui/pagination';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const projects = $derived(data.pagination?.data || []);
</script>

<svelte:head>
	<title>Projects</title>
	<meta
		name="description"
		content="A showcase of my mechatronics and robotics projects."
	/>
</svelte:head>

<div class="projects-container">
	<Timeline position="right">
		{#each projects as project, i}
			<TimelineItem>
				<TimelineOppositeContent>
					<AtomicCard
						data={{
							title: project.title,
							content: project.excerpt || ''
						}}
						clickable={true}
						on:click={() => goto(`/projects/${project.slug}`)}
						class="desktop-card"
					/>
				</TimelineOppositeContent>

				<TimelineSeparator>
					<TimelineDot>
						<button onclick={() => goto(`/projects/${project.slug}`)}>
							<img
								src={(project.meta?.headerImages[0] as string) ||
									'https://avatars.githubusercontent.com/u/67842431'}
								alt={project.title}
								class="h-full w-full max-w-sm rounded-lg object-cover transition-transform duration-300 hover:scale-105"
							/>
						</button>
						<AtomicCard
							data={{
								title: project.title,
								content: project.excerpt || ''
							}}
							clickable={true}
							on:click={() => goto(`/projects/${project.slug}`)}
							class="mobile-card"
						/>
					</TimelineDot>

					{#if i < projects.length - 1}
						<TimelineConnector style="height: 100px;" />
					{/if}
				</TimelineSeparator>

				<TimelineContent>
					<AtomicCard
						data={{
							title: project.title,
							content: project.excerpt || ''
						}}
						clickable={true}
						on:click={() => goto(`/projects/${project.slug}`)}
						class="desktop-card"
					/>
				</TimelineContent>
			</TimelineItem>
		{/each}
	</Timeline>

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
</div>

<style>
	:global(.opposite-block) {
		display: none !important;
	}

	:global(.timeline-opposite-content, .timeline-content) {
		display: none !important;
	}

	:global(.timeline-dot) {
		display: flex !important;

		flex-direction: column !important;

		align-items: center !important;

		width: 100% !important;

		background-color: transparent !important;

		border: none !important;

		margin: auto !important;
	}

	:global(.timeline-separator) {
		flex: 1 !important;
	}

	:global(.mobile-card) {
		margin-top: 1rem;
	}

	:global(.desktop-card) {
		display: none;
	}

	:global(.timeline-opposite-content .desktop-card > div:first-child) {
		flex-direction: row-reverse;
	}

	@media (min-width: 768px) {
		:global(.mobile-card) {
			display: none;
		}

		:global(.desktop-card) {
			display: block;
		}

		:global(.timeline-content) {
			display: block !important;
		}
	}

	@media (min-width: 1024px) {
		:global(.timeline-opposite-content) {
			display: block !important;
		}

		:global(.timeline-item:nth-child(even) .timeline-opposite-content > div) {
			display: block !important;
		}

		:global(.timeline-item:nth-child(even) .timeline-content > div) {
			display: none !important;
		}

		:global(.timeline-item:nth-child(odd) .timeline-opposite-content > div) {
			display: none !important;
		}

		:global(.timeline-item:nth-child(odd) .timeline-content > div) {
			display: block !important;
		}
	}
</style>

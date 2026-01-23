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

	let { data } = $props();
</script>

<svelte:head>
	<title>Projects</title>
	<meta
		name="description"
		content="A showcase of my mechatronics and robotics projects."
	/>
</svelte:head>

<Timeline position="right">
	{#each data.projects as project, i}
		<TimelineItem>
			<TimelineOppositeContent>
				<AtomicCard
					data={{
						title: project.name,
						content: project.description
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
							src={project.image}
							alt={project.name}
							class="h-full w-full max-w-sm rounded-lg object-cover transition-transform duration-300 hover:scale-105"
						/>
					</button>
					<AtomicCard
						data={{
							title: project.name,
							content: project.description
						}}
						clickable={true}
						on:click={() => goto(`/projects/${project.slug}`)}
						class="mobile-card"
					/>
				</TimelineDot>

				{#if i < data.projects.length - 1}
					<TimelineConnector style="height: 100px;" />
				{/if}
			</TimelineSeparator>

			<TimelineContent>
				<AtomicCard
					data={{
						title: project.name,
						content: project.description
					}}
					clickable={true}
					on:click={() => goto(`/projects/${project.slug}`)}
					class="desktop-card"
				/>
			</TimelineContent>
		</TimelineItem>
	{/each}
</Timeline>

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

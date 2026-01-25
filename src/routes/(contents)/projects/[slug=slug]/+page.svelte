<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// We use a simple alias for brevity in the template
	const project = $derived(data.project);
</script>

<svelte:head>
	<title>{project.title}</title>
	<meta
		name="description"
		content={project.excerpt ?? 'Project details'}
	/>
	<meta
		property="og:title"
		content={project.title}
	/>
	<meta
		property="og:description"
		content={project.excerpt ?? ''}
	/>
	<meta
		property="og:image"
		content={project.display_image}
	/>
</svelte:head>

<article class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
	<header class="mb-8">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
			<h1 class="text-4xl font-bold tracking-tight">{project.title}</h1>
			{#if project.year}
				<span class="text-sm text-muted-foreground">{project.year}</span>
			{/if}
		</div>

		{#if project.excerpt}
			<p class="text-lg text-muted-foreground">{project.excerpt}</p>
		{/if}

		{#if project.repo_url || project.website_url}
			<div class="mt-6 flex flex-wrap gap-3">
				{#if project.website_url}
					<Button
						href={project.website_url}
						target="_blank"
						rel="noopener noreferrer"
					>
						Visit Website
					</Button>
				{/if}
				{#if project.repo_url}
					<Button
						href={project.repo_url}
						variant="outline"
						target="_blank"
						rel="noopener noreferrer"
					>
						View Repository
					</Button>
				{/if}
			</div>
		{/if}
	</header>

	<div class="mb-10 overflow-hidden rounded-lg border border-border">
		<img
			src={project.display_image}
			alt={project.title}
			class="h-auto w-full object-cover"
		/>
	</div>

	<div class="prose max-w-none prose-neutral dark:prose-invert">
		{#if project.body}
			{@html project.body}
		{:else}
			<p class="text-muted-foreground">No detailed information available.</p>
		{/if}
	</div>

	{#if project.tags?.length}
		<div class="mt-8 flex flex-wrap gap-2">
			{#each project.tags as tag}
				<span class="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}
</article>

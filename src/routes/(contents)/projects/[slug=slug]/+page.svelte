<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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
		content={project.meta.headerImages?.[0] ?? ''}
	/>
</svelte:head>

<article class="mx-auto max-w-4xl px-4 py-8">
	<!-- Title and Metadata -->
	<div class="mb-8">
		<h1 class="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
			{project.title}
		</h1>

		{#if project.excerpt}
			<p class="mb-4 text-xl text-muted-foreground">
				{project.excerpt}
			</p>
		{/if}

		<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
			{#if project.author}
				<div class="flex items-center gap-2">
					<span class="font-medium text-foreground">{project.author.name}</span>
				</div>
			{/if}

			{#if project.published_at}
				<time datetime={project.published_at}>
					{new Date(project.published_at).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
			{/if}
		</div>
	</div>

	<!-- Image Carousel -->
	{#if project.meta.headerImages && project.meta.headerImages.length > 0}
		<header class="mb-8">
			<Carousel.Root class="w-full">
				<Carousel.Content>
					{#each project.meta.headerImages as image}
						<Carousel.Item>
							<div class="aspect-video w-full overflow-hidden rounded-lg bg-muted">
								<img
									src={image}
									alt={project.title}
									class="h-auto w-auto object-center"
								/>
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				{#if project.meta.headerImages.length > 1}
					<Carousel.Previous />
					<Carousel.Next />
				{/if}
			</Carousel.Root>
		</header>
	{/if}

	<!-- Content Body -->
	<div class="prose-custom">
        {@html project.body}
	</div>


	<!-- Tags -->
	{#if project.tags && project.tags.length > 0}
		<div class="mt-4 flex flex-wrap gap-2">
			{#each project.tags as tag}
				<span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}

	<!-- Project URLs -->
	{#if project.meta.externalLinks && project.meta.externalLinks.length > 0}
		<div class="mt-6 flex flex-wrap gap-3">
			{#each project.meta.externalLinks as link}
				<Button
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
				>
					{link.title}
				</Button>
			{/each}
		</div>
	{/if}
</article>

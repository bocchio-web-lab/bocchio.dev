<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	interface Props {
		data: {
		project: {
			name: string;
			slug: string;
			image?: string;
			description?: string;
			readme_html?: string;
			year?: number;
			repo_url?: string;
			website_url?: string;
		};
	};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>{data.project.name}</title>
	<meta
		name="description"
		content={data.project.description ?? 'Project details'}
	/>
	<meta
		property="og:title"
		content={data.project.name}
	/>
	<meta
		property="og:description"
		content={data.project.description ?? ''}
	/>
	{#if data.project.image}
		<meta
			property="og:image"
			content={data.project.image}
		/>
	{/if}
</svelte:head>

<article class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
	<!-- Header -->
	<header class="mb-8">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
			<h1 class="text-4xl font-bold tracking-tight">{data.project.name}</h1>
			{#if data.project.year}
				<span class="text-sm text-muted-foreground">{data.project.year}</span>
			{/if}
		</div>

		{#if data.project.description}
			<p class="text-lg text-muted-foreground">{data.project.description}</p>
		{/if}

		{#if data.project.repo_url || data.project.website_url}
			<div class="mt-6 flex flex-wrap gap-3">
				{#if data.project.website_url}
					<Button asChild>
						<a
							href={data.project.website_url}
							target="_blank"
							rel="noopener noreferrer"
						>
							Visit Website
						</a>
					</Button>
				{/if}
				{#if data.project.repo_url}
					<Button
						asChild
						variant="outline"
					>
						<a
							href={data.project.repo_url}
							target="_blank"
							rel="noopener noreferrer"
						>
							View Repository
						</a>
					</Button>
				{/if}
			</div>
		{/if}
	</header>

	<!-- Project Image -->
	{#if data.project.image}
		<div class="mb-10 overflow-hidden rounded-lg border border-border">
			<img
				src={data.project.image}
				alt={data.project.name}
				class="h-auto w-full object-cover"
			/>
		</div>
	{/if}

	<!-- README Content -->
	<div class="prose prose-neutral dark:prose-invert max-w-none">
		{#if data.project.readme_html}
			{@html data.project.readme_html}
		{:else}
			<p class="text-muted-foreground">No detailed information available for this project.</p>
		{/if}
	</div>
</article>

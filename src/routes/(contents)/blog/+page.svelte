<script lang="ts">
	import type { BlogPost } from '$lib/types/blog';
	import AtomicCard from '$lib/components/atomic/card.svelte';

	interface Props {
		data: { posts: BlogPost[] };
	}

	let { data }: Props = $props();
	let expandedSlug: string | null = $state(null);

	async function toggleExpand(slug: BlogPost['slug']) {
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
	{#each data.posts as post}
		<AtomicCard
			data={{
				title: post.title,
				content: post.content,
				date: post.date
			}}
			class="cursor-pointer"
			preview={expandedSlug !== post.slug}
			clickable={true}
			on:click={() => toggleExpand(post.slug)}
		/>
	{/each}
</div>

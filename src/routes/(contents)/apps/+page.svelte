<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from '$lib/components/ui/card';
	import AtomicCard from '$lib/components/atomic/card.svelte';

	type AppEntry = {
		id: string;
		title: string;
		description: string;
		image: string;
		url: string;
	};

	let apps: AppEntry[] = $state([]);

	onMount(async () => {
		const res = await fetch('/api/apps');
		apps = await res.json();
	});
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
				content: app.description,
				image: app.image
			}}
			class="cursor-pointer"
			clickable={true}
			on:click={() => console.log('App clicked:', app.id)}
		/>
	{/each}
</div>

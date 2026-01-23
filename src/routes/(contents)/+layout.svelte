<script lang="ts">
	import { page } from '$app/stores';
	import Header from '$lib/components/header/header.svelte';
	import Slogan from '$lib/components/atomic/slogan.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let isHome = $derived($page.url.pathname === '/');
</script>

<Header />

{#if !isHome}
	<Slogan />
{/if}

<main class="m-auto mb-16 mt-8 w-full max-w-(--breakpoint-xl) px-4 sm:px-6 lg:px-8">
	{@render children?.()}
</main>

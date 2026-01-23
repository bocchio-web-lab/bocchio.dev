<script lang="ts">
	import { onMount } from 'svelte';
	import Footer from '$lib/components/footer/footer.svelte';
	import '../app.css';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		const saved = localStorage.getItem('theme');
		if (saved) {
			document.documentElement.dataset.theme = saved;
		} else {
			const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.dataset.theme = systemDark ? 'dark' : 'light';
		}
	});
</script>

{@render children?.()}

<Footer />

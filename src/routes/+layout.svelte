<script lang="ts">
	import { onMount } from 'svelte';
	import Footer from '$lib/components/footer/footer.svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<ModeWatcher />

{@render children?.()}

<Footer />

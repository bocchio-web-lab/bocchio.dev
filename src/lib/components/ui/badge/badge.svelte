<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { badgeVariants, type Props } from "./index.js";
	import { cn } from "$lib/utils.js";

	type $$Props = Props & HTMLAttributes<HTMLSpanElement>;

	
	interface Props_1 {
		class?: $$Props["class"];
		variant?: $$Props["variant"];
		children?: import('svelte').Snippet;
	}

	let { class: className = undefined, variant = "default", children }: Props_1 = $props();
</script>

<span class={cn(badgeVariants({ variant, className }))}>
	{@render children?.()}
</span>

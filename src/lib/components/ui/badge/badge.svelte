<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { badgeVariants, type Props } from "./index.js";
	import { cn } from "$lib/utils.js";

	type $$Props = Props & HTMLAttributes<HTMLSpanElement>;

	let className: $$Props["class"] = undefined;
	export { className as class };
	export let variant: $$Props["variant"] = "default";
</script>

<span class={cn(badgeVariants({ variant, className }))}>
	<slot />
</span>

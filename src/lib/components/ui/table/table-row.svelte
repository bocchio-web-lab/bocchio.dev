<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	type $$Props = HTMLAttributes<HTMLTableRowElement>;

	interface Props {
		class?: $$Props["class"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { class: className = undefined, children, ...rest }: Props = $props();
	
</script>

<tr
	class={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
	{...rest}
>
	{@render children?.()}
</tr>

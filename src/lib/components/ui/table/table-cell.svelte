<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	type $$Props = HTMLAttributes<HTMLTableCellElement>;

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<td class={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...$$restProps}>
	<slot />
</td>

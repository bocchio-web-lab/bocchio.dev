<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, flyAndScale } from "$lib/utils.js";

	type $$Props = SelectPrimitive.ContentProps;

	interface Props {
		class?: $$Props["class"];
		sideOffset?: $$Props["sideOffset"];
		transition?: $$Props["transition"];
		transitionConfig?: $$Props["transitionConfig"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let {
		class: className = undefined,
		sideOffset = 4,
		transition = flyAndScale,
		transitionConfig = undefined,
		children,
		...rest
	}: Props = $props();
	
</script>

<SelectPrimitive.Content
	{transition}
	{transitionConfig}
	{sideOffset}
	class={cn(
		"relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
		className
	)}
	{...rest}
>
	<div class="w-full p-1">
		{@render children?.()}
	</div>
</SelectPrimitive.Content>

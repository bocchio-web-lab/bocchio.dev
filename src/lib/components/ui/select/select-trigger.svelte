<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	type $$Props = SelectPrimitive.TriggerProps;
	type $$Events = SelectPrimitive.TriggerEvents;

	interface Props {
		class?: $$Props["class"];
		builder?: $$Props["builder"];
		children?: import('svelte').Snippet<[any]>;
		[key: string]: any
	}

	let { class: className = undefined, builder = undefined, children, ...rest }: Props = $props();
	

	const children_render = $derived(children);
</script>

<SelectPrimitive.Trigger
	class={cn(
		"flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	{builder}
	{...rest}
	on:click
	on:keydown
	
>
	{#snippet children({ builder })}
		{@render children_render?.({ builder, })}
		<div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-4 w-4 opacity-50"
			>
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</div>
	{/snippet}
</SelectPrimitive.Trigger>

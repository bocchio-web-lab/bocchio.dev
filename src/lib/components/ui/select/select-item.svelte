<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	type $$Props = SelectPrimitive.ItemProps;
	type $$Events = SelectPrimitive.ItemEvents;

	interface Props {
		class?: $$Props["class"];
		value: $$Props["value"];
		label?: $$Props["label"];
		disabled?: $$Props["disabled"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let {
		class: className = undefined,
		value,
		label = undefined,
		disabled = undefined,
		children,
		...rest
	}: Props = $props();
	
</script>

<SelectPrimitive.Item
	{value}
	{disabled}
	{label}
	class={cn(
		"relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50",
		className
	)}
	{...rest}
	on:click
	on:pointermove
	on:focusin
>
	<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
		<SelectPrimitive.ItemIndicator>
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
				class="h-4 w-4"
			>
				<polyline points="20 6 9 17 4 12" />
			</svg>
		</SelectPrimitive.ItemIndicator>
	</span>
	{#if children}{@render children()}{:else}
		{label || value}
	{/if}
</SelectPrimitive.Item>

<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	type $$Props = CheckboxPrimitive.Props;
	type $$Events = CheckboxPrimitive.Events;

	interface Props {
		class?: $$Props["class"];
		checked?: $$Props["checked"];
		onCheckedChange?: $$Props["onCheckedChange"];
		disabled?: $$Props["disabled"];
		name?: $$Props["name"];
		value?: $$Props["value"];
		[key: string]: any
	}

	let {
		class: className = undefined,
		checked = $bindable(false),
		onCheckedChange = undefined,
		disabled = undefined,
		name = undefined,
		value = undefined,
		...rest
	}: Props = $props();
	
</script>

<CheckboxPrimitive.Root
	class={cn(
		"peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
		className
	)}
	bind:checked
	{onCheckedChange}
	{disabled}
	{name}
	{value}
	{...rest}
	on:click
>
	<CheckboxPrimitive.Indicator
		class={cn("flex h-full w-full items-center justify-center text-current")}
		
	>
		{#snippet children({ isChecked })}
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
				class="h-3.5 w-3.5"
			>
				<polyline points="20 6 9 17 4 12" />
			</svg>
					{/snippet}
		</CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>

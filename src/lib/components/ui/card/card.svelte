<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable<HTMLDivElement | null>(null),
		class: className,
		children,
		clickable = false,
		onclick,
		onkeydown,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		clickable?: boolean;
		onclick?: (e: MouseEvent) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (!clickable) return;

		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick?.(e as unknown as MouseEvent);
		}

		onkeydown?.(e);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={ref}
	data-slot="card"
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
	class={cn(
		'flex flex-col rounded-lg border bg-card text-card-foreground shadow-lg',
		clickable &&
			'cursor-pointer transition-all hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]',
		className
	)}
	{onclick}
	onkeydown={handleKeydown}
	{...restProps}
>
	{@render children?.()}
</div>

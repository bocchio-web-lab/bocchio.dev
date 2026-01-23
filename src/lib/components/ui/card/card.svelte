<!-- @migration-task Error while migrating Svelte code: Cannot set properties of undefined (setting 'next') -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type $$Props = HTMLAttributes<HTMLDivElement>;
	export let className: $$Props['class'] = undefined;
	export let clickable = false; // opt-in
	export { className as class };
</script>

<div
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
	class={cn(
		'rounded-lg border bg-card text-card-foreground shadow-lg',
		clickable &&
			'cursor-pointer transition-all hover:translate-y-[-2px] hover:scale-[1.01] active:scale-[0.99]',
		className
	)}
	{...$$restProps}
	on:click
	on:keydown={clickable
		? (e) => (e.key === 'Enter' || e.key === ' ') && e.currentTarget?.click()
		: null}
>
	<slot />
</div>

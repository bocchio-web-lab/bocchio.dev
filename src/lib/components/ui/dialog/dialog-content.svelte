<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import * as Dialog from "./index.js";
	import { cn, flyAndScale } from "$lib/utils.js";

	type $$Props = DialogPrimitive.ContentProps;

	interface Props {
		class?: $$Props["class"];
		transition?: $$Props["transition"];
		transitionConfig?: $$Props["transitionConfig"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let {
		class: className = undefined,
		transition = flyAndScale,
		transitionConfig = {
		duration: 200
	},
		children,
		...rest
	}: Props = $props();
	
</script>

<Dialog.Portal>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		{transition}
		{transitionConfig}
		class={cn(
			"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg md:w-full",
			className
		)}
		{...rest}
	>
		{@render children?.()}
		<DialogPrimitive.Close
			class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
		>
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
				<line x1="18" x2="6" y1="6" y2="18" />
				<line x1="6" x2="18" y1="6" y2="18" />
			</svg>
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>

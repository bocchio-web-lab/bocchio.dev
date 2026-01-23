<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn, flyAndScale } from "$lib/utils.js";

	type $$Props = DialogPrimitive.OverlayProps;

	interface Props {
		class?: $$Props["class"];
		transition?: $$Props["transition"];
		transitionConfig?: $$Props["transitionConfig"];
		[key: string]: any
	}

	let { class: className = undefined, transition = flyAndScale, transitionConfig = undefined, ...rest }: Props = $props();
	
</script>

<DialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	class={cn(
		"fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
		className
	)}
	{...rest}
/>

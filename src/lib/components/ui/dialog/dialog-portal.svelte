<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";

	type $$Props = DialogPrimitive.PortalProps;

	interface Props {
		el?: $$Props["el"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { el = undefined, children, ...rest }: Props = $props();
</script>

<DialogPrimitive.Portal {el} {...rest}>
	{@render children?.()}
</DialogPrimitive.Portal>

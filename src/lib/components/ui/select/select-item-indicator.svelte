<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";

	type $$Props = SelectPrimitive.ItemIndicatorProps;

	interface Props {
		asChild?: $$Props["asChild"];
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let { asChild = undefined, children, ...rest }: Props = $props();
</script>

<SelectPrimitive.ItemIndicator {asChild} {...rest}>
	{@render children?.()}
</SelectPrimitive.ItemIndicator>

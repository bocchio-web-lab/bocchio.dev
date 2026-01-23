<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";

	type $$Props = SelectPrimitive.ItemIndicatorProps;

	export let asChild: $$Props["asChild"] = undefined;
</script>

<SelectPrimitive.ItemIndicator {asChild} {...$$restProps}>
	<slot />
</SelectPrimitive.ItemIndicator>

<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";

	type $$Props = DialogPrimitive.PortalProps;

	export let el: $$Props["el"] = undefined;
</script>

<DialogPrimitive.Portal {el} {...$$restProps}>
	<slot />
</DialogPrimitive.Portal>

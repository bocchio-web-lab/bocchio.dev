<script lang="ts">
    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();
</script>

<section class="container mx-auto min-h-full px-4 py-8 space-y-8">
    {@render children?.()}
</section>

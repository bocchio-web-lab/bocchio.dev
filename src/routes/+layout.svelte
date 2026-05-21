<script lang="ts">
    import "../app.css";
    import Footer from "$components/footer/footer.svelte";
    import { ModeWatcher } from "mode-watcher";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();
</script>

<ModeWatcher />

{@render children?.()}

<Footer />

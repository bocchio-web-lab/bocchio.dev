<script lang="ts">
    import "../app.css";
    import { dev } from "$app/environment";
    import { ModeWatcher } from "mode-watcher";
    import Footer from "$components/footer/footer.svelte";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();
</script>

<svelte:head>
    {#if !dev}
        <link
            rel="preconnect"
            href="https://analytics.bocchio.dev"
            crossorigin="anonymous"
        />
        <script
            defer
            src="https://analytics.bocchio.dev/script.js"
            data-website-id="af1fb622-9be9-42f3-b5d6-c25715d7775f"
        ></script>
    {/if}
</svelte:head>

<ModeWatcher />

{@render children?.()}

<Footer />

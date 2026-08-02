<script lang="ts">
    import "../app.css";
    import { dev } from "$app/environment";
    import { page } from "$app/state";
    import { ModeWatcher } from "mode-watcher";
    import Footer from "$components/footer/footer.svelte";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();
    const isProduction = $derived(
        !dev &&
            (page.url.hostname === "bocchio.dev" ||
                page.url.hostname === "www.bocchio.dev"),
    );
</script>

<svelte:head>
    {#if isProduction}
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
        <script
            defer
            src="https://analytics.bocchio.dev/recorder.js"
            data-website-id="af1fb622-9be9-42f3-b5d6-c25715d7775f"
        ></script>
    {/if}
</svelte:head>

<ModeWatcher />

{@render children?.()}

<Footer />

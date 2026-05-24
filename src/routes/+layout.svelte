<script lang="ts">
    import "../app.css";
    import { page } from "$app/state";
    import Footer from "$components/footer/footer.svelte";
    import { ModeWatcher } from "mode-watcher";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    let analyticsEnabled = $derived(
        page.url.hostname === "bocchio.dev" ||
            page.url.hostname === "www.bocchio.dev",
    );
</script>

<svelte:head>
    {#if analyticsEnabled}
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

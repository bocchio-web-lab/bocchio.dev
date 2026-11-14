<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** What the CMS has about the app: its title and subtitle, and the text that goes under it (already turned into HTML). */
        app: { title: string; subtitle: string; body: string };
        /** The app itself. */
        children: Snippet;
    }

    let { app, children }: Props = $props();
</script>

<header class="mb-8 space-y-2 text-center">
    <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{app.title}</h1>
    <p class="mx-auto max-w-2xl text-muted-foreground">{app.subtitle}</p>
</header>

{@render children()}

{#if app.body}
    <section class="prose-custom mx-auto mt-16 max-w-3xl">
        {@html app.body}
    </section>
{/if}

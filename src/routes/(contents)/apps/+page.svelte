<script lang="ts">
    import AtomicCard from "$components/cards/card.svelte";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { goto } from "$app/navigation";

    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const apps = $derived(data.pagination?.data || []);

    function handleAppClick(app: (typeof apps)[0]) {
        if (app.meta?.externalLinks?.[0]?.url) {
            window.open(
                app.meta.externalLinks[0].url,
                "_blank",
                "noopener,noreferrer",
            );
        }
    }
</script>

<svelte:head>
    <title>Apps</title>
    <meta
        name="description"
        content="A collection of web applications developed by Tommaso Bocchietti."
    />
</svelte:head>

<div
    class="grid justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
>
    {#each apps as app}
        <AtomicCard
            data={{
                title: app.title,
                content: app.excerpt || "",
                image: (app.meta?.headerImages?.[0] as string) || undefined,
            }}
            class="cursor-pointer"
            clickable={true}
            on:click={() => handleAppClick(app)}
        />
    {/each}
</div>

<PaginationControls
    count={data.pagination?.total || 0}
    perPage={data.pagination?.per_page || 10}
    onPageChange={(page) => goto(`?page=${page}`)}
/>

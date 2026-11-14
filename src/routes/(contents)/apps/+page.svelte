<script lang="ts">
    import AtomicCard from "$components/cards/card.svelte";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { goto } from "$app/navigation";

    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const apps = $derived(data.pagination?.data || []);
</script>

<div class="grid justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
    {#each apps as app (app.id)}
        <AtomicCard
            data={{
                title: app.title,
                content: app.excerpt || "",
                image: (app.meta?.headerImages?.[0] as string) || undefined,
            }}
            class="cursor-pointer"
            clickable={true}
            onclick={() => goto(`/apps/${app.slug}`)}
        />
    {/each}
</div>

<PaginationControls
    count={data.pagination?.total || 0}
    perPage={data.pagination?.per_page || 10}
    onPageChange={(page) => goto(`?page=${page}`)}
/>

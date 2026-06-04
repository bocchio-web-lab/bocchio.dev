<script lang="ts">
    import AtomicCard from "$components/cards/card.svelte";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { goto, pushState } from "$app/navigation";
    import { onMount, tick } from "svelte";

    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const posts = $derived(data.pagination?.data || []);
    let expandedSlug: string | null = $state(null);

    function scrollToHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }
    }

    async function toggleExpand(slug: string) {
        if (expandedSlug === slug) {
            // collapse logic here if needed
        } else {
            expandedSlug = slug;
            pushState(`/blog#${slug}`, {});
            await tick(); // wait for DOM to update with expanded card
            scrollToHash();
        }
    }

    onMount(() => {
        expandedSlug = window.location.hash
            ? window.location.hash.substring(1)
            : null;
        tick().then(() => scrollToHash());
    });
</script>

<svelte:head>
    <title>Blog</title>
    <meta
        name="description"
        content="Some of my thoughts on robotics, control systems, and mechatronics."
    />
</svelte:head>

<div class="grid gap-6">
    {#each posts as post}
        {@const isExpanded = expandedSlug === post.slug}
        <AtomicCard
            id={post.slug}
            data={{
                title: post.title,
                content: post.body,
                date: post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                      })
                    : undefined,
                tag: post.tags?.[0] ? { name: post.tags[0].name } : undefined,
            }}
            class={`scroll-mt-17 sm:scroll-mt-22 ${!isExpanded ? "cursor-pointer" : ""}`}
            preview={!isExpanded}
            clickable={!isExpanded}
            onclick={() => toggleExpand(post.slug)}
        />
    {/each}
</div>

<PaginationControls
    count={data.pagination?.total || 0}
    perPage={data.pagination?.per_page || 10}
    onPageChange={(page) => goto(`?page=${page}`)}
/>

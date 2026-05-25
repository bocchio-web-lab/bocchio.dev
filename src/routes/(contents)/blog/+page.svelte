<script lang="ts">
    import AtomicCard from "$components/cards/card.svelte";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { goto, pushState } from "$app/navigation";
    import { onMount } from "svelte";

    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const posts = $derived(data.pagination?.data || []);
    let expandedSlug: string | null = $state(null);

    // Check URL hash on mount and expand corresponding post
    onMount(() => {
        const hash = window.location.hash.substring(1); // Remove the '#'
        if (hash) {
            expandedSlug = hash;
            // Scroll to the post after a brief delay to ensure it's rendered
            setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }, 100);
        }
    });

    function toggleExpand(slug: string) {
        if (expandedSlug === slug) {
            expandedSlug = null;
            pushState("/blog", {});
        } else {
            expandedSlug = slug;
            pushState(`/blog#${slug}`, {});
        }
    }
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
        <AtomicCard
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
            class="cursor-pointer"
            preview={expandedSlug !== post.slug}
            clickable={true}
            onclick={() => toggleExpand(post.slug)}
        />
    {/each}
</div>

<PaginationControls
    count={data.pagination?.total || 0}
    perPage={data.pagination?.per_page || 10}
    onPageChange={(page) => goto(`?page=${page}`)}
/>

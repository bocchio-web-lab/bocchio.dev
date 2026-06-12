<script lang="ts">
    import { goto } from "$app/navigation";
    import AtomicCard from "$components/cards/card.svelte";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { onMount, tick } from "svelte";

    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const posts = $derived(data.pagination?.data || []);
    const activeSlug = $derived(data.activeSlug);

    function scrollToPost(postId: string | null) {
        if (!postId) return;
        const element = document.getElementById(postId);
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }

    onMount(() => {
        tick().then(() => scrollToPost(activeSlug));
    });
</script>

<div class="grid gap-6">
    {#each posts as post}
        {@const isCollapsed = activeSlug !== post.slug}
        <AtomicCard
            id={post.slug}
            data={{
                title: post.title,
                content: isCollapsed ? post.excerpt : post.body,
                date: post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                      })
                    : undefined,
                tag: post.tags?.[0] ? { name: post.tags[0].name } : undefined,
            }}
            class={`scroll-mt-17 sm:scroll-mt-22 ${isCollapsed ? "cursor-pointer" : ""}`}
            preview={isCollapsed}
            clickable={isCollapsed}
            onclick={async () => {
                await goto(`/blog/${post.slug}`, {
                    keepFocus: true,
                    noScroll: true,
                });
                scrollToPost(post.slug);
            }}
        />
    {/each}
</div>

<PaginationControls
    count={data.pagination?.total || 0}
    perPage={data.pagination?.per_page || 10}
    onPageChange={(page) => goto(`?page=${page}`)}
/>

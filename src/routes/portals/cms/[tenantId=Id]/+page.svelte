<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    function formatDate(value: string | null | undefined): string {
        if (!value) return "Unknown";
        return new Date(value).toLocaleDateString();
    }
</script>

<svelte:head>
    <title>{data.tenant.name} - CMS Dashboard</title>
</svelte:head>

<div class="space-y-6">
    <section class="space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <!-- <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Card.Root>
                <Card.Content class="p-6">
                    <p class="text-sm font-medium text-muted-foreground">
                        Published
                    </p>
                    <p class="mt-2 text-3xl font-bold">
                        {data.stats.published}
                    </p>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="p-6">
                    <p class="text-sm font-medium text-muted-foreground">
                        Drafts
                    </p>
                    <p class="mt-2 text-3xl font-bold">{data.stats.drafts}</p>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="p-6">
                    <p class="text-sm font-medium text-muted-foreground">
                        Pages
                    </p>
                    <p class="mt-2 text-3xl font-bold">{data.stats.pages}</p>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="p-6">
                    <p class="text-sm font-medium text-muted-foreground">
                        Tags
                    </p>
                    <p class="mt-2 text-3xl font-bold">{data.stats.tags}</p>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="p-6">
                    <p class="text-sm font-medium text-muted-foreground">
                        Pending Comments
                    </p>
                    <p class="mt-2 text-3xl font-bold text-destructive">
                        {data.stats.pendingComments}
                    </p>
                </Card.Content>
            </Card.Root>
        </div> -->
    </section>

    <section class="grid gap-6 md:grid-cols-2">
        <Card.Root class="flex flex-col">
            <Card.Header>
                <Card.Title>Recent Content</Card.Title>
                <Card.Description
                    >Latest items created or updated.</Card.Description
                >
            </Card.Header>
            <Card.Content class="flex-1 space-y-4">
                {#if data.recentContent.length > 0}
                    <ul class="space-y-3">
                        {#each data.recentContent as item}
                            <li
                                class="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                            >
                                <div class="space-y-1">
                                    <p class="font-medium leading-none">
                                        {item.title}
                                    </p>
                                    <p class="text-xs text-muted-foreground">
                                        {item.type} • {formatDate(
                                            item.updated_at,
                                        )}
                                    </p>
                                </div>
                                <Badge
                                    variant={item.status === "published"
                                        ? "default"
                                        : "secondary"}
                                >
                                    {item.status}
                                </Badge>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No content items yet.
                    </p>
                {/if}
            </Card.Content>
            <Card.Footer>
                <Button
                    href={`/portals/cms/${data.tenant.id}/content`}
                    variant="outline"
                    class="w-full"
                >
                    View All Content
                </Button>
            </Card.Footer>
        </Card.Root>

        <Card.Root class="flex flex-col">
            <Card.Header>
                <Card.Title>Recent Comments</Card.Title>
                <Card.Description>Latest community feedback.</Card.Description>
            </Card.Header>
            <Card.Content class="flex-1 space-y-4">
                {#if data.recentComments.length > 0}
                    <ul class="space-y-3">
                        {#each data.recentComments as comment}
                            <li
                                class="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                            >
                                <div class="flex items-center justify-between">
                                    <p class="text-sm font-medium">
                                        {comment.author_name || "Unknown"} on
                                        <span class="italic"
                                            >"{comment.content_item?.title ||
                                                "Deleted Item"}"</span
                                        >
                                    </p>
                                    <Badge
                                        variant={comment.approved
                                            ? "outline"
                                            : "default"}
                                    >
                                        {comment.approved
                                            ? "Approved"
                                            : "Pending"}
                                    </Badge>
                                </div>
                                <p
                                    class="line-clamp-1 text-sm text-muted-foreground"
                                >
                                    "{comment.body}"
                                </p>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No comments loaded yet.
                    </p>
                {/if}
            </Card.Content>
            <Card.Footer>
                <Button
                    href={`/portals/cms/${data.tenant.id}/comments`}
                    variant="outline"
                    class="w-full"
                >
                    Manage Comments
                </Button>
            </Card.Footer>
        </Card.Root>
    </section>
</div>

<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const shortcuts = [
        {
            href: `/portals/cms/${data.tenant.public_slug}/content`,
            label: "Manage Content",
            description: "Browse, edit, and publish content items",
        },
        {
            href: `/portals/cms/${data.tenant.public_slug}/content/new`,
            label: "Create Content",
            description: "Jump straight into the editor",
        },
        {
            href: `/portals/cms/${data.tenant.public_slug}/tags`,
            label: "Organize Tags",
            description: "Keep taxonomy clean and useful",
        },
        {
            href: `/portals/cms/${data.tenant.public_slug}/comments`,
            label: "Moderate Comments",
            description: "Approve, reject, or remove discussions",
        },
    ];

    function formatDate(value: string | null | undefined): string {
        if (!value) return "Unknown";
        return new Date(value).toLocaleDateString();
    }
</script>

<svelte:head>
    <title>{data.tenant.name} - CMS Portal</title>
</svelte:head>

<div class="space-y-8">
    <section
        class="grid gap-4 rounded-xl border bg-linear-to-br from-background via-background to-muted/40 p-6 md:grid-cols-[1.5fr_1fr] md:p-8"
    >
        <div class="space-y-4">
            <div class="space-y-2">
                <Badge variant="outline">CMS Portal</Badge>
                <h1 class="text-3xl font-bold tracking-tight md:text-4xl">
                    {data.tenant.name}
                </h1>
                <p class="max-w-2xl text-sm text-muted-foreground md:text-base">
                    A quick control center for content, taxonomy, and moderation
                    tasks.
                </p>
            </div>

            <div class="flex flex-wrap gap-2">
                <Badge variant="default">Role: {data.userRole}</Badge>
                <Badge variant="secondary"
                    >Slug: {data.tenant.public_slug}</Badge
                >
                <Badge variant="outline">Status: Active portal</Badge>
            </div>

            <div class="flex flex-wrap gap-3">
                <Button href={`/portals/cms/${data.tenant.public_slug}/content`}
                    >Open Content</Button
                >
                <Button
                    href={`/portals/cms/${data.tenant.public_slug}/content/new`}
                    variant="outline"
                >
                    New Content
                </Button>
            </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
            <Card.Root>
                <Card.Content class="p-4">
                    <p
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                        Content Items
                    </p>
                    <p class="mt-2 text-3xl font-semibold">
                        {data.overview.contentTotal}
                    </p>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="p-4">
                    <p
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                        Tags
                    </p>
                    <p class="mt-2 text-3xl font-semibold">
                        {data.overview.tagsTotal}
                    </p>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="p-4">
                    <p
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                        Comments
                    </p>
                    <p class="mt-2 text-3xl font-semibold">
                        {data.overview.commentsTotal}
                    </p>
                </Card.Content>
            </Card.Root>
            <Card.Root>
                <Card.Content class="p-4">
                    <p
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                        Published
                    </p>
                    <p class="mt-2 text-3xl font-semibold">
                        {data.overview.publishedCount}
                    </p>
                </Card.Content>
            </Card.Root>
        </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
        <Card.Root>
            <Card.Header>
                <Card.Title>Quick Shortcuts</Card.Title>
                <Card.Description
                    >Jump into the places you use most.</Card.Description
                >
            </Card.Header>
            <Card.Content class="grid gap-3">
                {#each shortcuts as shortcut}
                    <div
                        class="flex items-center justify-between gap-4 rounded-lg border p-4"
                    >
                        <div>
                            <p class="font-medium">{shortcut.label}</p>
                            <p class="text-sm text-muted-foreground">
                                {shortcut.description}
                            </p>
                        </div>
                        <Button href={shortcut.href} variant="outline" size="sm"
                            >Open</Button
                        >
                    </div>
                {/each}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Recent Content</Card.Title>
                <Card.Description
                    >Latest items pulled from the CMS API.</Card.Description
                >
            </Card.Header>
            <Card.Content class="space-y-3">
                {#if data.recentContent.length > 0}
                    {#each data.recentContent as item}
                        <div class="rounded-lg border p-4">
                            <div class="flex items-start justify-between gap-4">
                                <div>
                                    <p class="font-medium">{item.title}</p>
                                    <p class="text-sm text-muted-foreground">
                                        {item.type} • {formatDate(
                                            item.updated_at,
                                        )}
                                    </p>
                                </div>
                                <Badge variant="outline">{item.status}</Badge>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No content items yet.
                    </p>
                {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Recent Tags</Card.Title>
                <Card.Description
                    >A few of the current taxonomy entries.</Card.Description
                >
            </Card.Header>
            <Card.Content class="flex flex-wrap gap-2">
                {#if data.recentTags.length > 0}
                    {#each data.recentTags as tag}
                        <Badge variant="secondary">{tag.name}</Badge>
                    {/each}
                {:else}
                    <p class="text-sm text-muted-foreground">No tags yet.</p>
                {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Recent Comments</Card.Title>
                <Card.Description
                    >Latest moderation items to review.</Card.Description
                >
            </Card.Header>
            <Card.Content class="space-y-3">
                {#if data.recentComments.length > 0}
                    {#each data.recentComments as comment}
                        <div class="rounded-lg border p-4">
                            <div class="flex items-start justify-between gap-4">
                                <div>
                                    <p class="font-medium">
                                        {comment.author_name ||
                                            "Unknown author"}
                                    </p>
                                    <p
                                        class="line-clamp-2 text-sm text-muted-foreground"
                                    >
                                        {comment.body}
                                    </p>
                                </div>
                                <Badge
                                    variant={comment.approved
                                        ? "default"
                                        : "secondary"}
                                >
                                    {comment.approved ? "Approved" : "Pending"}
                                </Badge>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No comments loaded yet.
                    </p>
                {/if}
            </Card.Content>
        </Card.Root>
    </section>
</div>

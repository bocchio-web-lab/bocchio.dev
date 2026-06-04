<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { Button } from "$components/ui/button/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import * as Select from "$components/ui/select/index.js";
    // import { Input } from "$components/ui/input/index.js";

    import type { PageData } from "./$types";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const status_options = [
        { value: "", label: "All Status" },
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
    ];

    const type_options = $derived(
        (() => {
            const items = data.content ?? [];
            const uniqueTypes = Array.from(
                new Set(items.map((i: any) => i.type).filter(Boolean)),
            );

            return [
                { value: "", label: "All Types" },
                ...uniqueTypes.map((t) => ({
                    value: t,
                    label:
                        (t as string).charAt(0).toUpperCase() +
                        (t as string).slice(1),
                })),
            ] as { value: string; label: string }[];
        })(),
    );

    let status = $state("");
    let type = $state("");
    let title = $state("");

    function getStatusBadgeVariant(status: string) {
        const status_badge_variants: Record<
            string,
            "default" | "secondary" | "destructive" | "outline"
        > = {
            published: "default",
            draft: "secondary",
            archived: "outline",
        };

        return status_badge_variants[status] || "outline";
    }

    function updateFilter(param: string, value: string) {
        const url = new URL(page.url);
        if (value) {
            url.searchParams.set(param, value);
        } else {
            url.searchParams.delete(param);
        }
        url.searchParams.delete("page"); // Reset to first page on filter change
        goto(url.toString());
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">
                Content Management
            </h2>
            <p class="text-muted-foreground">
                Manage all your posts, pages, and projects
            </p>
        </div>
        <Button href={`/apps/cms/${data.tenant.id}/content/new`}>
            Create New Content
        </Button>
    </div>

    <!-- Filters -->
    <Card.Root>
        <Card.Header>
            <Card.Title>Filters</Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4 md:flex-row md:items-center">
            <!-- <div class="w-full md:w-1/3">
                <Input
                    type="text"
                    name="title"
                    bind:value={data.filters.title}
                    placeholder="Search by title..."
                    on:input={(e) =>
                        updateFilter("title", (e.target as HTMLInputElement).value)
                    }
                />
            </div> -->

            <div class="w-full md:w-1/3">
                <Select.Root
                    type="single"
                    name="type"
                    bind:value={type}
                    onValueChange={(val) => updateFilter("type", val)}
                >
                    <Select.Trigger class="w-full">
                        {type_options.find((f) => f.value === type)?.label ??
                            "Select a type"}
                    </Select.Trigger>
                    <Select.Content>
                        {#each type_options as option (option.value)}
                            <Select.Item
                                value={option.value}
                                label={option.label}
                            >
                                {option.label}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <div class="w-full md:w-1/3">
                <Select.Root
                    type="single"
                    name="status"
                    bind:value={status}
                    onValueChange={(val) => updateFilter("status", val)}
                >
                    <Select.Trigger class="w-full">
                        {status_options.find((f) => f.value === status)
                            ?.label ?? "Select a status"}
                    </Select.Trigger>
                    <Select.Content>
                        {#each status_options as option (option.value)}
                            <Select.Item
                                value={option.value}
                                label={option.label}
                            >
                                {option.label}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <Button
                variant="outline"
                onclick={() => {
                    goto(`/apps/cms/${data.tenant.id}/content`);
                    status = "";
                    type = "";
                    title = "";
                }}
                class="w-full md:w-1/3"
                disabled={!data.filters.type &&
                    !data.filters.status &&
                    !data.filters.title}
            >
                Clear Filters
            </Button>
        </Card.Content>
    </Card.Root>

    <!-- Content List -->
    <Card.Root>
        <Card.Header>
            <Card.Title>
                Content Items
                <span class="text-sm font-normal text-muted-foreground">
                    ({data.pagination.total} total)
                </span>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            {#if data.content && data.content.length > 0}
                <div class="w-full overflow-x-auto">
                    <Table.Root class="w-full min-w-225 table-fixed">
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Title</Table.Head>
                                <Table.Head class="w-25">Type</Table.Head>
                                <Table.Head class="w-25">Status</Table.Head>
                                <Table.Head class="w-40">Author</Table.Head>
                                <Table.Head class="w-25">Updated</Table.Head>
                                <Table.Head class="w-25 text-right"
                                    >Actions</Table.Head
                                >
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each data.content as item}
                                <Table.Row>
                                    <Table.Cell class="font-medium">
                                        <div class="truncate">{item.title}</div>
                                        {#if item.excerpt}
                                            <div
                                                class="truncate text-xs text-muted-foreground"
                                            >
                                                {item.excerpt}
                                            </div>
                                        {/if}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="outline"
                                            >{item.type}</Badge
                                        >
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            variant={getStatusBadgeVariant(
                                                item.status,
                                            )}
                                        >
                                            {item.status}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell
                                        >{item.author?.name ||
                                            "Unknown"}</Table.Cell
                                    >
                                    <Table.Cell
                                        class="text-sm text-muted-foreground"
                                    >
                                        {new Date(
                                            item.updated_at,
                                        ).toLocaleDateString()}
                                    </Table.Cell>
                                    <Table.Cell class="text-right">
                                        <Button
                                            href={`/apps/cms/${data.tenant.id}/content/${item.id}`}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Edit
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            {/each}
                        </Table.Body>
                    </Table.Root>
                </div>

                <!-- Pagination -->
                <PaginationControls
                    count={data.pagination?.total || 0}
                    perPage={data.pagination?.perPage || 10}
                    onPageChange={(page) => goto(`?page=${page}`)}
                />
            {:else}
                <div class="py-12 text-center">
                    <p class="mb-4 text-muted-foreground">No content found</p>
                    <Button href={`/apps/cms/${data.tenant.id}/content/new`}>
                        Create Your First Content
                    </Button>
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>

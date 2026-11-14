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

    // All the types of the content, not only the ones of the items that are listed now: the list is filtered (and
    // paginated), so the options made from it would disappear as soon as the filter is used
    const type_options = $derived([
        { value: "", label: "All Types" },
        ...data.types.map((t: string) => ({
            value: t,
            label: t.charAt(0).toUpperCase() + t.slice(1),
        })),
    ]);

    // What the filters show is what the address says (also after a reload, or when the page is reached with a link)
    const status = $derived(data.filters.status);
    const type = $derived(data.filters.type);

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

    // Another page of the same list: the filters stay
    function goToPage(number: number) {
        const url = new URL(page.url);
        url.searchParams.set("page", String(number));
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
        <Button href={`/portals/cms/${data.tenant.id}/content/new`}>
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
                    value={type}
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
                    value={status}
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
                onclick={() => goto(`/portals/cms/${data.tenant.id}/content`)}
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
                                            href={`/portals/cms/${data.tenant.id}/content/${item.id}`}
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
                    onPageChange={goToPage}
                />
            {:else}
                <div class="py-12 text-center">
                    <p class="mb-4 text-muted-foreground">No content found</p>
                    <Button href={`/portals/cms/${data.tenant.id}/content/new`}>
                        Create Your First Content
                    </Button>
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>

<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { goto } from "$app/navigation";
    import { formatDate, formatDuration, currencySymbol } from "$lib/utils/ptm";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<svelte:head>
    <title>{data.tenant.name} - Lessons</title>
</svelte:head>

<div class="space-y-6">
    <div
        class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Lessons</h2>
            <p class="text-muted-foreground">
                Track tutoring sessions and their computed amounts.
            </p>
        </div>
        <Button href={`/apps/ptm/${data.tenant.id}/lessons/new`}>
            New Lesson
        </Button>
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>
                Lessons List
                <span class="text-sm font-normal text-muted-foreground">
                    ({data.pagination.total} total)
                </span>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            {#if data.lessons.length > 0}
                <div class="overflow-x-auto">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Date</Table.Head>
                                <Table.Head>Student</Table.Head>
                                <Table.Head>Duration</Table.Head>
                                <Table.Head>Cost</Table.Head>
                                <Table.Head>Topics</Table.Head>
                                <Table.Head>Subjects</Table.Head>
                                <Table.Head class="text-right">
                                    Actions
                                </Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each data.lessons as lesson}
                                <Table.Row>
                                    <Table.Cell>
                                        {formatDate(lesson.lesson_date)}
                                    </Table.Cell>
                                    <Table.Cell class="font-medium">
                                        {lesson.student.name}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {formatDuration(
                                            lesson.duration_minutes,
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="outline">
                                            {lesson.computed_amount}
                                            <span
                                                class="text-xs text-muted-foreground"
                                            >
                                                {currencySymbol(
                                                    lesson.student.currency,
                                                )}
                                            </span>
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {lesson.topics ?? "/"}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {#if lesson.subjects.length === 0}
                                            /
                                        {:else}
                                            {lesson.subjects
                                                .map(
                                                    (subject) =>
                                                        subject.name ?? "/",
                                                )
                                                .join(", ")}
                                        {/if}
                                    </Table.Cell>
                                    <Table.Cell class="text-right">
                                        <Button
                                            href={`/apps/ptm/${data.tenant.id}/lessons/${lesson.id}`}
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
            {:else}
                <div class="p-6 text-sm text-muted-foreground">
                    No lessons yet.
                </div>
            {/if}
        </Card.Content>
    </Card.Root>

    <PaginationControls
        count={data.pagination.total || 0}
        perPage={data.pagination.per_page || 10}
        onPageChange={(page) => goto(`?page=${page}`)}
    />
</div>

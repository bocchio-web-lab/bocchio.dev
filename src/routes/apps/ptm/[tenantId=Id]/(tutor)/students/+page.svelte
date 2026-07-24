<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";
    import { currencySymbol } from "$lib/utils/ptm";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { goto } from "$app/navigation";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    function statusVariant(
        status: string,
    ): "default" | "secondary" | "destructive" | "outline" {
        switch (status) {
            case "active":
                return "default";
            case "on_hold":
                return "secondary";
            case "ended":
                return "destructive";
            default:
                return "outline";
        }
    }
</script>

<svelte:head>
    <title>{data.tenant.name} - Students</title>
</svelte:head>

<div class="space-y-6">
    <div
        class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Students</h2>
            <p class="text-muted-foreground">
                Manage enrolled students and their dashboard links.
            </p>
        </div>
        <Button href={`/apps/ptm/${data.tenant.id}/students/new`}
            >New Student</Button
        >
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>
                Student List
                <span class="text-sm font-normal text-muted-foreground">
                    ({data.pagination.total} total)
                </span>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            {#if data.students.length > 0}
                <div class="overflow-x-auto">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Name</Table.Head>
                                <Table.Head>Hourly Rate</Table.Head>
                                <Table.Head>Extra</Table.Head>
                                <Table.Head>Status</Table.Head>
                                <Table.Head class="text-right">
                                    Actions
                                </Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each data.students.sort( (a, b) => a.support_status.localeCompare(b.support_status), ) as student}
                                <Table.Row>
                                    <Table.Cell class="font-medium"
                                        >{student.name}</Table.Cell
                                    >
                                    <Table.Cell>
                                        <Badge variant="outline">
                                            {student.hourly_rate}
                                            <span
                                                class="text-xs text-muted-foreground"
                                            >
                                                {currencySymbol(
                                                    student.currency,
                                                )}
                                            </span>
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="outline">
                                            {student.extra}
                                            <span
                                                class="text-xs text-muted-foreground"
                                            >
                                                {currencySymbol(
                                                    student.currency,
                                                )}
                                            </span>
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            variant={statusVariant(
                                                student.support_status,
                                            )}
                                            >{student.support_status ??
                                                "unknown"}</Badge
                                        >
                                    </Table.Cell>
                                    <Table.Cell class="text-right">
                                        <Button
                                            href={`/apps/ptm/${data.tenant.id}/students/${student.id}`}
                                            size="sm"
                                            variant="outline">Edit</Button
                                        >
                                    </Table.Cell>
                                </Table.Row>
                            {/each}
                        </Table.Body>
                    </Table.Root>
                </div>
            {:else}
                <div class="p-6 text-sm text-muted-foreground">
                    No students yet.
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

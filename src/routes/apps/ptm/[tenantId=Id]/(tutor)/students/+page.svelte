<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";

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
        class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
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
        <Card.Content class="p-0">
            {#if data.students.length > 0}
                <div class="overflow-x-auto">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Name</Table.Head>
                                <Table.Head>Status</Table.Head>
                                <Table.Head>Rate</Table.Head>
                                <Table.Head>Dashboard</Table.Head>
                                <Table.Head class="text-right"
                                    >Actions</Table.Head
                                >
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each data.students as student}
                                <Table.Row>
                                    <Table.Cell class="font-medium"
                                        >{student.name}</Table.Cell
                                    >
                                    <Table.Cell
                                        ><Badge
                                            variant={statusVariant(
                                                student.support_status,
                                            )}
                                            >{student.support_status ??
                                                "unknown"}</Badge
                                        ></Table.Cell
                                    >
                                    <Table.Cell
                                        >{student.currency}
                                        {student.hourly_rate}</Table.Cell
                                    >
                                    <Table.Cell>
                                        <span
                                            class="text-sm text-muted-foreground"
                                            >Create or edit to issue a token</span
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
</div>

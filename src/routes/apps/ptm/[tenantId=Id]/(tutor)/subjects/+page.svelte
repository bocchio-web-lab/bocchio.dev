<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import type { PageData } from "./$types";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<svelte:head>
    <title>{data.tenant.name} - Subjects</title>
</svelte:head>

<div class="space-y-6">
    <div
        class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Subjects</h2>
            <p class="text-muted-foreground">
                Maintain the subject catalog used by lessons.
            </p>
        </div>
        <Button href={`/apps/ptm/${data.tenant.id}/subjects/new`}
            >New Subject</Button
        >
    </div>

    <Card.Root>
        <Card.Content class="p-0">
            {#if data.subjects.length > 0}
                <div class="overflow-x-auto">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Name</Table.Head>
                                <Table.Head>Notes</Table.Head>
                                <Table.Head class="text-right"
                                    >Actions</Table.Head
                                >
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each data.subjects as subject}
                                <Table.Row>
                                    <Table.Cell class="font-medium"
                                        >{subject.name}</Table.Cell
                                    >
                                    <Table.Cell
                                        >{subject.notes ?? "—"}</Table.Cell
                                    >
                                    <Table.Cell class="text-right"
                                        ><Button
                                            href={`/apps/ptm/${data.tenant.id}/subjects/${subject.id}`}
                                            size="sm"
                                            variant="outline">Edit</Button
                                        ></Table.Cell
                                    >
                                </Table.Row>
                            {/each}
                        </Table.Body>
                    </Table.Root>
                </div>
            {:else}
                <div class="p-6 text-sm text-muted-foreground">
                    No subjects yet.
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>

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

    function studentName(studentId: number): string {
        return (
            data.students.find((student) => student.id === studentId)?.name ??
            `Student ${studentId}`
        );
    }
</script>

<svelte:head>
    <title>{data.tenant.name} - Payments</title>
</svelte:head>

<div class="space-y-6">
    <div
        class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Payments</h2>
            <p class="text-muted-foreground">
                Track received payments and their methods.
            </p>
        </div>
        <Button href={`/apps/ptm/${data.tenant.id}/payments/new`}
            >New Payment</Button
        >
    </div>

    <Card.Root>
        <Card.Content class="p-0">
            {#if data.payments.length > 0}
                <div class="overflow-x-auto">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Student</Table.Head>
                                <Table.Head>Date</Table.Head>
                                <Table.Head>Method</Table.Head>
                                <Table.Head class="text-right"
                                    >Amount</Table.Head
                                >
                                <Table.Head class="text-right"
                                    >Actions</Table.Head
                                >
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each data.payments as payment}
                                <Table.Row>
                                    <Table.Cell class="font-medium"
                                        >{studentName(
                                            payment.student_id,
                                        )}</Table.Cell
                                    >
                                    <Table.Cell
                                        >{payment.received_at}</Table.Cell
                                    >
                                    <Table.Cell
                                        ><Badge variant="outline"
                                            >{payment.method}</Badge
                                        ></Table.Cell
                                    >
                                    <Table.Cell class="text-right"
                                        >{payment.amount}</Table.Cell
                                    >
                                    <Table.Cell class="text-right"
                                        ><Button
                                            href={`/apps/ptm/${data.tenant.id}/payments/${payment.id}`}
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
                    No payments yet.
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>

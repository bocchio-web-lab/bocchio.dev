<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";
    import PaginationControls from "$components/pagination/pagination-controls.svelte";
    import { currencySymbol, formatDate } from "$lib/utils/ptm";
    import { goto } from "$app/navigation";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<svelte:head>
    <title>{data.tenant.name} - Payments</title>
</svelte:head>

<div class="space-y-6">
    <div
        class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Payments</h2>
            <p class="text-muted-foreground">
                Track received payments and their methods.
            </p>
        </div>
        <Button href={`/apps/ptm/${data.tenant.id}/payments/new`}>
            New Payment
        </Button>
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>
                Payment List
                <span class="text-sm font-normal text-muted-foreground">
                    ({data.pagination.total} total)
                </span>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            {#if data.payments.length > 0}
                <div class="overflow-x-auto">
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Date</Table.Head>
                                <Table.Head>Student</Table.Head>
                                <Table.Head>Amount</Table.Head>
                                <Table.Head>Method</Table.Head>
                                <Table.Head class="text-right">
                                    Actions
                                </Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each data.payments as payment}
                                <Table.Row>
                                    <Table.Cell>
                                        {formatDate(payment.received_at)}
                                    </Table.Cell>
                                    <Table.Cell class="font-medium">
                                        {payment.student.name}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge variant="outline">
                                            {payment.amount}
                                            <span
                                                class="text-xs text-muted-foreground"
                                            >
                                                {currencySymbol(
                                                    payment.student.currency,
                                                )}
                                            </span>
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {payment.method}
                                    </Table.Cell>
                                    <Table.Cell class="text-right">
                                        <Button
                                            href={`/apps/ptm/${data.tenant.id}/payments/${payment.id}`}
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
                    No payments yet.
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

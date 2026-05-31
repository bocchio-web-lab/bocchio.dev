<script lang="ts">
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const studentName = $derived(
        typeof data.student === "string"
            ? data.student
            : String(
                  (data.student as Record<string, unknown>)?.name ?? "Student",
              ),
    );

    function formatNumber(value: number | string | null | undefined): string {
        if (value === null || value === undefined || value === "") return "0";
        const numeric = typeof value === "string" ? Number(value) : value;
        return Number.isFinite(numeric)
            ? new Intl.NumberFormat().format(numeric)
            : String(value);
    }

    function formatDate(value: unknown): string {
        if (!value || typeof value !== "string") return "Unknown";
        return new Date(value).toLocaleDateString();
    }
</script>

<svelte:head>
    <title>Student Dashboard</title>
</svelte:head>

<div class="space-y-8">
    <section class="space-y-3">
        <h1 class="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p class="text-muted-foreground">{studentName}</p>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card.Root
            ><Card.Content class="p-6"
                ><p class="text-sm text-muted-foreground">Lessons</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(data.stats.lessons_count)}
                </p></Card.Content
            ></Card.Root
        >
        <Card.Root
            ><Card.Content class="p-6"
                ><p class="text-sm text-muted-foreground">Minutes</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(data.stats.total_minutes)}
                </p></Card.Content
            ></Card.Root
        >
        <Card.Root
            ><Card.Content class="p-6"
                ><p class="text-sm text-muted-foreground">Estimated amount</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(data.stats.estimated_amount)}
                </p></Card.Content
            ></Card.Root
        >
        <Card.Root
            ><Card.Content class="p-6"
                ><p class="text-sm text-muted-foreground">Payments</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(data.stats.payments_total)}
                </p></Card.Content
            ></Card.Root
        >
        <Card.Root
            ><Card.Content class="p-6"
                ><p class="text-sm text-muted-foreground">Balance</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(data.stats.balance_estimate)}
                </p></Card.Content
            ></Card.Root
        >
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
        <Card.Root>
            <Card.Header>
                <Card.Title>Recent Lessons</Card.Title>
            </Card.Header>
            <Card.Content>
                {#if data.recentLessons.length > 0}
                    <div class="overflow-x-auto">
                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head>Date</Table.Head>
                                    <Table.Head>Duration</Table.Head>
                                    <Table.Head>Status</Table.Head>
                                    <Table.Head class="text-right"
                                        >Amount</Table.Head
                                    >
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each data.recentLessons as lesson}
                                    <Table.Row>
                                        <Table.Cell
                                            >{formatDate(
                                                lesson.scheduled_at ??
                                                    lesson.created_at,
                                            )}</Table.Cell
                                        >
                                        <Table.Cell
                                            >{lesson.duration_minutes ?? "-"} min</Table.Cell
                                        >
                                        <Table.Cell
                                            ><Badge variant="outline"
                                                >{lesson.status ??
                                                    "unknown"}</Badge
                                            ></Table.Cell
                                        >
                                        <Table.Cell class="text-right"
                                            >{lesson.computed_amount ??
                                                lesson.hourly_rate ??
                                                "-"}</Table.Cell
                                        >
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    </div>
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No lessons available.
                    </p>
                {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Recent Payments</Card.Title>
            </Card.Header>
            <Card.Content>
                {#if data.recentPayments.length > 0}
                    <div class="overflow-x-auto">
                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head>Date</Table.Head>
                                    <Table.Head>Method</Table.Head>
                                    <Table.Head class="text-right"
                                        >Amount</Table.Head
                                    >
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each data.recentPayments as payment}
                                    <Table.Row>
                                        <Table.Cell
                                            >{formatDate(
                                                payment.received_at,
                                            )}</Table.Cell
                                        >
                                        <Table.Cell
                                            ><Badge variant="outline"
                                                >{payment.method ??
                                                    "unknown"}</Badge
                                            ></Table.Cell
                                        >
                                        <Table.Cell class="text-right"
                                            >{payment.amount ?? "-"}</Table.Cell
                                        >
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    </div>
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No payments available.
                    </p>
                {/if}
            </Card.Content>
        </Card.Root>
    </section>
</div>

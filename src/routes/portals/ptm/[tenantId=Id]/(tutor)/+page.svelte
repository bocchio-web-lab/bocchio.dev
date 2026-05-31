<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import * as Table from "$components/ui/table/index.js";
    import type { PageData } from "./$types";
    import { formatDuration } from "$lib/utils/ptm";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const stats = $derived(data.dashboard.stats);

    function formatNumber(value: number | string | null | undefined): string {
        if (value === null || value === undefined || value === "") return "0";
        const numeric = typeof value === "string" ? Number(value) : value;
        return Number.isFinite(numeric)
            ? new Intl.NumberFormat().format(numeric)
            : String(value);
    }

    function formatDate(value: string | null | undefined): string {
        if (!value) return "Unknown";
        return new Date(value).toLocaleDateString();
    }
</script>

<svelte:head>
    <title>{data.tenant.name} - PTM Dashboard</title>
</svelte:head>

<div class="space-y-8">
    <section class="space-y-4">
        <div
            class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        >
            <div>
                <h2 class="text-3xl font-bold tracking-tight">
                    Tutor Dashboard
                </h2>
                <p class="text-muted-foreground">
                    Overview of students, lessons, payments, and subjects for
                    this PTM tenant.
                </p>
            </div>
        </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Students</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(stats.students_count)}
                </p>
                <p class="text-xs text-muted-foreground">
                    {formatNumber(stats.students_count)} total students tracked
                </p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Lessons</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(stats.lessons_count)}
                </p>
                <p class="text-xs text-muted-foreground">
                    {formatDuration(stats.total_minutes)} total minutes
                </p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Revenue</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(stats.estimated_revenue)}
                </p>
                <p class="text-xs text-muted-foreground">
                    Estimated lesson revenue
                </p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Payments</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(stats.payments_total)}
                </p>
                <p class="text-xs text-muted-foreground">
                    {formatNumber(stats.payments_this_month)} this month
                </p>
            </Card.Content>
        </Card.Root>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
        <Card.Root>
            <Card.Header>
                <Card.Title>Recent Lessons</Card.Title>
                <Card.Description
                    >Most recent lessons in this tenant.</Card.Description
                >
            </Card.Header>
            <Card.Content>
                {#if data.recentLessons.length > 0}
                    <div class="overflow-x-auto">
                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head>Student</Table.Head>
                                    <Table.Head>Date</Table.Head>
                                    <Table.Head>Duration</Table.Head>
                                    <Table.Head class="text-right"
                                        >Amount</Table.Head
                                    >
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each data.recentLessons as lesson}
                                    <Table.Row>
                                        <Table.Cell class="font-medium"
                                            >{lesson.student?.name ??
                                                `Student ${lesson.student_id}`}</Table.Cell
                                        >
                                        <Table.Cell
                                            >{formatDate(
                                                lesson.created_at,
                                            )}</Table.Cell
                                        >
                                        <Table.Cell
                                            >{formatDuration(
                                                lesson.duration_minutes,
                                            )}</Table.Cell
                                        >
                                        <Table.Cell class="text-right"
                                            >{lesson.computed_amount}</Table.Cell
                                        >
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    </div>
                {:else}
                    <p class="text-sm text-muted-foreground">No lessons yet.</p>
                {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Recent Payments</Card.Title>
                <Card.Description>Latest received payments.</Card.Description>
            </Card.Header>
            <Card.Content>
                {#if data.recentPayments.length > 0}
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
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each data.recentPayments as payment}
                                    <Table.Row>
                                        <Table.Cell class="font-medium"
                                            >{payment.student?.name ??
                                                `Student ${payment.student_id}`}</Table.Cell
                                        >
                                        <Table.Cell
                                            >{formatDate(
                                                payment.received_at,
                                            )}</Table.Cell
                                        >
                                        <Table.Cell>
                                            <Badge variant="outline"
                                                >{payment.method}</Badge
                                            >
                                        </Table.Cell>
                                        <Table.Cell class="text-right"
                                            >{payment.amount}</Table.Cell
                                        >
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    </div>
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No payments recorded yet.
                    </p>
                {/if}
            </Card.Content>
        </Card.Root>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
        <Card.Root>
            <Card.Header>
                <Card.Title>Top Students</Card.Title>
                <Card.Description
                    >Students with the most activity in the tutor dashboard.</Card.Description
                >
            </Card.Header>
            <Card.Content>
                {#if data.dashboard.top_students.length > 0}
                    <div class="space-y-3">
                        {#each data.dashboard.top_students as student}
                            <div
                                class="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                            >
                                <div>
                                    <p class="font-medium">{student.name}</p>
                                    <p class="text-xs text-muted-foreground">
                                        {student.currency}
                                        {student.hourly_rate}
                                    </p>
                                </div>
                                <Badge variant="outline">#{student.id}</Badge>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-sm text-muted-foreground">
                        No top students data available yet.
                    </p>
                {/if}
            </Card.Content>
        </Card.Root>
    </section>
</div>

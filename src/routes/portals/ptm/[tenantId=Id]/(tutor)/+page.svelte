<script lang="ts">
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
    const pendingPayments = $derived(data.dashboard.pending_payments);
    const plots = $derived(data.dashboard.plots);

    // Client-side filtering: Only show balances for active or on_hold students
    const activeBalances = $derived(
        pendingPayments.filter(
            (s: any) =>
                s.status === "active" ||
                s.status === "on_hold" ||
                s.balance < 0,
        ),
    );

    // Helpers to scale chart bars based on maximum values
    const maxSubjectMinutes = $derived(
        Math.max(...plots.time_per_subject.map((s: any) => s.total_minutes), 1),
    );
    const maxMonthMinutes = $derived(
        Math.max(...plots.hours_per_month.map((m: any) => m.total_minutes), 1),
    );
    const maxTopTime = $derived(
        Math.max(
            ...plots.top_students_time.map(
                (s: any) => s.lessons_sum_duration_minutes,
            ),
            1,
        ),
    );
    const maxTopRev = $derived(
        Math.max(
            ...plots.top_students_revenue.map(
                (s: any) => s.lessons_sum_computed_amount,
            ),
            1,
        ),
    );

    function formatNumber(value: number | string | null | undefined): string {
        if (value === null || value === undefined || value === "") return "0";
        const numeric = typeof value === "string" ? Number(value) : value;
        return Number.isFinite(numeric)
            ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "EUR",
              }).format(numeric)
            : String(value);
    }
</script>

<svelte:head>
    <title>{data.tenant.name} - PTM Dashboard</title>
</svelte:head>

<div class="space-y-8">
    <section class="space-y-4">
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Tutor Dashboard</h2>
            <p class="text-muted-foreground">
                Overview of students, lessons, payments, and balances.
            </p>
        </div>
    </section>

    <!-- Top Stats -->
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Active Students</p>
                <p class="mt-2 text-3xl font-bold">{stats.students_count}</p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Total Time</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatDuration(stats.total_minutes)}
                </p>
                <p class="text-xs text-muted-foreground">
                    {stats.lessons_count} total lessons
                </p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Estimated Revenue</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(stats.estimated_revenue)}
                </p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Content class="p-6">
                <p class="text-sm text-muted-foreground">Payments Received</p>
                <p class="mt-2 text-3xl font-bold">
                    {formatNumber(stats.payments_total)}
                </p>
            </Card.Content>
        </Card.Root>
    </section>

    <!-- Pending Payments Table -->
    <Card.Root>
        <Card.Header>
            <Card.Title>Pending Balances</Card.Title>
            <Card.Description
                >Client-side filtered for active and on-hold students.</Card.Description
            >
        </Card.Header>
        <Card.Content>
            <div class="overflow-x-auto">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Student</Table.Head>
                            <Table.Head class="text-right">Earned</Table.Head>
                            <Table.Head class="text-right">Paid</Table.Head>
                            <Table.Head class="text-right">Balance</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each activeBalances as student}
                            <Table.Row>
                                <Table.Cell>
                                    <div class="font-medium">
                                        {student.name}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        class="mt-1 text-[10px]"
                                        >{student.status}</Badge
                                    >
                                </Table.Cell>
                                <Table.Cell
                                    class="text-right text-muted-foreground"
                                    >{formatNumber(
                                        student.total_earned,
                                    )}</Table.Cell
                                >
                                <Table.Cell
                                    class="text-right text-muted-foreground"
                                    >{formatNumber(
                                        student.total_paid,
                                    )}</Table.Cell
                                >
                                <Table.Cell
                                    class="text-right font-bold text-primary"
                                >
                                    {formatNumber(student.balance)}
                                </Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Plots Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <!-- Plot: Top Students by Revenue -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Top Students (By Revenue)</Card.Title>
            </Card.Header>
            <Card.Content>
                <div class="space-y-6">
                    {#each plots.top_students_revenue as student}
                        <div class="space-y-2">
                            <div
                                class="flex items-center justify-between text-sm"
                            >
                                <span class="font-medium">{student.name}</span>
                                <span class="text-muted-foreground"
                                    >{formatNumber(
                                        student.lessons_sum_computed_amount,
                                    )}</span
                                >
                            </div>
                            <div
                                class="h-3 w-full overflow-hidden rounded-full bg-secondary"
                            >
                                <div
                                    class="h-full bg-primary transition-all"
                                    style="width: {(student.lessons_sum_computed_amount /
                                        maxTopRev) *
                                        100}%"
                                ></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>

        <!-- Plot: Time per Subject -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Time per Subject</Card.Title>
            </Card.Header>
            <Card.Content>
                <div class="space-y-4">
                    {#each plots.time_per_subject as subject}
                        <div class="flex items-center gap-3">
                            <div class="w-20 truncate text-xs font-medium">
                                {subject.subject_name}
                            </div>
                            <div
                                class="flex-1 h-2 rounded-full bg-secondary overflow-hidden"
                            >
                                <div
                                    class="h-full bg-primary"
                                    style="width: {(subject.total_minutes /
                                        maxSubjectMinutes) *
                                        100}%"
                                ></div>
                            </div>
                            <div
                                class="w-16 text-right text-xs text-muted-foreground"
                            >
                                {formatDuration(subject.total_minutes)}
                            </div>
                        </div>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>

        <!-- Plot: Top Students by Time -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Top Students (By Time)</Card.Title>
            </Card.Header>
            <Card.Content>
                <div class="space-y-4">
                    {#each plots.top_students_time as student}
                        <div class="flex items-center gap-3">
                            <div class="w-20 truncate text-xs font-medium">
                                {student.name}
                            </div>
                            <div
                                class="flex-1 h-2 rounded-full bg-secondary overflow-hidden"
                            >
                                <div
                                    class="h-full bg-primary"
                                    style="width: {(student.lessons_sum_duration_minutes /
                                        maxTopTime) *
                                        100}%"
                                ></div>
                            </div>
                            <div
                                class="w-16 text-right text-xs text-muted-foreground"
                            >
                                {formatDuration(
                                    student.lessons_sum_duration_minutes,
                                )}
                            </div>
                        </div>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>
    </div>
    <!-- Plot: Hours per Month -->
    <Card.Root>
        <Card.Header>
            <Card.Title>Time per Month</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="flex h-[200px] items-end justify-between gap-2 pt-4">
                {#each plots.hours_per_month as month}
                    <div
                        class="group relative flex w-full flex-col items-center gap-2"
                    >
                        <div
                            class="w-full rounded-t-sm bg-primary/20 hover:bg-primary transition-colors"
                            style="height: {(month.total_minutes /
                                maxMonthMinutes) *
                                150}px"
                        ></div>
                        <span
                            class="text-xs text-muted-foreground truncate w-full text-center"
                            >{month.month.split("-")[1]}</span
                        >
                    </div>
                {/each}
            </div>
        </Card.Content>
    </Card.Root>
</div>

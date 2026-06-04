<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { Textarea } from "$components/ui/textarea/index.js";
    import * as Select from "$components/ui/select/index.js";
    import type { PageData, ActionData } from "./$types";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();
    let isSubmitting = $state(false);
    let student = $state("");
    let method = $state("cash");
    let tenant = $derived(data.tenant as any);

    $effect(() => {
        student = String(data.payment.student_id);
        method = data.payment.method ?? "cash";
    });
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Edit Payment</h2>
            <p class="text-muted-foreground">Payment #{data.payment.id}</p>
        </div>
        <Button href={`/apps/ptm/${tenant.id}/payments`} variant="outline"
            >Back</Button
        >
    </div>

    {#if form?.error}
        <Card.Root class="border-destructive"
            ><Card.Content class="pt-6 text-sm text-destructive"
                >{form.error}</Card.Content
            ></Card.Root
        >
    {/if}

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form
            method="POST"
            action="?/update"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                    await update();
                    isSubmitting = false;
                };
            }}
            class="space-y-6"
        >
            <Card.Root>
                <Card.Content class="space-y-4 pt-6">
                    <div class="space-y-2">
                        <Label>Student</Label>
                        <Select.Root
                            type="single"
                            name="student_id"
                            bind:value={student}
                        >
                            <Select.Trigger class="w-full"
                                >{data.students.find(
                                    (item) => String(item.id) === student,
                                )?.name ?? student}</Select.Trigger
                            >
                            <Select.Content>
                                {#each data.students as item}
                                    <Select.Item
                                        value={String(item.id)}
                                        label={item.name}
                                        >{item.name}</Select.Item
                                    >
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <input
                        type="hidden"
                        name="tutor_id"
                        value={data.payment.tutor_id}
                    />
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="received_at">Received at</Label><Input
                                id="received_at"
                                name="received_at"
                                type="datetime-local"
                                value={data.payment.received_at ?? ""}
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="amount">Amount</Label><Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                value={data.payment.amount ?? ""}
                                required
                            />
                        </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="currency">Currency</Label><Input
                                id="currency"
                                name="currency"
                                value={data.payment.currency}
                            />
                        </div>
                        <div class="space-y-2">
                            <Label>Method</Label>
                            <Select.Root
                                type="single"
                                name="method"
                                bind:value={method}
                            >
                                <Select.Trigger class="w-full"
                                    >{method}</Select.Trigger
                                >
                                <Select.Content>
                                    <Select.Item value="cash" label="Cash"
                                        >Cash</Select.Item
                                    >
                                    <Select.Item
                                        value="electronic"
                                        label="Electronic"
                                        >Electronic</Select.Item
                                    >
                                </Select.Content>
                            </Select.Root>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label for="notes">Notes</Label><Textarea
                            id="notes"
                            name="notes"
                            rows={5}
                            value={data.payment.notes ?? ""}
                        />
                    </div>
                </Card.Content>
            </Card.Root>

            <div class="flex justify-between gap-2">
                <Button
                    type="submit"
                    variant="destructive"
                    formaction="?/delete">Delete Payment</Button
                >
                <Button type="submit" disabled={isSubmitting}
                    >{isSubmitting ? "Saving..." : "Save changes"}</Button
                >
            </div>
        </form>

        <Card.Root>
            <Card.Header><Card.Title>Payment summary</Card.Title></Card.Header>
            <Card.Content class="space-y-3 text-sm">
                <p>
                    <span class="text-muted-foreground">Created:</span>
                    {data.payment.created_at ?? "Unknown"}
                </p>
                <p>
                    <span class="text-muted-foreground">Updated:</span>
                    {data.payment.updated_at ?? "Unknown"}
                </p>
                <p>
                    <span class="text-muted-foreground">Tutor:</span>
                    {data.payment.tutor ?? "Unknown"}
                </p>
            </Card.Content>
        </Card.Root>
    </div>
</div>

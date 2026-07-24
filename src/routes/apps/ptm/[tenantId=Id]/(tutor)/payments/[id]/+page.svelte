<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { Textarea } from "$components/ui/textarea/index.js";
    import * as Select from "$components/ui/select/index.js";
    import type { PageData, ActionData } from "./$types";
    import { formatDateTime } from "$lib/utils/ptm";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();
    let isSubmitting = $state(false);
    let student = $derived(String(data.payment.student_id));
    let method = $derived(String(data.payment.method));
    let showDeleteConfirm = $state(false);
</script>

<div class="space-y-6">
    <div
        class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Edit Payment</h2>
            <p class="text-muted-foreground">Payment #{data.payment.id}</p>
        </div>
        <Button href={`/apps/ptm/${data.tenant.id}/payments`} variant="outline"
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
        <Card.Root>
            <Card.Content class="pt-6">
                <form
                    method="POST"
                    action="?/update"
                    id="edit-payment-form"
                    use:enhance={() => {
                        isSubmitting = true;
                        return async ({ update }) => {
                            await update();
                            isSubmitting = false;
                        };
                    }}
                    class="space-y-4"
                >
                    <div class="space-y-2">
                        <Label>Student</Label>
                        <Select.Root
                            type="single"
                            disabled
                            bind:value={student}
                        >
                            <Select.Trigger class="w-full">
                                {data.payment.student.name}
                            </Select.Trigger>
                        </Select.Root>
                        <input
                            type="hidden"
                            name="student_id"
                            value={student}
                        />
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
                                type="date"
                                value={data.payment.received_at.split("T")[0] ??
                                    ""}
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
                                <Select.Trigger class="w-full">
                                    {method === "cash"
                                        ? "Cash"
                                        : method === "electronic"
                                          ? "Electronic"
                                          : method}
                                </Select.Trigger>
                                <Select.Content>
                                    <Select.Item value="cash" label="Cash">
                                        Cash
                                    </Select.Item>
                                    <Select.Item
                                        value="electronic"
                                        label="Electronic"
                                    >
                                        Electronic
                                    </Select.Item>
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
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="created_at">Created at</Label>
                            <Input
                                id="created_at"
                                name="created_at"
                                value={formatDateTime(
                                    data.payment.created_at,
                                ) ?? ""}
                                readonly
                                disabled
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="updated_at">Updated at</Label>
                            <Input
                                id="updated_at"
                                name="updated_at"
                                value={formatDateTime(
                                    data.payment.updated_at,
                                ) ?? ""}
                                readonly
                                disabled
                            />
                        </div>
                    </div>
                </form>
            </Card.Content>
        </Card.Root>

        <div class="flex justify-between gap-2">
            {#if !showDeleteConfirm}
                <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onclick={() => (showDeleteConfirm = true)}
                >
                    Delete Payment
                </Button>
            {:else}
                <form
                    method="POST"
                    action="?/delete"
                    use:enhance
                    class="flex gap-2"
                >
                    <input
                        type="hidden"
                        name="data_payment_id"
                        value={data.payment.id}
                    />
                    <span class="self-center text-sm text-muted-foreground"
                        >Are you sure?</span
                    >
                    <Button type="submit" size="sm" variant="destructive"
                        >Yes, Delete</Button
                    >
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onclick={() => (showDeleteConfirm = false)}
                    >
                        Cancel
                    </Button>
                </form>
            {/if}

            <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                onclick={() => {
                    const form = document.getElementById(
                        "edit-payment-form",
                    ) as HTMLFormElement | null;
                    form?.submit();
                }}
            >
                {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
        </div>
    </div>
</div>

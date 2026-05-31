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
    let status = $state(data.student.support_status ?? "active");
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Edit Student</h2>
            <p class="text-muted-foreground">{data.student.name}</p>
        </div>
        <Button
            href={`/portals/ptm/${data.tenant.id}/students`}
            variant="outline">Back</Button
        >
    </div>

    {#if form?.error}
        <Card.Root class="border-destructive"
            ><Card.Content class="pt-6 text-sm text-destructive"
                >{form.error}</Card.Content
            ></Card.Root
        >
    {/if}

    {#if form?.success && form?.dashboard_key}
        <Card.Root>
            <Card.Content class="space-y-2 pt-6">
                <p class="text-sm font-medium">Dashboard key</p>
                <p class="break-all text-sm text-muted-foreground">
                    {form.dashboard_key}
                </p>
                <Button
                    href={`/ptm/${data.tenant.id}/student-dashboard/${form.dashboard_key}`}
                    >Open student dashboard</Button
                >
            </Card.Content>
        </Card.Root>
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
                <Card.Header
                    ><Card.Title>Student details</Card.Title></Card.Header
                >
                <Card.Content class="space-y-4">
                    <div class="space-y-2">
                        <Label for="name">Name *</Label><Input
                            id="name"
                            name="name"
                            value={data.student.name}
                            required
                        />
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="hourly_rate">Hourly rate</Label><Input
                                id="hourly_rate"
                                name="hourly_rate"
                                type="number"
                                step="0.01"
                                value={data.student.hourly_rate ?? ""}
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="currency">Currency</Label><Input
                                id="currency"
                                name="currency"
                                value={data.student.currency}
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label for="dashboard_key">Dashboard key</Label><Input
                            id="dashboard_key"
                            name="dashboard_key"
                            placeholder="Leave empty to keep current or generate later"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label>Support status</Label>
                        <Select.Root
                            type="single"
                            name="support_status"
                            bind:value={status}
                        >
                            <Select.Trigger class="w-full"
                                >{status}</Select.Trigger
                            >
                            <Select.Content>
                                <Select.Item value="active" label="Active"
                                    >Active</Select.Item
                                >
                                <Select.Item value="on_hold" label="On hold"
                                    >On hold</Select.Item
                                >
                                <Select.Item value="ended" label="Ended"
                                    >Ended</Select.Item
                                >
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <div class="space-y-2">
                        <Label for="support_ended_at">Support ended at</Label
                        ><Input
                            id="support_ended_at"
                            name="support_ended_at"
                            type="datetime-local"
                            value={data.student.support_ended_at ?? ""}
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="notes">Notes</Label><Textarea
                            id="notes"
                            name="notes"
                            rows={5}>{data.student.notes ?? ""}</Textarea
                        >
                    </div>
                </Card.Content>
            </Card.Root>

            <div class="flex justify-between gap-2">
                <Button
                    type="submit"
                    variant="destructive"
                    formaction="?/delete">Delete Student</Button
                >
                <div class="flex gap-2">
                    <Button
                        type="submit"
                        variant="outline"
                        formaction="?/issueDashboardKey"
                        name="tenant_id"
                        value={data.tenant.id}>Issue key</Button
                    >
                    <Button
                        type="submit"
                        variant="outline"
                        formaction="?/reissueDashboardKey"
                        name="tenant_id"
                        value={data.tenant.id}>Reissue key</Button
                    >
                    <Button type="submit" disabled={isSubmitting}
                        >{isSubmitting ? "Saving..." : "Save changes"}</Button
                    >
                </div>
            </div>
        </form>

        <Card.Root>
            <Card.Header><Card.Title>Public dashboard</Card.Title></Card.Header>
            <Card.Content class="space-y-3">
                <p class="text-sm text-muted-foreground">
                    The student opens this route with their dashboard key.
                </p>
                <Input
                    readonly
                    value={`/ptm/${data.tenant.id}/student-dashboard/{dashboard_key}`}
                />
                <p class="text-xs text-muted-foreground">
                    Use the issued key to replace the placeholder above.
                </p>
            </Card.Content>
        </Card.Root>
    </div>
</div>

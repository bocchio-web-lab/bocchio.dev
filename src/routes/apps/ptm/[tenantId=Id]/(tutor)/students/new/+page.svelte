<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { Textarea } from "$components/ui/textarea/index.js";
    import type { PageData, ActionData } from "./$types";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();
    let isSubmitting = $state(false);
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">New Student</h2>
            <p class="text-muted-foreground">
                Create a student and generate a dashboard link.
            </p>
        </div>
        <Button
            href={`/apps/ptm/${data.tenant.id}/students`}
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
                <p class="text-sm font-medium">Dashboard key issued</p>
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

    <form
        method="POST"
        action="?/create"
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
            <Card.Header><Card.Title>Student details</Card.Title></Card.Header>
            <Card.Content class="space-y-4">
                <div class="space-y-2">
                    <Label for="name">Name *</Label><Input
                        id="name"
                        name="name"
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
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="currency">Currency</Label><Input
                            id="currency"
                            name="currency"
                            value="USD"
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label for="dashboard_key">Dashboard key</Label><Input
                        id="dashboard_key"
                        name="dashboard_key"
                        placeholder="Leave empty to generate"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="support_status">Support status</Label><Input
                        id="support_status"
                        name="support_status"
                        value="active"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="support_ended_at">Support ended at</Label><Input
                        id="support_ended_at"
                        name="support_ended_at"
                        type="datetime-local"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="notes">Notes</Label><Textarea
                        id="notes"
                        name="notes"
                        rows={5}
                    />
                </div>
            </Card.Content>
        </Card.Root>

        <div class="flex justify-end gap-2">
            <Button
                href={`/apps/ptm/${data.tenant.id}/students`}
                variant="outline"
                type="button">Cancel</Button
            ><Button type="submit" disabled={isSubmitting}
                >{isSubmitting ? "Saving..." : "Create student"}</Button
            >
        </div>
    </form>
</div>

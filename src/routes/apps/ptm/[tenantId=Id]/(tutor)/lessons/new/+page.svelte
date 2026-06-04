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
    let selectedStudent = $state("");
    let isSubmitting = $state(false);
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">New Lesson</h2>
            <p class="text-muted-foreground">
                Create a tutoring session and let PTM compute the amount.
            </p>
        </div>
        <Button
            href={`/apps/ptm/${data.tenant.id}/lessons`}
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
            <Card.Content class="space-y-4 pt-6">
                <div class="space-y-2">
                    <Label>Student</Label>
                    <Select.Root
                        type="single"
                        name="student_id"
                        bind:value={selectedStudent}
                    >
                        <Select.Trigger class="w-full"
                            >{selectedStudent ||
                                "Select a student"}</Select.Trigger
                        >
                        <Select.Content>
                            {#each data.students as student}
                                <Select.Item
                                    value={String(student.id)}
                                    label={student.name}
                                    >{student.name}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="duration_minutes">Duration (minutes)</Label
                        ><Input
                            id="duration_minutes"
                            name="duration_minutes"
                            type="number"
                            min="1"
                            required
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="hourly_rate">Hourly rate</Label><Input
                            id="hourly_rate"
                            name="hourly_rate"
                            type="number"
                            step="0.01"
                        />
                    </div>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="extra_amount">Extra amount</Label><Input
                            id="extra_amount"
                            name="extra_amount"
                            type="number"
                            step="0.01"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="subject_ids">Subject IDs</Label><Input
                            id="subject_ids"
                            name="subject_ids"
                            placeholder="1,2,3"
                        />
                    </div>
                </div>
                <div class="space-y-2">
                    <Label for="topics">Topics</Label><Input
                        id="topics"
                        name="topics"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="notes">Notes</Label><Textarea
                        id="notes"
                        name="notes"
                        rows={5}
                    />
                </div>
                <input
                    type="hidden"
                    name="tutor_id"
                    value={data.tenant.owner_id}
                />
            </Card.Content>
        </Card.Root>

        <div class="flex justify-end gap-2">
            <Button
                href={`/apps/ptm/${data.tenant.id}/lessons`}
                variant="outline"
                type="button">Cancel</Button
            ><Button type="submit" disabled={isSubmitting}
                >{isSubmitting ? "Saving..." : "Create lesson"}</Button
            >
        </div>
    </form>
</div>

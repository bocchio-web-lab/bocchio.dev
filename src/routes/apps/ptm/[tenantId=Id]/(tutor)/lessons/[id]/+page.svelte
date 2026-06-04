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
    let student = $state(String(data.lesson.student_id));
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Edit Lesson</h2>
            <p class="text-muted-foreground">Lesson #{data.lesson.id}</p>
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
                        value={data.lesson.tutor_id}
                    />
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="duration_minutes"
                                >Duration (minutes)</Label
                            ><Input
                                id="duration_minutes"
                                name="duration_minutes"
                                type="number"
                                min="1"
                                value={data.lesson.duration_minutes}
                                required
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="hourly_rate">Hourly rate</Label><Input
                                id="hourly_rate"
                                name="hourly_rate"
                                type="number"
                                step="0.01"
                                value={data.lesson.hourly_rate ?? ""}
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
                                value={data.lesson.extra_amount ?? ""}
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
                            value={data.lesson.topics ?? ""}
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="notes">Notes</Label><Textarea
                            id="notes"
                            name="notes"
                            rows={5}>{data.lesson.notes ?? ""}</Textarea
                        >
                    </div>
                </Card.Content>
            </Card.Root>

            <div class="flex justify-between gap-2">
                <Button
                    type="submit"
                    variant="destructive"
                    formaction="?/delete">Delete Lesson</Button
                >
                <Button type="submit" disabled={isSubmitting}
                    >{isSubmitting ? "Saving..." : "Save changes"}</Button
                >
            </div>
        </form>

        <Card.Root>
            <Card.Header><Card.Title>Lesson summary</Card.Title></Card.Header>
            <Card.Content class="space-y-3 text-sm">
                <p>
                    <span class="text-muted-foreground">Computed amount:</span>
                    {data.lesson.computed_amount}
                </p>
                <p>
                    <span class="text-muted-foreground">Created:</span>
                    {data.lesson.created_at ?? "Unknown"}
                </p>
                <p>
                    <span class="text-muted-foreground">Updated:</span>
                    {data.lesson.updated_at ?? "Unknown"}
                </p>
            </Card.Content>
        </Card.Root>
    </div>
</div>

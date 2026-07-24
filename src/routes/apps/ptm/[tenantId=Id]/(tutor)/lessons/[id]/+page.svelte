<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { Textarea } from "$components/ui/textarea/index.js";
    import * as Select from "$components/ui/select/index.js";
    import type { PageData, ActionData } from "./$types";
    import { currencySymbol, formatDateTime } from "$lib/utils/ptm";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();
    let isSubmitting = $state(false);
    let student = $state(String(data.lesson.student_id));
    let subject = $state(data.lesson.subjects?.map((s) => String(s.id)) ?? []);
    let showDeleteConfirm = $state(false);
</script>

<div class="space-y-6">
    <div
        class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Edit Lesson</h2>
            <p class="text-muted-foreground">Lesson #{data.lesson.id}</p>
        </div>
        <Button href={`/apps/ptm/${data.tenant.id}/lessons`} variant="outline">
            Back
        </Button>
    </div>

    {#if form?.error}
        <Card.Root class="border-destructive">
            <Card.Content class="pt-6 text-sm text-destructive">
                {form.error}
            </Card.Content>
        </Card.Root>
    {/if}

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card.Root>
            <Card.Content class="pt-6">
                <form
                    method="POST"
                    action="?/update"
                    id="edit-lesson-form"
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
                            name="student_id"
                            bind:value={student}
                        >
                            <Select.Trigger class="w-full">
                                {data.students.find(
                                    (item) => String(item.id) === student,
                                )?.name ?? student}
                            </Select.Trigger>
                            <Select.Content>
                                {#each data.students.filter((s) => s.support_status === "active") as item}
                                    <Select.Item
                                        value={String(item.id)}
                                        label={item.name}
                                    >
                                        {item.name}
                                    </Select.Item>
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
                            <Label for="lesson_date">Date</Label>
                            <Input
                                id="lesson_date"
                                name="lesson_date"
                                type="date"
                                value={data.lesson.lesson_date}
                                required
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="duration_minutes">
                                Duration (minutes)
                            </Label>
                            <Input
                                id="duration_minutes"
                                name="duration_minutes"
                                type="number"
                                min="1"
                                value={data.lesson.duration_minutes}
                                required
                            />
                        </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="hourly_rate">Hourly rate</Label>
                            <Input
                                id="hourly_rate"
                                name="hourly_rate"
                                type="number"
                                step="0.01"
                                value={data.lesson.hourly_rate ?? ""}
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="extra_amount">Extra amount</Label>
                            <Input
                                id="extra_amount"
                                name="extra_amount"
                                type="number"
                                step="0.01"
                                value={data.lesson.extra_amount ?? ""}
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label for="subject_ids">Subjects</Label>
                        <Select.Root type="multiple" bind:value={subject}>
                            <Select.Trigger class="w-full">
                                {#if subject.length}
                                    {subject
                                        .map(
                                            (id) =>
                                                data.subjects.find(
                                                    (s) => String(s.id) === id,
                                                )?.name ?? id,
                                        )
                                        .join(", ")}
                                {:else}
                                    Select subjects
                                {/if}
                            </Select.Trigger>

                            <Select.Content>
                                {#each data.subjects as item}
                                    <Select.Item
                                        value={String(item.id)}
                                        label={item.name}
                                    >
                                        {item.name}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>

                        {#each subject as id}
                            <input
                                type="hidden"
                                name="subject_ids"
                                value={id}
                            />
                        {/each}
                    </div>
                    <div class="space-y-2">
                        <Label for="topics">Topics</Label>
                        <Input
                            id="topics"
                            name="topics"
                            value={data.lesson.topics ?? ""}
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="notes">Notes</Label>
                        <Textarea id="notes" name="notes" rows={5}
                            >{data.lesson.notes ?? ""}</Textarea
                        >
                    </div>
                    <div class="space-y-2">
                        <Label for="computed_amount">Computed amount</Label>
                        <Input
                            id="computed_amount"
                            name="computed_amount"
                            value={data.lesson.computed_amount ?? ""}
                            readonly
                            disabled
                        />
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="created_at">Created at</Label>
                            <Input
                                id="created_at"
                                name="created_at"
                                value={formatDateTime(data.lesson.created_at) ??
                                    ""}
                                readonly
                                disabled
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="updated_at">Updated at</Label>
                            <Input
                                id="updated_at"
                                name="updated_at"
                                value={formatDateTime(data.lesson.updated_at) ??
                                    ""}
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
                    Delete Lesson
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
                        name="data_lesson_id"
                        value={data.lesson.id}
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
                        "edit-lesson-form",
                    ) as HTMLFormElement | null;
                    form?.submit();
                }}
            >
                {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
        </div>
    </div>
</div>

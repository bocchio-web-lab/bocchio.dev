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
            <h2 class="text-2xl font-bold tracking-tight">Edit Subject</h2>
            <p class="text-muted-foreground">{data.subject.name}</p>
        </div>
        <Button
            href={`/portals/ptm/${data.tenant.id}/subjects`}
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
                        <Label for="name">Name *</Label><Input
                            id="name"
                            name="name"
                            value={data.subject.name}
                            required
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="notes">Notes</Label>
                        <Textarea id="notes" name="notes" rows={5}>
                            {data.subject.notes ?? ""}
                        </Textarea>
                    </div>
                </Card.Content>
            </Card.Root>

            <div class="flex justify-between gap-2">
                <Button
                    type="submit"
                    variant="destructive"
                    formaction="?/delete">Delete Subject</Button
                >
                <Button type="submit" disabled={isSubmitting}
                    >{isSubmitting ? "Saving..." : "Save changes"}</Button
                >
            </div>
        </form>

        <Card.Root>
            <Card.Header><Card.Title>Subject summary</Card.Title></Card.Header>
            <Card.Content class="space-y-3 text-sm">
                <p>
                    <span class="text-muted-foreground">Created:</span>
                    {data.subject.created_at ?? "Unknown"}
                </p>
                <p>
                    <span class="text-muted-foreground">Updated:</span>
                    {data.subject.updated_at ?? "Unknown"}
                </p>
            </Card.Content>
        </Card.Root>
    </div>
</div>

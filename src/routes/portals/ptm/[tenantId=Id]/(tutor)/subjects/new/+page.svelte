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
            <h2 class="text-2xl font-bold tracking-tight">New Subject</h2>
            <p class="text-muted-foreground">
                Add a new subject to the lesson catalog.
            </p>
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
                    <Label for="name">Name *</Label><Input
                        id="name"
                        name="name"
                        required
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
                href={`/portals/ptm/${data.tenant.id}/subjects`}
                variant="outline"
                type="button">Cancel</Button
            ><Button type="submit" disabled={isSubmitting}
                >{isSubmitting ? "Saving..." : "Create subject"}</Button
            >
        </div>
    </form>
</div>

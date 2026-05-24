<script lang="ts">
    import { run } from "svelte/legacy";

    import { enhance } from "$app/forms";
    import { Button } from "$components/ui/button/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import * as Dialog from "$components/ui/dialog/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import type { PageData, ActionData } from "./$types";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();

    let tenant = $derived(data.tenant);
    let showCreateDialog = $state(false);
    let editingTag: any = $state(null);
    let deletingTagId: number | null = $state(null);
    let isSubmitting = $state(false);

    run(() => {
        if (form?.success) {
            showCreateDialog = false;
            editingTag = null;
            deletingTagId = null;
        }
    });
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Tag Management</h2>
            <p class="text-muted-foreground">Organize your content with tags</p>
        </div>
        <Button onclick={() => (showCreateDialog = true)}>Create New Tag</Button
        >
    </div>

    {#if form?.success}
        <Card.Root class="border-green-500">
            <Card.Content class="pt-6">
                <p class="text-sm text-green-600">
                    Tag {form.action === "create"
                        ? "created"
                        : form.action === "update"
                          ? "updated"
                          : "deleted"} successfully!
                </p>
            </Card.Content>
        </Card.Root>
    {/if}

    {#if form?.error}
        <Card.Root class="border-destructive">
            <Card.Content class="pt-6">
                <p class="text-sm text-destructive">{form.error}</p>
            </Card.Content>
        </Card.Root>
    {/if}

    <Card.Root>
        <Card.Header>
            <Card.Title>
                All Tags
                <span class="text-sm font-normal text-muted-foreground">
                    ({data.tags?.length || 0} total)
                </span>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            {#if data.tags && data.tags.length > 0}
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>Name</Table.Head>
                            <Table.Head>Slug</Table.Head>
                            <Table.Head>Content Count</Table.Head>
                            <Table.Head class="text-right">Actions</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each data.tags as tag}
                            <Table.Row>
                                <Table.Cell class="font-medium"
                                    >{tag.name}</Table.Cell
                                >
                                <Table.Cell>
                                    <Badge variant="outline">{tag.slug}</Badge>
                                </Table.Cell>
                                <Table.Cell
                                    >{tag.content_items_count || 0} items</Table.Cell
                                >
                                <Table.Cell class="space-x-2 text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onclick={() => (editingTag = tag)}
                                    >
                                        Edit
                                    </Button>
                                    {#if deletingTagId === tag.id}
                                        <form
                                            method="POST"
                                            action="?/delete"
                                            use:enhance
                                            class="inline"
                                        >
                                            <input
                                                type="hidden"
                                                name="tenant_id"
                                                value={tenant.id}
                                            />

                                            <input
                                                type="hidden"
                                                name="id"
                                                value={tag.id}
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="destructive"
                                            >
                                                Confirm Delete
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onclick={() =>
                                                    (deletingTagId = null)}
                                            >
                                                Cancel
                                            </Button>
                                        </form>
                                    {:else}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onclick={() =>
                                                (deletingTagId = tag.id)}
                                        >
                                            Delete
                                        </Button>
                                    {/if}
                                </Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            {:else}
                <div class="py-12 text-center">
                    <p class="mb-4 text-muted-foreground">No tags yet</p>
                    <Button onclick={() => (showCreateDialog = true)}
                        >Create Your First Tag</Button
                    >
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>

<!-- Create Tag Dialog -->
<Dialog.Root bind:open={showCreateDialog}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Create New Tag</Dialog.Title>
            <Dialog.Description
                >Add a new tag to organize your content</Dialog.Description
            >
        </Dialog.Header>
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
        >
            <input type="hidden" name="tenant_id" value={tenant.id} />

            <div class="space-y-4 py-4">
                <div class="space-y-2">
                    <Label for="create-name">Name *</Label>
                    <Input
                        id="create-name"
                        name="name"
                        placeholder="e.g., Laravel"
                        required
                    />
                </div>
                <div class="space-y-2">
                    <Label for="create-slug">Slug (optional)</Label>
                    <Input
                        id="create-slug"
                        name="slug"
                        placeholder="e.g., laravel"
                    />
                    <p class="text-xs text-muted-foreground">
                        Leave empty to auto-generate
                    </p>
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    type="button"
                    variant="outline"
                    onclick={() => (showCreateDialog = false)}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Tag"}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>

<!-- Edit Tag Dialog -->
<Dialog.Root
    open={editingTag !== null}
    onOpenChange={(open) => !open && (editingTag = null)}
>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Edit Tag</Dialog.Title>
            <Dialog.Description>Update tag information</Dialog.Description>
        </Dialog.Header>
        {#if editingTag}
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
            >
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="id" value={editingTag.id} />
                <div class="space-y-4 py-4">
                    <div class="space-y-2">
                        <Label for="edit-name">Name *</Label>
                        <Input
                            id="edit-name"
                            name="name"
                            value={editingTag.name}
                            required
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="edit-slug">Slug *</Label>
                        <Input
                            id="edit-slug"
                            name="slug"
                            value={editingTag.slug}
                            required
                        />
                    </div>
                </div>
                <Dialog.Footer>
                    <Button
                        type="button"
                        variant="outline"
                        onclick={() => (editingTag = null)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </Dialog.Footer>
            </form>
        {/if}
    </Dialog.Content>
</Dialog.Root>

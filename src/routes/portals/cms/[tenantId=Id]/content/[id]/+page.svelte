<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { Textarea } from "$components/ui/textarea/index.js";
    import { Checkbox } from "$components/ui/checkbox/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData, ActionData } from "./$types";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    type ContentData = {
        title: string;
        type: string;
        slug: string;
        excerpt: string;
        body: string;
        status: string;
        published_at: string | null;
        created_at: string;
        updated_at: string;
        author?: { name?: string } | null;
        tags?: { id: number }[];
        meta?: {
            headerImages?: string[];
            externalLinks?: { title: string; url: string }[];
            [key: string]: unknown;
        };
    };

    let { data, form }: Props = $props();

    let tenant = $derived(data.tenant);
    let content = $derived(data.content as unknown as ContentData);

    let selectedStatus = $state("");
    let selectedTags = $state<number[]>([]);
    let isSubmitting = $state(false);
    let showDeleteConfirm = $state(false);

    $effect(() => {
        selectedStatus = content.status;
        selectedTags = content.tags ? content.tags.map((t) => t.id) : [];
    });

    // Meta properties - Initialize from existing data
    let headerImages: string[] = $derived(
        content.meta?.headerImages && Array.isArray(content.meta.headerImages)
            ? [...content.meta.headerImages]
            : [""],
    );
    let externalLinks: { title: string; url: string }[] = $derived(
        content.meta?.externalLinks && Array.isArray(content.meta.externalLinks)
            ? [...content.meta.externalLinks]
            : [{ title: "", url: "" }],
    );

    // Get custom meta fields (excluding headerImages and externalLinks)
    function getCustomMetaEntries() {
        if (!content.meta) return [];
        const entries: { key: string; value: string }[] = [];
        for (const [key, value] of Object.entries(content.meta)) {
            if (key !== "headerImages" && key !== "externalLinks") {
                entries.push({ key, value: String(value) });
            }
        }
        return entries;
    }

    let customMetaEntries: { key: string; value: string }[] = $derived(
        getCustomMetaEntries(),
    );

    // Functions to manage meta arrays
    function addHeaderImage() {
        headerImages = [...headerImages, ""];
    }

    function removeHeaderImage(index: number) {
        headerImages = headerImages.filter((_, i) => i !== index);
    }

    function addExternalLink() {
        externalLinks = [...externalLinks, { title: "", url: "" }];
    }

    function removeExternalLink(index: number) {
        externalLinks = externalLinks.filter((_, i) => i !== index);
    }

    function addCustomMetaEntry() {
        customMetaEntries = [...customMetaEntries, { key: "", value: "" }];
    }

    function removeCustomMetaEntry(index: number) {
        customMetaEntries = customMetaEntries.filter((_, i) => i !== index);
    }

    // Format datetime for input
    function formatDatetimeLocal(
        dateString: string | null | undefined,
    ): string {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Edit Content</h2>
            <p class="text-muted-foreground">{content.title}</p>
        </div>
        <div class="flex gap-2">
            <Button
                href={`/portals/cms/${data.tenant.id}/content`}
                variant="outline"
            >
                Back to List
            </Button>
        </div>
    </div>

    {#if form?.success}
        <Card.Root class="border-green-500">
            <Card.Content class="pt-6">
                <p class="text-sm text-green-600">
                    Content updated successfully!
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
        <div class="space-y-6">
            <Card.Root>
                <Card.Header>
                    <Card.Title>Basic Information</Card.Title>
                    <div class="flex gap-2">
                        <Badge variant="outline">{content.type}</Badge>
                        <Badge>{content.status}</Badge>
                    </div>
                </Card.Header>
                <Card.Content class="space-y-4">
                    <!-- Type -->
                    <div class="space-y-2">
                        <Label for="type">Content Type *</Label>
                        <Input
                            id="type"
                            name="type"
                            value={content.type}
                            required
                        />
                    </div>

                    <!-- Title -->
                    <div class="space-y-2">
                        <Label for="title">Title *</Label>
                        <Input
                            id="title"
                            name="title"
                            value={content.title}
                            required
                        />
                    </div>

                    <!-- Slug -->
                    <div class="space-y-2">
                        <Label for="slug">Slug</Label>
                        <Input id="slug" name="slug" value={content.slug} />
                    </div>

                    <!-- Excerpt -->
                    <div class="space-y-2">
                        <Label for="excerpt">Excerpt</Label>
                        <Textarea
                            id="excerpt"
                            name="excerpt"
                            value={content.excerpt}
                            rows={3}
                        />
                    </div>
                </Card.Content>
            </Card.Root>

            <Card.Root>
                <Card.Header>
                    <Card.Title>Content Body</Card.Title>
                </Card.Header>
                <Card.Content>
                    <div class="space-y-2">
                        <Label for="body">Body (Markdown/HTML) *</Label>
                        <Textarea
                            id="body"
                            name="body"
                            value={content.body}
                            rows={15}
                            required
                        />
                    </div>
                </Card.Content>
            </Card.Root>

            <Card.Root>
                <Card.Header>
                    <Card.Title>Meta Properties</Card.Title>
                    <p class="text-sm text-muted-foreground">
                        Additional metadata for your content (all optional)
                    </p>
                </Card.Header>
                <Card.Content class="space-y-6">
                    <!-- Header Carousel Images -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <Label>Header Carousel Images</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onclick={addHeaderImage}
                            >
                                Add Image
                            </Button>
                        </div>
                        {#each headerImages as image, index}
                            <div class="flex gap-2">
                                <Input
                                    name="meta_header_images"
                                    bind:value={headerImages[index]}
                                    placeholder="https://example.com/image.jpg"
                                    type="url"
                                />
                                {#if headerImages.length > 1}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onclick={() => removeHeaderImage(index)}
                                    >
                                        ×
                                    </Button>
                                {/if}
                            </div>
                        {/each}
                    </div>

                    <!-- External Resource Links -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <Label>External Resource Links</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onclick={addExternalLink}
                            >
                                Add Link
                            </Button>
                        </div>
                        {#each externalLinks as link, index}
                            <div class="flex gap-2">
                                <Input
                                    name="meta_external_links_title"
                                    bind:value={externalLinks[index].title}
                                    placeholder="Link title"
                                    class="w-1/3"
                                />
                                <Input
                                    name="meta_external_links_url"
                                    bind:value={externalLinks[index].url}
                                    placeholder="https://example.com"
                                    type="url"
                                />
                                {#if externalLinks.length > 1}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onclick={() =>
                                            removeExternalLink(index)}
                                    >
                                        ×
                                    </Button>
                                {/if}
                            </div>
                        {/each}
                    </div>

                    <!-- Custom Meta Fields -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <Label>Custom Meta Fields</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onclick={addCustomMetaEntry}
                            >
                                Add Field
                            </Button>
                        </div>
                        {#if customMetaEntries.length > 0}
                            {#each customMetaEntries as entry, index}
                                <div class="flex gap-2">
                                    <Input
                                        name="meta_custom_keys"
                                        bind:value={
                                            customMetaEntries[index].key
                                        }
                                        placeholder="Key"
                                        class="w-1/3"
                                    />
                                    <Input
                                        name="meta_custom_values"
                                        bind:value={
                                            customMetaEntries[index].value
                                        }
                                        placeholder="Value"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onclick={() =>
                                            removeCustomMetaEntry(index)}
                                    >
                                        ×
                                    </Button>
                                </div>
                            {/each}
                        {:else}
                            <p class="text-sm text-muted-foreground">
                                No custom fields added
                            </p>
                        {/if}
                    </div>
                </Card.Content>
            </Card.Root>

            <Card.Root>
                <Card.Header>
                    <Card.Title>Publishing Options</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-4">
                    <!-- Status -->
                    <div class="space-y-2">
                        <Label for="status">Status</Label>
                        <select
                            id="status"
                            name="status"
                            bind:value={selectedStatus}
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <!-- Publish Date -->
                    {#if selectedStatus === "published"}
                        <div class="space-y-2">
                            <Label for="published_at">Publish Date</Label>
                            <Input
                                id="published_at"
                                name="published_at"
                                type="datetime-local"
                                value={formatDatetimeLocal(
                                    content.published_at,
                                )}
                            />
                        </div>
                    {/if}

                    <!-- Tags -->
                    {#if data.tags && data.tags.length > 0}
                        <div class="space-y-2">
                            <Label>Tags</Label>
                            <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
                                {#each data.tags as tag}
                                    <div class="flex items-center space-x-2">
                                        <Checkbox
                                            id={`tag-${tag.id}`}
                                            checked={selectedTags.includes(
                                                tag.id,
                                            )}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    selectedTags = [
                                                        ...selectedTags,
                                                        tag.id,
                                                    ];
                                                } else {
                                                    selectedTags =
                                                        selectedTags.filter(
                                                            (id) =>
                                                                id !== tag.id,
                                                        );
                                                }
                                            }}
                                        />
                                        <!-- Hidden input for form submission -->
                                        {#if selectedTags.includes(tag.id)}
                                            <input
                                                type="hidden"
                                                name="tags"
                                                value={tag.id}
                                            />
                                        {/if}
                                        <Label
                                            for={`tag-${tag.id}`}
                                            class="cursor-pointer text-sm font-normal"
                                        >
                                            {tag.name}
                                        </Label>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Metadata -->
                    <div class="space-y-2">
                        <Label class="text-muted-foreground">Metadata</Label>
                        <div class="space-y-1 text-sm">
                            <p>
                                <span class="font-medium">Author:</span>
                                {content.author?.name || "Unknown"}
                            </p>
                            <p>
                                <span class="font-medium">Created:</span>
                                {new Date(content.created_at).toLocaleString()}
                            </p>
                            <p>
                                <span class="font-medium">Last Updated:</span>
                                {new Date(content.updated_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card.Content>
            </Card.Root>

            <div class="flex justify-between">
                <div>
                    {#if !showDeleteConfirm}
                        <Button
                            type="button"
                            variant="destructive"
                            onclick={() => (showDeleteConfirm = true)}
                        >
                            Delete Content
                        </Button>
                    {:else}
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-muted-foreground"
                                >Are you sure?</span
                            >
                            <Button
                                type="submit"
                                formaction="?/delete"
                                variant="destructive"
                                size="sm"
                            >
                                Yes, Delete
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onclick={() => (showDeleteConfirm = false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    {/if}
                </div>

                <div class="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        href={`/portals/cms/${data.tenant.id}/content`}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    </form>
</div>

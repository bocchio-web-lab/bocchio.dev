<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let selectedType = $state('post');
	let selectedStatus = $state('draft');
	let selectedTags: number[] = $state([]);
	let isSubmitting = $state(false);

	// Meta properties
	let headerImages: string[] = $state(['']);
	let externalLinks: { title: string; url: string }[] = $state([{ title: '', url: '' }]);
	let customMetaEntries: { key: string; value: string }[] = $state([]);

	// Functions to manage meta arrays
	function addHeaderImage() {
		headerImages = [...headerImages, ''];
	}

	function removeHeaderImage(index: number) {
		headerImages = headerImages.filter((_, i) => i !== index);
	}

	function addExternalLink() {
		externalLinks = [...externalLinks, { title: '', url: '' }];
	}

	function removeExternalLink(index: number) {
		externalLinks = externalLinks.filter((_, i) => i !== index);
	}

	function addCustomMetaEntry() {
		customMetaEntries = [...customMetaEntries, { key: '', value: '' }];
	}

	function removeCustomMetaEntry(index: number) {
		customMetaEntries = customMetaEntries.filter((_, i) => i !== index);
	}
</script>

<svelte:head>
	<title>Create Content - {data.tenant.name}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Create New Content</h2>
			<p class="text-muted-foreground">Add a new post, page, or project</p>
		</div>
		<Button
			href={`/portals/cms/${data.tenant.public_slug}/content`}
			variant="outline"
		>
			Cancel
		</Button>
	</div>

	{#if form?.error}
		<Card.Root class="border-destructive">
			<Card.Content class="pt-6">
				<p class="text-sm text-destructive">{form.error}</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<form
		method="POST"
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
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Content Type -->
					<div class="space-y-2">
						<Label for="type">Type *</Label>
						<Input
							id="type"
							name="type"
							placeholder="e.g., post, page, project"
							required
						/>
					</div>

					<!-- Title -->
					<div class="space-y-2">
						<Label for="title">Title *</Label>
						<Input
							id="title"
							name="title"
							placeholder="Enter title"
							required
						/>
					</div>

					<!-- Slug -->
					<div class="space-y-2">
						<Label for="slug">Slug (optional)</Label>
						<Input
							id="slug"
							name="slug"
							placeholder="auto-generated-from-title"
						/>
						<p class="text-xs text-muted-foreground">Leave empty to auto-generate from title</p>
					</div>

					<!-- Excerpt -->
					<div class="space-y-2">
						<Label for="excerpt">Excerpt</Label>
						<Textarea
							id="excerpt"
							name="excerpt"
							placeholder="Short summary or description"
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
							placeholder="Write your content here..."
							rows={15}
							required
						/>
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
					{#if selectedStatus === 'published'}
						<div class="space-y-2">
							<Label for="published_at">Publish Date (optional)</Label>
							<Input
								id="published_at"
								name="published_at"
								type="datetime-local"
							/>
							<p class="text-xs text-muted-foreground">Leave empty to use current date/time</p>
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
											name="tags"
											value={tag.id}
											checked={selectedTags.includes(tag.id)}
											onCheckedChange={(checked) => {
												if (checked) {
													selectedTags = [...selectedTags, tag.id];
												} else {
													selectedTags = selectedTags.filter((id) => id !== tag.id);
												}
											}}
										/>
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
										onclick={() => removeExternalLink(index)}
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
										bind:value={customMetaEntries[index].key}
										placeholder="Key"
										class="w-1/3"
									/>
									<Input
										name="meta_custom_values"
										bind:value={customMetaEntries[index].value}
										placeholder="Value"
									/>
									<Button
										type="button"
										variant="destructive"
										size="icon"
										onclick={() => removeCustomMetaEntry(index)}
									>
										×
									</Button>
								</div>
							{/each}
						{:else}
							<p class="text-sm text-muted-foreground">No custom fields added</p>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<div class="flex justify-end gap-4">
				<Button
					type="button"
					variant="outline"
					href={`/portals/cms/${data.tenant.public_slug}/content`}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Creating...' : 'Create Content'}
				</Button>
			</div>
		</div>
	</form>
</div>

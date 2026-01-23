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

	export let data: PageData;
	export let form: ActionData;

	let selectedType = 'post';
	let selectedStatus = 'draft';
	let selectedTags: number[] = [];
	let isSubmitting = false;
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
		<Button href={`/portals/cms/${data.tenant.public_slug}/content`} variant="outline">
			Cancel
		</Button>
	</div>

	{#if form?.error}
		<Card.Root class="border-destructive">
			<Card.Content class="pt-6">
				<p class="text-destructive text-sm">{form.error}</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<form method="POST" use:enhance={() => {
		isSubmitting = true;
		return async ({ update }) => {
			await update();
			isSubmitting = false;
		};
	}}>
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>Basic Information</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Content Type -->
					<div class="space-y-2">
						<Label for="type">Content Type *</Label>
						<select
							id="type"
							name="type"
							bind:value={selectedType}
							required
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="post">Blog Post</option>
							<option value="page">Page</option>
							<option value="project">Project</option>
						</select>
					</div>

					<!-- Title -->
					<div class="space-y-2">
						<Label for="title">Title *</Label>
						<Input id="title" name="title" placeholder="Enter title" required />
					</div>

					<!-- Slug -->
					<div class="space-y-2">
						<Label for="slug">Slug (optional)</Label>
						<Input
							id="slug"
							name="slug"
							placeholder="auto-generated-from-title"
						/>
						<p class="text-xs text-muted-foreground">
							Leave empty to auto-generate from title
						</p>
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
							<p class="text-xs text-muted-foreground">
								Leave empty to use current date/time
							</p>
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
											class="text-sm font-normal cursor-pointer"
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

			<div class="flex justify-end gap-4">
				<Button
					type="button"
					variant="outline"
					href={`/portals/cms/${data.tenant.public_slug}/content`}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Creating...' : 'Create Content'}
				</Button>
			</div>
		</div>
	</form>
</div>

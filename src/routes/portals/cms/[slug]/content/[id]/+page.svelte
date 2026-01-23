<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let selectedStatus = data.content.status;
	let selectedTags: number[] = data.content.tags?.map((t) => t.id) || [];
	let isSubmitting = false;
	let showDeleteConfirm = false;

	// Format datetime for input
	function formatDatetimeLocal(dateString: string | undefined): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toISOString().slice(0, 16);
	}
</script>

<svelte:head>
	<title>Edit: {data.content.title} - {data.tenant.name}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Edit Content</h2>
			<p class="text-muted-foreground">{data.content.title}</p>
		</div>
		<div class="flex gap-2">
			<Button href={`/portals/cms/${data.tenant.public_slug}/content`} variant="outline">
				Back to List
			</Button>
		</div>
	</div>

	{#if form?.success}
		<Card.Root class="border-green-500">
			<Card.Content class="pt-6">
				<p class="text-green-600 text-sm">Content updated successfully!</p>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if form?.error}
		<Card.Root class="border-destructive">
			<Card.Content class="pt-6">
				<p class="text-destructive text-sm">{form.error}</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<form method="POST" action="?/update" use:enhance={() => {
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
					<div class="flex gap-2">
						<Badge variant="outline">{data.content.type}</Badge>
						<Badge>{data.content.status}</Badge>
					</div>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Title -->
					<div class="space-y-2">
						<Label for="title">Title *</Label>
						<Input id="title" name="title" value={data.content.title} required />
					</div>

					<!-- Slug -->
					<div class="space-y-2">
						<Label for="slug">Slug</Label>
						<Input id="slug" name="slug" value={data.content.slug} />
					</div>

					<!-- Excerpt -->
					<div class="space-y-2">
						<Label for="excerpt">Excerpt</Label>
						<Textarea
							id="excerpt"
							name="excerpt"
							value={data.content.excerpt || ''}
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
							value={data.content.body}
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
							<Label for="published_at">Publish Date</Label>
							<Input
								id="published_at"
								name="published_at"
								type="datetime-local"
								value={formatDatetimeLocal(data.content.published_at)}
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

					<!-- Metadata -->
					<div class="space-y-2">
						<Label class="text-muted-foreground">Metadata</Label>
						<div class="text-sm space-y-1">
							<p>
								<span class="font-medium">Author:</span>
								{data.content.author?.name || 'Unknown'}
							</p>
							<p>
								<span class="font-medium">Created:</span>
								{new Date(data.content.created_at).toLocaleString()}
							</p>
							<p>
								<span class="font-medium">Last Updated:</span>
								{new Date(data.content.updated_at).toLocaleString()}
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
							on:click={() => (showDeleteConfirm = true)}
						>
							Delete Content
						</Button>
					{:else}
						<div class="flex gap-2 items-center">
							<span class="text-sm text-muted-foreground">Are you sure?</span>
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
								on:click={() => (showDeleteConfirm = false)}
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
						href={`/portals/cms/${data.tenant.public_slug}/content`}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</div>
		</div>
	</form>
</div>

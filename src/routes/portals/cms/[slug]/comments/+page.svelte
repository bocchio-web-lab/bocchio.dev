<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let deletingCommentId: number | null = null;

	function updateFilter(value: string) {
		const url = new URL($page.url);
		if (value === 'all') {
			url.searchParams.delete('approved');
		} else {
			url.searchParams.set('approved', value);
		}
		url.searchParams.delete('page');
		goto(url.toString());
	}

	function changePage(newPage: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url.toString());
	}

	function getFilterValue(): string {
		if (data.filters.approved === null) return 'all';
		return data.filters.approved;
	}
</script>

<svelte:head>
	<title>Comments - {data.tenant.name}</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Comment Moderation</h2>
		<p class="text-muted-foreground">Review and manage comments on your content</p>
	</div>

	{#if form?.success}
		<Card.Root class="border-green-500">
			<Card.Content class="pt-6">
				<p class="text-green-600 text-sm">
					Comment {form.action === 'approve' ? 'approved' : form.action === 'reject' ? 'rejected' : 'deleted'} successfully!
				</p>
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

	<!-- Filter -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Filters</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="w-48">
				<Select.Root
					onSelectedChange={(v) => updateFilter(v?.value || 'all')}
					selected={{
						value: getFilterValue(),
						label:
							getFilterValue() === 'true'
								? 'Approved'
								: getFilterValue() === 'false'
									? 'Pending'
									: 'All Comments'
					}}
				>
					<Select.Trigger>
						<Select.Value placeholder="Status" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">All Comments</Select.Item>
						<Select.Item value="false">Pending</Select.Item>
						<Select.Item value="true">Approved</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Comments List -->
	<div class="space-y-4">
		{#if data.comments && data.comments.length > 0}
			{#each data.comments as comment}
				<Card.Root>
					<Card.Header>
						<div class="flex items-start justify-between">
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<span class="font-medium">{comment.author?.name || 'Unknown User'}</span>
									<Badge variant={comment.approved ? 'default' : 'secondary'}>
										{comment.approved ? 'Approved' : 'Pending'}
									</Badge>
								</div>
								<p class="text-sm text-muted-foreground">
									{comment.author?.email || 'No email'} •
									{new Date(comment.created_at).toLocaleString()}
								</p>
								{#if comment.content_item}
									<p class="text-sm text-muted-foreground">
										On: <a
											href={`/portals/cms/${data.tenant.public_slug}/content/${comment.content_item.id}`}
											class="underline hover:text-foreground"
										>
											{comment.content_item.title}
										</a>
									</p>
								{/if}
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<p class="text-sm whitespace-pre-wrap">{comment.body}</p>
					</Card.Content>
					<Card.Footer class="flex gap-2">
						{#if !comment.approved}
							<form method="POST" action="?/approve" use:enhance>
								<input type="hidden" name="comment_id" value={comment.id} />
								<Button type="submit" size="sm" variant="default">Approve</Button>
							</form>
						{:else}
							<form method="POST" action="?/reject" use:enhance>
								<input type="hidden" name="comment_id" value={comment.id} />
								<Button type="submit" size="sm" variant="outline">Unapprove</Button>
							</form>
						{/if}

						{#if deletingCommentId === comment.id}
							<form method="POST" action="?/delete" use:enhance class="flex gap-2">
								<input type="hidden" name="comment_id" value={comment.id} />
								<span class="text-sm text-muted-foreground self-center">Are you sure?</span>
								<Button type="submit" size="sm" variant="destructive">Yes, Delete</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									on:click={() => (deletingCommentId = null)}
								>
									Cancel
								</Button>
							</form>
						{:else}
							<Button
								size="sm"
								variant="destructive"
								on:click={() => (deletingCommentId = comment.id)}
							>
								Delete
							</Button>
						{/if}
					</Card.Footer>
				</Card.Root>
			{/each}

			<!-- Pagination -->
			{#if data.pagination.lastPage > 1}
				<Card.Root>
					<Card.Content class="pt-6">
						<div class="flex items-center justify-between">
							<div class="text-sm text-muted-foreground">
								Page {data.pagination.currentPage} of {data.pagination.lastPage}
								<span class="ml-2">({data.pagination.total} total)</span>
							</div>
							<div class="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={data.pagination.currentPage === 1}
									on:click={() => changePage(data.pagination.currentPage - 1)}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={data.pagination.currentPage >= data.pagination.lastPage}
									on:click={() => changePage(data.pagination.currentPage + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		{:else}
			<Card.Root>
				<Card.Content class="pt-12 pb-12 text-center">
					<p class="text-muted-foreground">No comments found</p>
					<p class="text-sm text-muted-foreground mt-2">
						Comments will appear here when users interact with your content
					</p>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>

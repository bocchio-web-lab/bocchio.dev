<script lang="ts">
	import { page } from '$app/stores';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import IconRunningMan from '$lib/components/atomic/icon-running-man.svelte';
	import { LogIn, SunMoonIcon, UserPlus, Cloud, LogOut, User } from '@lucide/svelte';
	import { toggleMode } from 'mode-watcher';

	let user = $derived($page.data.user);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<IconRunningMan className="h-9 sm:h-14" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<!-- User Label -->
			<DropdownMenu.Label>
				{!!user ? user.name : 'Guest'}
			</DropdownMenu.Label>

			<DropdownMenu.Separator />

			<!-- Appearance Section -->
			<DropdownMenu.Item
				onclick={() => {
					toggleMode();
				}}
				class="flex w-full cursor-pointer items-center"
			>
				<SunMoonIcon class="mr-2 h-4 w-4" />
				Toggle Theme
			</DropdownMenu.Item>

			<!-- <DropdownMenu.Item onclick={() => setMode('light')}>Light</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => setMode('dark')}>Dark</DropdownMenu.Item>
			<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
				<SunMoonIcon class="mr-2 h-4 w-4" />
				Toggle Theme
			</DropdownMenu.Trigger> -->

			<!-- Authenticated User -->
			{#if !!user}
				<DropdownMenu.Separator />

				<!-- Navigation -->
				<DropdownMenu.Item
					href="/user/profile"
					class="flex w-full cursor-pointer items-center"
				>
					<User class="mr-2 h-4 w-4" />
					Profile
				</DropdownMenu.Item>

				<DropdownMenu.Item
					href="/user/dashboard"
					class="flex w-full cursor-pointer items-center"
				>
					<Cloud class="mr-2 h-4 w-4" />
					Dashboard
				</DropdownMenu.Item>

				<DropdownMenu.Separator />

				<!-- Logout -->
				<DropdownMenu.Item>
					<form
						action="/auth/logout"
						method="POST"
						class="flex w-full cursor-pointer items-center"
					>
						<LogOut class="mr-2 h-4 w-4" />
						<button
							type="submit"
							class="w-full text-left">Log out</button
						>
					</form>
				</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Separator />

				<!-- Login / Register -->
				<DropdownMenu.Item
					href="/auth/login"
					class="flex w-full cursor-pointer items-center"
				>
					<LogIn class="mr-2 h-4 w-4" />
					Login
				</DropdownMenu.Item>

				<DropdownMenu.Item
					href="/auth/register"
					class="flex w-full cursor-pointer items-center"
				>
					<UserPlus class="mr-2 h-4 w-4" />
					Register
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

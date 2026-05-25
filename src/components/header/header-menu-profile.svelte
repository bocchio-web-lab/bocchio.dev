<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import * as DropdownMenu from "$components/ui/dropdown-menu";
    import IconRunningMan from "$components/icons/icon-running-man.svelte";
    import {
        LogIn,
        SunMoonIcon,
        UserPlus,
        Cloud,
        LogOut,
        User,
    } from "@lucide/svelte";
    import { toggleMode } from "mode-watcher";

    let user = $derived(page.data.user);
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger class="cursor-pointer" aria-label="Open profile menu">
        <IconRunningMan className="h-9 sm:h-14" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
        <DropdownMenu.Group>
            <!-- User Label -->
            <DropdownMenu.Label>
                {!!user ? user.name : "Guest"}
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

            <!-- Authenticated User -->
            {#if !!user}
                <DropdownMenu.Separator />

                <!-- Navigation -->
                <DropdownMenu.Item
                    onclick={() => goto("/user/profile")}
                    class="flex w-full cursor-pointer items-center"
                >
                    <User class="mr-2 h-4 w-4" />
                    Profile
                </DropdownMenu.Item>

                <DropdownMenu.Item
                    onclick={() => goto("/user/dashboard")}
                    class="flex w-full cursor-pointer items-center"
                >
                    <Cloud class="mr-2 h-4 w-4" />
                    Dashboard
                </DropdownMenu.Item>

                <DropdownMenu.Separator />

                <!-- Logout -->
                <DropdownMenu.Item class="cursor-pointer">
                    <form
                        action="/auth/logout"
                        method="POST"
                        class="flex w-full items-center"
                    >
                        <LogOut class="mr-2 h-4 w-4" />
                        <button
                            type="submit"
                            class="w-full cursor-pointer text-left"
                            >Log out</button
                        >
                    </form>
                </DropdownMenu.Item>
            {:else}
                <DropdownMenu.Separator />

                <!-- Login / Register -->
                <DropdownMenu.Item
                    onclick={() => goto("/auth/login")}
                    class="flex w-full cursor-pointer items-center"
                >
                    <LogIn class="mr-2 h-4 w-4" />
                    Login
                </DropdownMenu.Item>

                <DropdownMenu.Item
                    onclick={() => goto("/auth/register")}
                    class="flex w-full cursor-pointer items-center"
                >
                    <UserPlus class="mr-2 h-4 w-4" />
                    Register
                </DropdownMenu.Item>
            {/if}
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>

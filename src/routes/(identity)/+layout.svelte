<script lang="ts">
    import { page } from "$app/state";
    import { dev } from "$app/environment";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    // Debug: List of hrefs to show in the header for testing purposes
    const pathname = $derived(page.url.pathname);
    const hrefs: string[] = [
        "/auth/forgot-password",
        "/auth/login",
        "/auth/register",
        "/auth/reset-password",
        "/user/profile",
        "/user/update-password",
        "/user/verify-email",
    ];
</script>

{#if dev && hrefs.length > 0}
    <header class="border-b">
        <nav class="m-auto flex h-16 w-full items-center justify-center px-4">
            <ul class="flex items-center gap-4">
                {#each hrefs as href}
                    <li>
                        <a
                            {href}
                            class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
                            class:text-primary={pathname.startsWith(href)}
                            class:bg-muted={pathname.startsWith(href)}
                        >
                            {href.split("/").slice(-1)[0].replace(/-/g, " ")}
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>
    </header>
{/if}

<main
    class="m-auto flex h-max w-full flex-col items-center justify-center px-4 py-8 [&>div]:w-full [&>div]:max-w-sm"
>
    {@render children?.()}
</main>

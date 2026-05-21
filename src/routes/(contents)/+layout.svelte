<script lang="ts">
    import { page } from "$app/state";
    import Header from "$components/header/header.svelte";
    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    let isHome = $derived(page.url.pathname === "/");
</script>

<Header />

{#if !isHome}
    <div class="flex w-full items-center justify-center p-4 md:p-8">
        <p
            class="font-['Bungee_Shade'] text-2xl text-primary text-center sm:text-4xl"
        >
            Hands-on Innovation!
            <!-- Get Things Done! -->
        </p>
    </div>
{/if}

<main
    class="m-auto mt-8 mb-16 w-full max-w-(--breakpoint-xl) px-4 sm:px-6 lg:px-8"
>
    {@render children?.()}
</main>

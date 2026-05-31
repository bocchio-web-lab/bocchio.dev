<script lang="ts">
    import { page } from "$app/state";
    import { Button } from "$components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$components/ui/card";
    import { House, RefreshCw } from "@lucide/svelte";

    let status = $derived(page.status);
    let message = $derived(
        page.error?.message || "An unexpected error occurred",
    );
</script>

<main
    class="m-auto flex h-max w-full flex-col items-center justify-center px-4 py-8"
>
    <Card class="w-full max-w-md">
        <CardHeader>
            <CardTitle class="text-center text-6xl font-bold"
                >{status}</CardTitle
            >
            <CardDescription class="text-center text-lg">
                {#if status === 404}
                    Page Not Found
                {:else if status === 403}
                    Access Forbidden
                {:else if status === 500}
                    Server Error
                {:else}
                    Error
                {/if}
            </CardDescription>
        </CardHeader>
        <!-- <CardContent>
            <p class="text-center text-muted-foreground">{message}</p>
        </CardContent> -->
        <CardFooter class="flex justify-center gap-2">
            <Button variant="outline" href="/">
                <House class="mr-2 h-4 w-4" />
                Go Home
            </Button>
            <Button variant="default" onclick={() => window.location.reload()}>
                <RefreshCw class="mr-2 h-4 w-4" />
                Retry
            </Button>
        </CardFooter>
    </Card>
</main>

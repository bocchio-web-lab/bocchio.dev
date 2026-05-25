<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData, ActionData } from "./$types";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();

    let isSubmitting = $state(false);

    let urlError = $derived(page.url.searchParams.get("error"));
    let urlSent = $derived(page.url.searchParams.get("sent"));
</script>

<svelte:head>
    <title>Verify Email</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title>Verify Your Email Address</Card.Title>
        <Card.Description>
            A verification link was sent to your email address during
            registration.
        </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
        {#if urlError === "invalid"}
            <div
                class="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
            >
                Invalid verification link. Please request a new one.
            </div>
        {:else if urlError === "failed"}
            <div
                class="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
            >
                Email verification failed. Please try again or request a new
                link.
            </div>
        {:else if urlError}
            <div
                class="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
            >
                {decodeURIComponent(urlError)}
            </div>
        {/if}

        {#if urlSent === "1"}
            <div
                class="rounded-md border border-green-500 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
            >
                Verification email sent! Check your inbox.
            </div>
        {:else if form?.error}
            <div
                class="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
            >
                {form.error}
            </div>
        {/if}

        <div class="rounded-md border bg-muted/50 p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-medium text-sm">Your Email</p>
                    <p class="text-sm text-muted-foreground">
                        {data.user?.email}
                    </p>
                </div>
                <Badge variant="destructive">Unverified</Badge>
            </div>
        </div>
        <div class="space-y-2 text-sm text-muted-foreground">
            <p>If you didn't receive the email, you can request a new one.</p>
        </div>
    </Card.Content>
    <Card.Footer class="m-auto">
        <form
            method="POST"
            action="?/resend"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                    await update();
                    isSubmitting = false;
                };
            }}
        >
            <Button
                type="submit"
                class="w-full"
                size="lg"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Sending..." : "Resend Verification Email"}
            </Button>
        </form>
    </Card.Footer>
</Card.Root>

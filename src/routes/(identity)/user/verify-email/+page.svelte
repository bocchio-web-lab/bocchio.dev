<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import type { PageData, ActionData } from "./$types";
    import { Field, FieldDescription, FieldGroup } from "$components/ui/field";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { form }: Props = $props();

    let isSubmitting = $state(false);

    let urlError = $derived(page.url.searchParams.get("error"));
    let urlSent = $derived(page.url.searchParams.get("sent"));
</script>

<svelte:head>
    <title>Verify Email</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title class="text-2xl">Verify Your Email Address</Card.Title>
        <Card.Description>
            A verification link was sent to your email address during
            registration.
        </Card.Description>
        <Card.Description>
            If you didn't receive the email, you can request a new one.
        </Card.Description>
    </Card.Header>
    <Card.Content>
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
            <FieldGroup>
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
                        Email verification failed. Please try again or request a
                        new link.
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

                <Field>
                    <Button
                        type="submit"
                        class="w-full"
                        size="lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Sending..."
                            : "Resend Verification Email"}
                    </Button>
                    <FieldDescription class="text-center">
                        <a href="/user/profile"> Back to User Profile </a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    </Card.Content>
</Card.Root>

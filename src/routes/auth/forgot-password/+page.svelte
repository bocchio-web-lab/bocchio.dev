<script lang="ts">
    import { enhance, applyAction } from "$app/forms";
    import { Button } from "$components/ui/button/index.js";
    import { Input } from "$components/ui/input/index.js";
    import {
        FieldGroup,
        Field,
        FieldLabel,
        FieldDescription,
    } from "$components/ui/field/index.js";
    import * as Card from "$components/ui/card/index.js";
    import type { ActionData } from "./$types";

    interface Props {
        form: ActionData;
    }

    let { form }: Props = $props();

    let isSubmitting = $state(false);
</script>

<svelte:head>
    <title>Forgot Password</title>
</svelte:head>

<Card.Root class="mx-auto max-w-sm">
    <Card.Header>
        <Card.Title>Forgot Password</Card.Title>
        <Card.Description
            >Enter your email address and we'll send you a password reset link.</Card.Description
        >
    </Card.Header>

    <Card.Content>
        <form
            method="POST"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ result }) => {
                    isSubmitting = false;
                    await applyAction(result);
                };
            }}
        >
            {#if form?.success}
                <div
                    class="mb-4 rounded-lg border border-green-500 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
                >
                    {form.message ||
                        "Password reset link sent! Check your email."}
                </div>
            {/if}

            {#if form?.error}
                <div
                    class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                    {form.error}
                </div>
            {/if}

            <FieldGroup class="grid gap-4">
                <Field class="grid gap-2">
                    <FieldLabel for="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={form?.email || ""}
                        required
                        autocomplete="email"
                        disabled={isSubmitting}
                        class={form?.errors?.email ? "border-destructive" : ""}
                    />
                    {#if form?.errors?.email}
                        <p class="text-sm text-destructive">
                            {form.errors.email[0]}
                        </p>
                    {/if}
                </Field>

                <Field class="grid gap-2">
                    <Button
                        type="submit"
                        class="w-full"
                        size="lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <FieldDescription class="text-center">
                        <a href="/auth/login">Back to Login</a>
                        <span class="mx-2">|</span>
                        <a href="/auth/register">Create Account</a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    </Card.Content>
</Card.Root>

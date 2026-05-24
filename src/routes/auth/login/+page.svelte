<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import {
        FieldGroup,
        Field,
        FieldLabel,
        FieldDescription,
    } from "$components/ui/field/index.js";
    import { enhance, applyAction } from "$app/forms";
    import { page } from "$app/state";

    import type { ActionData } from "./$types";

    interface Props {
        form: ActionData;
    }

    let { form }: Props = $props();
    let loading = $state(false);

    let resetSuccess = $derived(
        page.url.searchParams.get("reset") === "success",
    );
    let verified = $derived(page.url.searchParams.get("verified") === "1");
</script>

<svelte:head>
    <title>Login</title>
</svelte:head>

<Card.Root class="mx-auto w-full max-w-sm">
    <Card.Header>
        <Card.Title class="text-2xl">Login</Card.Title>
        <Card.Description
            >Enter your email below to login to your account</Card.Description
        >
    </Card.Header>

    <Card.Content>
        <form
            method="POST"
            use:enhance={() => {
                loading = true;
                return async ({ result }) => {
                    loading = false;
                    await applyAction(result);
                };
            }}
        >
            {#if resetSuccess}
                <div
                    class="mb-4 rounded-lg border border-green-500 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
                >
                    Password reset successful! You can now login with your new
                    password.
                </div>
            {/if}

            {#if verified}
                <div
                    class="mb-4 rounded-lg border border-green-500 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
                >
                    Email verified successfully! You can now login to your
                    account.
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
                        type="email"
                        name="email"
                        value={form?.email ?? ""}
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                        class={form?.errors?.email ? "border-destructive" : ""}
                    />
                    {#if form?.errors?.email}
                        <p class="text-sm text-destructive">
                            {form.errors.email[0]}
                        </p>
                    {/if}
                </Field>

                <Field class="grid gap-2">
                    <div class="flex items-center">
                        <FieldLabel for="password">Password</FieldLabel>
                        <a
                            href="/auth/forgot-password"
                            class="ms-auto inline-block text-sm underline"
                            tabindex="1"
                        >
                            Forgot your password?
                        </a>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        required
                        disabled={loading}
                        class={form?.errors?.password
                            ? "border-destructive"
                            : ""}
                    />
                    {#if form?.errors?.password}
                        <p class="text-sm text-destructive">
                            {form.errors.password[0]}
                        </p>
                    {/if}
                </Field>

                <Field class="grid gap-2">
                    <Button
                        type="submit"
                        class="w-full"
                        size="lg"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                    <FieldDescription class="text-center">
                        Don't have an account? <a href="/auth/register"
                            >Sign up</a
                        >
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    </Card.Content>
</Card.Root>

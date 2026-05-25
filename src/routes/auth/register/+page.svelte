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
    import type { ActionData } from "./$types";

    interface Props {
        form: ActionData;
    }

    let { form }: Props = $props();

    let loading = $state(false);
</script>

<svelte:head>
    <title>Register</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title class="text-xl">Sign Up</Card.Title>
        <Card.Description
            >Enter your information to create an account</Card.Description
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
            {#if form?.error}
                <div
                    class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                    {form.error}
                </div>
            {/if}

            <FieldGroup class="grid gap-4">
                <Field class="grid gap-2">
                    <FieldLabel for="name">Full Name</FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        value={form?.name ?? ""}
                        placeholder="John Doe"
                        required
                        disabled={loading}
                        class={form?.errors?.name ? "border-destructive" : ""}
                    />
                    {#if form?.errors?.name}
                        <p class="text-sm text-destructive">
                            {form.errors.name[0]}
                        </p>
                    {/if}
                </Field>

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
                    <FieldLabel for="password">Password</FieldLabel>
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
                    <FieldLabel for="password_confirmation">
                        Confirm Password
                    </FieldLabel>
                    <Input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        required
                        disabled={loading}
                    />
                </Field>

                <Field class="grid gap-2">
                    <Button
                        type="submit"
                        class="w-full"
                        size="lg"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create an account"}
                    </Button>
                    <FieldDescription class="text-center">
                        Already have an account? <a href="/auth/login">
                            Sign in
                        </a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    </Card.Content>
</Card.Root>

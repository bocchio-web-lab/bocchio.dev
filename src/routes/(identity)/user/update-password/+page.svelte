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
    <title>Update Password</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title class="text-2xl">Update Password</Card.Title>
        <Card.Description>Enter your new password below.</Card.Description>
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
            {#if form?.error}
                <div
                    class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                    {form.error}
                </div>
            {/if}

            <FieldGroup>
                <Field>
                    <FieldLabel for="current_password"
                        >Current Password</FieldLabel
                    >
                    <Input
                        id="current_password"
                        name="current_password"
                        type="password"
                        required
                        autocomplete="current-password"
                        disabled={isSubmitting}
                        class={form?.errors?.current_password
                            ? "border-destructive"
                            : ""}
                    />
                    {#if form?.errors?.current_password}
                        <p class="text-sm text-destructive">
                            {form.errors.current_password[0]}
                        </p>
                    {/if}
                </Field>

                <Field>
                    <FieldLabel for="password">New Password</FieldLabel>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autocomplete="new-password"
                        disabled={isSubmitting}
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

                <Field>
                    <FieldLabel for="password_confirmation">
                        Confirm Password
                    </FieldLabel>
                    <Input
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        required
                        autocomplete="new-password"
                        disabled={isSubmitting}
                        class={form?.errors?.password_confirmation
                            ? "border-destructive"
                            : ""}
                    />
                    {#if form?.errors?.password_confirmation}
                        <p class="text-sm text-destructive">
                            {form.errors.password_confirmation[0]}
                        </p>
                    {/if}
                </Field>

                <Field>
                    <Button
                        type="submit"
                        class="w-full"
                        size="lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                    <FieldDescription class="text-center">
                        <a href="/user/profile">Back to User Profile</a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    </Card.Content>
</Card.Root>

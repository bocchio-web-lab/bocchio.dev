<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import {
        FieldGroup,
        Field,
        FieldLabel,
        FieldDescription,
    } from "$components/ui/field/index.js";
    import { Input } from "$components/ui/input/index.js";
    import type { PageData, ActionData } from "./$types";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();
</script>

<svelte:head>
    <title>User Profile</title>
</svelte:head>

<Card.Root>
    <Card.Header>
        <Card.Title class="text-2xl">My Profile</Card.Title>
        <Card.Description>
            Manage your profile information and settings.
        </Card.Description>
    </Card.Header>

    <Card.Content>
        {#if form?.error}
            <div
                class="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
                {form.error}
            </div>
        {/if}

        <form method="POST" action="?/updateProfile" id="profile-update-form">
            <FieldGroup>
                <Field>
                    <FieldLabel for="name">Name</FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        value={form?.name ?? data.user!.name}
                        autocomplete="name"
                        required
                    />
                    {#if form?.errors?.name}
                        <p class="text-sm text-destructive">
                            {form.errors.name[0]}
                        </p>
                    {/if}
                </Field>

                <Field>
                    <FieldLabel for="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form?.email ?? data.user!.email}
                        autocomplete="email"
                        required
                    />
                    {#if form?.errors?.email}
                        <p class="text-sm text-destructive">
                            {form.errors.email[0]}
                        </p>
                    {/if}
                </Field>

                <Field>
                    <div class="flex items-center">
                        <FieldLabel for="password">Password</FieldLabel>
                        <!-- svelte-ignore a11y_positive_tabindex -->
                        <a
                            href="/user/update-password"
                            class="ms-auto inline-block text-sm underline"
                            tabindex="1"
                        >
                            Update password
                        </a>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value="********"
                        disabled
                        class="bg-muted"
                    />
                </Field>

                <Field class="gap-1">
                    <div class="flex items-center">
                        <FieldLabel>Email Verification</FieldLabel>
                        <!-- svelte-ignore a11y_positive_tabindex -->
                        <a
                            href="/user/verify-email"
                            class="ms-auto inline-block text-sm underline"
                            tabindex="1"
                        >
                            Verify email
                        </a>
                    </div>
                    <div class="flex items-center gap-2">
                        {#if data.user?.email_verified_at}
                            <Badge>Verified</Badge>
                            <span class="text-sm text-muted-foreground">
                                on {new Date(
                                    data.user.email_verified_at,
                                ).toLocaleDateString()}
                            </span>
                        {:else}
                            <Badge variant="destructive">Not verified</Badge>
                        {/if}
                    </div>
                </Field>

                <Field class="gap-1">
                    <FieldLabel>Member since</FieldLabel>
                    <p class="text-sm text-muted-foreground">
                        {data.user!.created_at
                            ? new Date(
                                  data.user!.created_at,
                              ).toLocaleDateString()
                            : "Unknown"}
                    </p>
                </Field>

                <Field>
                    <Button type="submit" class="w-full" size="lg">
                        Save changes
                    </Button>
                    <FieldDescription class="text-center">
                        <a href="/">Back to Home</a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    </Card.Content>
</Card.Root>

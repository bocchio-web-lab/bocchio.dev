<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import * as Select from "$components/ui/select/index.js";
    import { Textarea } from "$components/ui/textarea/index.js";
    import { Checkbox } from "$components/ui/checkbox/index.js";

    import type { PageData, ActionData } from "./$types";
    import { accessLevelOptions } from "$lib/utils/app";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();

    let tenantName = $state("");
    let selectedAccessLevel = $state(accessLevelOptions[0].value);
    let regenerateApiKey = $state(false);
    let settingsText = $state("{ }");
    let showDeleteConfirm = $state(false);
    let isSubmitting = $state(false);

    $effect(() => {
        tenantName = data.tenant.name;
        selectedAccessLevel = data.tenant.access_level;
        settingsText = data.tenant.settings
            ? JSON.stringify(data.tenant.settings, null, 2)
            : "{ }";
    });
</script>

<svelte:head>
    <title>Manage Tenant</title>
</svelte:head>

<div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
    <div>
        <h1 class="text-3xl font-bold tracking-tight">Manage Tenant</h1>
        <p class="text-muted-foreground">
            Update tenant details and configure access settings for
            <strong>
                {data.tenant.name}
            </strong>.
        </p>
    </div>

    <Button href="/dashboard" variant="outline">Back to dashboard</Button>
</div>

{#if form?.error}
    <Card.Root class="border-destructive">
        <Card.Content class="pt-6 text-sm text-destructive">
            {form.error}
        </Card.Content>
    </Card.Root>
{/if}

<form
    id="update-tenant-form"
    method="POST"
    action="?/updateTenant"
    class="space-y-6"
    onsubmit={() => (isSubmitting = true)}
>
    <Card.Root>
        <Card.Header>
            <Card.Title>Tenant details</Card.Title>
            <Card.Description>
                Update the tenant name, settings, and access level. Changes to
                the access level may affect who can access this tenant, so
                please review your settings carefully before saving.
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
            <div class="space-y-2">
                <Label for="name">Tenant name</Label>
                <Input id="name" name="name" bind:value={tenantName} required />
            </div>

            <div class="space-y-2">
                <Label>Public slug (read-only)</Label>
                <Input value={data.tenant.public_slug} readonly disabled />
            </div>

            <div class="space-y-2">
                <Label for="service">Service (read-only)</Label>
                <Input
                    id="service"
                    name="service"
                    value={data.service?.name ?? "Unknown"}
                    readonly
                    disabled
                />
            </div>

            <div class="space-y-2">
                <Label for="settings">Settings JSON</Label>
                <Textarea
                    id="settings"
                    name="settings"
                    bind:value={settingsText}
                    rows={10}
                    spellcheck={false}
                />
                <p class="text-xs text-muted-foreground">
                    Store tenant settings as JSON. Leave <code>{`{}`}</code>
                    if you do not need custom settings.
                </p>
            </div>

            <div class="space-y-2">
                <Label>Timestamps</Label>
                <p class="text-muted-foreground">
                    Created:
                    {data.tenant.created_at
                        ? new Date(data.tenant.created_at).toLocaleString()
                        : "Unknown"}
                </p>

                <p class="text-muted-foreground">
                    Updated:
                    {data.tenant.updated_at
                        ? new Date(data.tenant.updated_at).toLocaleString()
                        : "Unknown"}
                </p>
            </div>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>Tenant Access</Card.Title>
            <Card.Description>
                Manage tenant access settings and your public API key. Public
                Tenants are accessible to everyone, Private Tenants are only
                accessible to you, and Token Protected Tenants require a token
                for access.
            </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
            <div class="space-y-2">
                <Label for="access_level">Access level</Label>
                <Select.Root
                    type="single"
                    name="access_level"
                    bind:value={selectedAccessLevel}
                >
                    <Select.Trigger class="w-full">
                        {accessLevelOptions.find(
                            (o) => o.value === selectedAccessLevel,
                        )?.label}
                    </Select.Trigger>
                    <Select.Content>
                        {#each accessLevelOptions as option}
                            <Select.Item
                                value={option.value}
                                label={option.label}
                            >
                                {option.label}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <div class="space-y-2">
                <Label>Public API key (read-only)</Label>
                <Input value={data.tenant.public_api_key ?? ""} readonly />
            </div>

            <div class="space-y-3">
                <Label>API key regeneration</Label>
                <div class="flex items-center gap-2">
                    <Checkbox
                        id="regenerate_api_key"
                        name="regenerate_api_key"
                        bind:checked={regenerateApiKey}
                    />
                    <Label
                        for="regenerate_api_key"
                        class="cursor-pointer font-normal"
                    >
                        Regenerate public API key on save
                    </Label>
                </div>
            </div>
        </Card.Content>
    </Card.Root>
</form>

<form
    id="delete-tenant-form"
    method="POST"
    action="?/deleteTenant"
    class="hidden"
></form>

<div class="flex justify-between">
    {#if data.user?.id === data.tenant.owner_id}
        <div>
            {#if !showDeleteConfirm}
                <Button
                    type="button"
                    variant="destructive"
                    onclick={() => (showDeleteConfirm = true)}
                >
                    Delete Tenant
                </Button>
            {:else}
                <div class="flex items-center gap-2">
                    <span class="text-sm text-muted-foreground">
                        Are you sure?
                    </span>
                    <Button
                        type="submit"
                        variant="destructive"
                        onclick={() => {
                            const form = document.getElementById(
                                "delete-tenant-form",
                            ) as HTMLFormElement | null;
                            form?.submit();
                        }}
                    >
                        Yes, Delete
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onclick={() => (showDeleteConfirm = false)}
                    >
                        Cancel
                    </Button>
                </div>
            {/if}
        </div>
    {/if}

    <div class="flex gap-4">
        <Button type="button" variant="outline" href="/dashboard">
            Cancel
        </Button>
        <Button
            type="submit"
            disabled={isSubmitting}
            onclick={() => {
                const form = document.getElementById(
                    "update-tenant-form",
                ) as HTMLFormElement | null;
                form?.submit();
            }}
        >
            {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
    </div>
</div>

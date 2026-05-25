<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import * as Select from "$components/ui/select/index.js";
    import { Textarea } from "$components/ui/textarea/index.js";
    import { Checkbox } from "$components/ui/checkbox/index.js";
    import { Badge } from "$components/ui/badge/index.js";

    import type { PageData, ActionData } from "./$types";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();

    let tenantName = $state("");
    let selectedAccessLevel = $state("public");
    let regenerateApiKey = $state(false);
    let settingsText = $state("{}");
    let showDeleteConfirm = $state(false);
    let isSubmitting = $state(false);

    $effect(() => {
        tenantName = data.tenant.name;
        selectedAccessLevel = data.tenant.access_level;
        settingsText = data.tenant.settings
            ? JSON.stringify(data.tenant.settings, null, 2)
            : "{}";
    });

    function getPortalLink() {
        if (data.service?.slug === "cms") {
            return `/portals/cms/${data.tenant.id}`;
        }

        if (data.service?.slug === "ptm") {
            return `/portals/ptm/${data.tenant.id}`;
        }

        return null;
    }
</script>

<svelte:head>
    <title>Manage Tenant</title>
</svelte:head>

<div class="flex flex-col gap-6 py-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Manage Tenant</h1>
            <p class="text-muted-foreground">{data.tenant.name}</p>
        </div>

        <div class="flex gap-2">
            <Button href="/user/dashboard" variant="outline"
                >Back to dashboard</Button
            >
            {#if getPortalLink()}
                <Button href={getPortalLink() as string} variant="outline"
                    >Open portal</Button
                >
            {/if}
        </div>
    </div>

    {#if form?.error}
        <Card.Root class="border-destructive">
            <Card.Content class="pt-6 text-sm text-destructive">
                {form.error}
            </Card.Content>
        </Card.Root>
    {/if}

    <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card.Root>
            <Card.Header>
                <Card.Title>Tenant details</Card.Title>
                <Card.Description>
                    Update the tenant name, access level, settings, or
                    regenerate the public API key.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <form
                    method="POST"
                    action="?/updateTenant"
                    class="space-y-6"
                    onsubmit={() => (isSubmitting = true)}
                >
                    <div class="space-y-2">
                        <Label for="name">Tenant name</Label>
                        <Input
                            id="name"
                            name="name"
                            bind:value={tenantName}
                            required
                        />
                    </div>

                    <div class="space-y-2">
                        <Label>Service</Label>
                        <div class="flex flex-wrap items-center gap-2">
                            <Badge variant="outline"
                                >{data.service?.name ?? "Unknown"}</Badge
                            >
                            <Badge
                                variant={data.tenant.access_level === "public"
                                    ? "default"
                                    : data.tenant.access_level === "private"
                                      ? "destructive"
                                      : "secondary"}
                            >
                                {data.tenant.access_level}
                            </Badge>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label for="access_level">Access level</Label>
                        <Select.Root
                            type="single"
                            name="access_level"
                            bind:value={selectedAccessLevel}
                        >
                            <Select.Trigger class="w-full">
                                {selectedAccessLevel === "public"
                                    ? "Public"
                                    : selectedAccessLevel === "private"
                                      ? "Private"
                                      : "Token Protected"}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="public" label="Public"
                                    >Public</Select.Item
                                >
                                <Select.Item value="private" label="Private"
                                    >Private</Select.Item
                                >
                                <Select.Item
                                    value="token_protected"
                                    label="Token Protected"
                                >
                                    Token Protected
                                </Select.Item>
                            </Select.Content>
                        </Select.Root>
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
                            Store tenant settings as JSON. Leave <code
                                >{`{}`}</code
                            > if you do not need custom settings.
                        </p>
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

                    <div class="flex justify-between">
                        {#if data.user?.id === data.tenant.owner_id}
                            <div>
                                {#if !showDeleteConfirm}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onclick={() =>
                                            (showDeleteConfirm = true)}
                                    >
                                        Delete Tenant
                                    </Button>
                                {:else}
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="text-sm text-muted-foreground"
                                            >Are you sure?</span
                                        >
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onclick={() =>
                                                (
                                                    document.getElementById(
                                                        "delete-tenant-form",
                                                    ) as HTMLFormElement | null
                                                )?.submit()}>Yes, Delete</Button
                                        >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onclick={() =>
                                                (showDeleteConfirm = false)}
                                            >Cancel</Button
                                        >
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <div class="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                href="/user/dashboard">Cancel</Button
                            >
                            <Button type="submit" disabled={isSubmitting}
                                >{isSubmitting
                                    ? "Saving..."
                                    : "Save changes"}</Button
                            >
                        </div>
                    </div>
                </form>

                <form
                    id="delete-tenant-form"
                    method="POST"
                    action="?/deleteTenant"
                    class="hidden"
                ></form>
            </Card.Content>
        </Card.Root>

        <div class="space-y-6">
            <Card.Root>
                <Card.Header>
                    <Card.Title>Portal</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <p class="text-sm text-muted-foreground">
                        {#if data.service?.slug === "cms"}
                            This tenant opens the CMS portal.
                        {:else if data.service?.slug === "ptm"}
                            This tenant opens the PTM portal.
                        {:else}
                            Portal link will be available once the service
                            mapping is provided.
                        {/if}
                    </p>

                    {#if getPortalLink()}
                        <Button
                            href={getPortalLink() as string}
                            variant="outline"
                            class="w-full"
                        >
                            Open portal
                        </Button>
                    {/if}
                </Card.Content>
            </Card.Root>

            <Card.Root>
                <Card.Header>
                    <Card.Title>Access data</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-4">
                    <div class="space-y-2">
                        <Label>Public slug</Label>
                        <Input value={data.tenant.public_slug} readonly />
                    </div>

                    <div class="space-y-2">
                        <Label>Public API key</Label>
                        <Textarea
                            value={data.tenant.public_api_key ?? ""}
                            readonly
                            rows={4}
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p class="text-muted-foreground">Created</p>
                            <p>
                                {data.tenant.created_at
                                    ? new Date(
                                          data.tenant.created_at,
                                      ).toLocaleString()
                                    : "Unknown"}
                            </p>
                        </div>
                        <div>
                            <p class="text-muted-foreground">Updated</p>
                            <p>
                                {data.tenant.updated_at
                                    ? new Date(
                                          data.tenant.updated_at,
                                      ).toLocaleString()
                                    : "Unknown"}
                            </p>
                        </div>
                    </div>
                </Card.Content>
            </Card.Root>
        </div>
    </div>
</div>

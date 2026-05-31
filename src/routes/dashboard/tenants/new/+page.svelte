<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import * as Select from "$components/ui/select/index.js";
    import { accessLevelOptions } from "$lib/utils/app";
    import { onMount } from "svelte";

    import type { PageData, ActionData } from "./$types";
    import { page } from "$app/state";

    interface Props {
        data: PageData;
        form: ActionData;
    }

    let { data, form }: Props = $props();

    let selectedServiceId = $state("0");
    let selectedAccessLevel = $state("private");

    onMount(() => {
        const requestedServiceId = Number(page.url.searchParams.get("service"));
        selectedServiceId = String(
            data.services.find((service) => service.id === requestedServiceId)
                ?.id ?? "",
        );
    });
</script>

<svelte:head>
    <title>Create Tenant</title>
</svelte:head>

<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <div>
        <h1 class="text-3xl font-bold tracking-tight">Create Tenant</h1>
        <p class="text-muted-foreground">
            Create a new tenant and continue to its manage page.
        </p>
    </div>
    <Button href="/dashboard" variant="outline">Back to dashboard</Button>
</div>

<Card.Root>
    <Card.Content class="space-y-6 pt-6">
        {#if form?.error}
            <div
                class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
            >
                {form.error}
            </div>
        {/if}

        {#if data.services.length > 0}
            <form method="POST" action="?/createTenant" class="space-y-6">
                <div class="space-y-2">
                    <Label for="name">Tenant name</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="My Tenant"
                        required
                    />
                </div>

                <div class="space-y-2">
                    <Label for="service_id">Service</Label>
                    <Select.Root
                        type="single"
                        name="service_id"
                        bind:value={selectedServiceId}
                    >
                        <Select.Trigger class="w-full">
                            {data.services.find(
                                (service) =>
                                    String(service.id) === selectedServiceId,
                            )?.name ?? "Select a service"}
                        </Select.Trigger>
                        <Select.Content>
                            {#each data.services as service (service.id)}
                                <Select.Item
                                    value={String(service.id)}
                                    label={service.name}
                                >
                                    {service.name}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>

                <div class="space-y-2">
                    <Label for="access_level">Access level</Label>
                    <Select.Root
                        type="single"
                        name="access_level"
                        bind:value={selectedAccessLevel}
                    >
                        <Select.Trigger class="w-full">
                            {accessLevelOptions.find(
                                (level) => level.value === selectedAccessLevel,
                            )?.label ?? "Select an access level"}
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

                <div class="flex justify-end gap-3">
                    <Button href="/dashboard" variant="outline" type="button">
                        Cancel
                    </Button>
                    <Button type="submit">Create tenant</Button>
                </div>
            </form>
        {:else}
            <p class="text-sm text-muted-foreground">
                No services are available right now.
            </p>
        {/if}
    </Card.Content>
</Card.Root>

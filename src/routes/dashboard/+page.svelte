<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";
    import {
        getAccessLevelBadgeVariant,
        getPortalLink,
        getRoleBadgeVariant,
    } from "$lib/utils/app";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<!-- Welcome Section -->
<div>
    <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
    <p class="text-muted-foreground">Welcome back, {data.user!.name}!</p>
</div>

<!-- My Tenants Section -->
<Card.Root>
    <Card.Header>
        <Card.Title>My Tenants</Card.Title>
        <Card.Description>
            Services and projects you have access to
        </Card.Description>
    </Card.Header>
    {#if data.tenants && data.tenants.length > 0}
        <Card.Content>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Name</Table.Head>
                        <Table.Head>Service</Table.Head>
                        <Table.Head>Access Level</Table.Head>
                        <Table.Head>Your Role</Table.Head>
                        <Table.Head class="text-right">Actions</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each data.tenants as tenant}
                        {@const tenantService = data.services.find(
                            (s) => s.id === tenant.service_id,
                        )}
                        {@const linkToPortal = getPortalLink(
                            tenantService,
                            tenant,
                        )}
                        {@const role =
                            tenant.owner_id === data.user?.id
                                ? "owner"
                                : tenant.pivot.role}
                        <Table.Row>
                            <Table.Cell class="font-medium">
                                {tenant.name}
                            </Table.Cell>
                            <Table.Cell>
                                <Badge variant="outline">
                                    {tenantService?.name || "Unknown"}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge
                                    variant={getAccessLevelBadgeVariant(
                                        tenant.access_level,
                                    )}
                                >
                                    {tenant.access_level}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge variant={getRoleBadgeVariant(role)}>
                                    {role}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell class="text-right">
                                <div class="flex justify-end gap-2">
                                    {#if linkToPortal}
                                        <Button
                                            href={linkToPortal}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Open Portal
                                        </Button>
                                    {/if}
                                    <Button
                                        href={`/dashboard/tenants/${tenant.id}`}
                                        size="sm"
                                    >
                                        Manage
                                    </Button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </Card.Content>
    {:else}
        <Card.Content>
            <p class="text-sm text-muted-foreground">
                You don't have access to any tenants yet. Create your first
                tenant to start using the platform services.
            </p>
        </Card.Content>
    {/if}
</Card.Root>

<!-- Available Services Section -->
<Card.Root>
    <Card.Header>
        <Card.Title>Available Services</Card.Title>
        <Card.Description>
            Platform services you can subscribe to
        </Card.Description>
    </Card.Header>
    {#if data.services && data.services.length > 0}
        <Card.Content class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each data.services as service}
                <Card.Root>
                    <Card.Header>
                        <Card.Title>
                            {service.name}
                        </Card.Title>
                        <Card.Description>
                            {service.description}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <Button
                            href={`/dashboard/tenants/new?service=${service.id}`}
                            size="sm"
                            class="w-full"
                        >
                            Create tenant
                        </Button>
                    </Card.Content>
                </Card.Root>
            {/each}
        </Card.Content>
    {:else}
        <Card.Content>
            <p class="text-sm text-muted-foreground">
                No services available at the moment.
            </p>
        </Card.Content>
    {/if}
</Card.Root>

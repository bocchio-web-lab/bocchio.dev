<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import * as Table from "$components/ui/table/index.js";
    import { Badge } from "$components/ui/badge/index.js";
    import type { PageData } from "./$types";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    function getPortalLink(tenant: any) {
        const service = data.services.find(
            (item) => item.id === tenant.service_id,
        );

        if (service?.slug === "cms") {
            return `/portals/cms/${tenant.id}`;
        }

        if (service?.slug === "ptm") {
            return `/portals/ptm/${tenant.id}`;
        }

        return null;
    }

    function getRoleBadgeVariant(
        role: string,
    ): "default" | "secondary" | "destructive" | "outline" {
        switch (role) {
            case "admin":
                return "default";
            case "editor":
                return "secondary";
            default:
                return "outline";
        }
    }

    function getAccessLevelBadge(
        level: string,
    ): "default" | "secondary" | "destructive" | "outline" {
        switch (level) {
            case "public":
                return "default";
            case "private":
                return "destructive";
            case "token_protected":
                return "secondary";
            default:
                return "outline";
        }
    }
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<div class="container mx-auto space-y-8 py-8">
    <!-- Welcome Section -->
    <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground">Welcome back, {data.user?.name}!</p>
    </div>

    <!-- My Tenants Section -->
    {#if data.tenants && data.tenants.length > 0}
        <Card.Root>
            <Card.Header>
                <Card.Title>My Tenants</Card.Title>
                <Card.Description
                    >Services and projects you have access to</Card.Description
                >
            </Card.Header>
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
                            {@const userMembership = tenant.users?.find(
                                (u: any) => u.id === data.user?.id,
                            )}
                            <Table.Row>
                                <Table.Cell class="font-medium"
                                    >{tenant.name}</Table.Cell
                                >
                                <Table.Cell>
                                    <Badge variant="outline"
                                        >{data.services.find(
                                            (service) =>
                                                service.id ===
                                                tenant.service_id,
                                        )?.name || "Unknown"}</Badge
                                    >
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        variant={getAccessLevelBadge(
                                            tenant.access_level,
                                        )}
                                    >
                                        {tenant.access_level}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    {#if userMembership}
                                        <Badge
                                            variant={getRoleBadgeVariant(
                                                userMembership.pivot.role,
                                            )}
                                        >
                                            {userMembership.pivot.role}
                                        </Badge>
                                    {:else if tenant.owner_id === data.user?.id}
                                        <Badge variant="default">owner</Badge>
                                    {:else}
                                        <Badge variant="outline">member</Badge>
                                    {/if}
                                </Table.Cell>
                                <Table.Cell class="text-right">
                                    <div class="flex justify-end gap-2">
                                        {#if getPortalLink(tenant)}
                                            <Button
                                                href={getPortalLink(
                                                    tenant,
                                                ) as string}
                                                size="sm"
                                                variant="outline"
                                            >
                                                Open Portal
                                            </Button>
                                        {/if}
                                        <Button
                                            href={`/user/dashboard/tenants/${tenant.id}`}
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
        </Card.Root>
    {:else}
        <Card.Root>
            <Card.Header>
                <Card.Title>My Tenants</Card.Title>
                <Card.Description
                    >You don't have any tenants yet</Card.Description
                >
            </Card.Header>
            <Card.Content>
                <p class="text-sm text-muted-foreground">
                    Create your first tenant to start using the platform
                    services.
                </p>
            </Card.Content>
        </Card.Root>
    {/if}

    <!-- Available Services Section -->
    <Card.Root>
        <Card.Header>
            <Card.Title>Available Services</Card.Title>
            <Card.Description
                >Platform services you can subscribe to</Card.Description
            >
        </Card.Header>
        <Card.Content>
            {#if data.services && data.services.length > 0}
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {#each data.services as service}
                        <Card.Root>
                            <Card.Header>
                                <Card.Title class="text-lg">
                                    {service.name}
                                </Card.Title>
                                <Card.Description>
                                    {service.description}
                                </Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <!-- <Badge
                                    variant={service.is_active
                                        ? "default"
                                        : "secondary"}
                                >
                                    {service.is_active ? "Active" : "Inactive"}
                                </Badge> -->
                                <Button
                                    href={`/user/dashboard/tenants/new?service=${service.id}`}
                                    size="sm"
                                    class="w-full"
                                >
                                    Create tenant
                                </Button>
                            </Card.Content>
                        </Card.Root>
                    {/each}
                </div>
            {:else}
                <p class="text-sm text-muted-foreground">
                    No services available at the moment.
                </p>
            {/if}
        </Card.Content>
    </Card.Root>
</div>

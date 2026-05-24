<script lang="ts">
    import { page } from "$app/state";
    import { Badge } from "$components/ui/badge/index.js";
    import { Button } from "$components/ui/button/index.js";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    let portalData = $derived(page.data);
    let tenant = $derived(portalData.tenant);
    let userRole = $derived(portalData.userRole);
    let navItems = $derived(portalData.portalNavItems);

    let serviceName = $derived(tenant?.service?.name || "Portal");
    let serviceDescription = $derived(tenant?.service?.description || "");

    function isActive(href: string): boolean {
        const pathname = page.url.pathname;

        const longestMatch = portalData.portalNavItems
            .filter((item: { href: string }) => pathname.startsWith(item.href))
            .sort(
                (a: { href: string }, b: { href: string }) =>
                    b.href.length - a.href.length,
            )[0];

        return longestMatch?.href === href;
    }
</script>

<svelte:head>
    <title>{tenant.name} - {serviceName}</title>
    <meta name="description" content={serviceDescription} />
</svelte:head>

<div class="border-b">
    <div class="container mx-auto px-4">
        <div class="flex min-h-16 items-center justify-between gap-3 py-3">
            <div class="items-center space-y-1">
                <h1 class="text-xl font-semibold">
                    {tenant.name}
                    <Badge
                        variant={userRole === "owner" || userRole === "admin"
                            ? "default"
                            : "outline"}
                    >
                        {userRole}
                    </Badge>
                </h1>
                <p class="text-xs text-muted-foreground">
                    {serviceName}
                    {#if serviceDescription}
                        - {serviceDescription}
                    {/if}
                </p>
            </div>
            <Button href="/user/dashboard" variant="outline">
                Back to Dashboard
            </Button>
        </div>
    </div>
</div>

{#if navItems.length > 0}
    <div class="border-b">
        <div class="container mx-auto px-4">
            <nav class="flex gap-1">
                {#each navItems as item}
                    <Button
                        href={item.href}
                        size="sm"
                        variant={isActive(item.href) ? "default" : "ghost"}
                        class="rounded-md border-b-2 {isActive(item.href)
                            ? 'border-primary'
                            : 'border-transparent'}"
                    >
                        {item.label}
                    </Button>
                {/each}
            </nav>
        </div>
    </div>
{/if}

<section class="container mx-auto min-h-full px-4 py-8">
    {@render children?.()}
</section>

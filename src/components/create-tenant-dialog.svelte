<script lang="ts">
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "@sveltejs/kit";
    import { Button, buttonVariants } from "$components/ui/button/index.js";
    import * as Dialog from "$components/ui/dialog/index.js";
    import * as Select from "$components/ui/select/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import type { Service } from "$lib/sdk/platform";

    interface Props {
        service: Service;
        onSuccess?: () => void;
    }

    let { service, onSuccess }: Props = $props();

    let open = $state(false);
    let loading = $state(false);
    let error = $state<string | null>(null);

    // Form state
    let name = $state("");
    let accessLevelValue = $state("public");

    const accessLevelOptions = [
        {
            value: "public",
            label: "Public",
            description: "Anyone can access your content",
        },
        {
            value: "private",
            label: "Private",
            description: "Only you and invited members can access",
        },
        {
            value: "token_protected",
            label: "Token Protected",
            description: "Requires API key for access",
        },
    ];

    function handleOpenChange(newOpen: boolean) {
        open = newOpen;
        if (!newOpen) {
            // Reset form when closing
            error = null;
        }
    }

    const createTenantEnhance: SubmitFunction = () => {
        loading = true;
        error = null;

        return async ({ result, update }) => {
            loading = false;

            if (result.type === "failure") {
                error =
                    (result.data?.error as string | undefined) ??
                    "Failed to create tenant";
                return;
            }

            if (result.type === "error") {
                error = "Unexpected error while creating tenant";
                return;
            }

            if (result.type === "success") {
                name = "";
                accessLevelValue = "public";
                open = false;
                onSuccess?.();
            }

            await update();
        };
    };
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
    <Dialog.Trigger class={buttonVariants({ variant: "outline", size: "sm" })}>
        Create Tenant
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-125">
        <form
            method="POST"
            action="?/createTenant"
            use:enhance={createTenantEnhance}
        >
            <Dialog.Header>
                <Dialog.Title>Create New Tenant</Dialog.Title>
                <Dialog.Description>
                    Create a new tenant for <strong>{service.name}</strong>. {service.description}
                </Dialog.Description>
            </Dialog.Header>

            <input type="hidden" name="service_id" value={service.id} />

            <div class="grid gap-4 py-4">
                {#if error}
                    <div
                        class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                {/if}

                <div class="grid gap-2">
                    <Label for="name">
                        Tenant Name <span class="text-destructive">*</span>
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        bind:value={name}
                        placeholder="My Awesome Blog"
                        required
                        disabled={loading}
                    />
                    <p class="text-xs text-muted-foreground">
                        A descriptive name for your tenant
                    </p>
                </div>

                <div class="grid gap-2">
                    <Label for="access_level">
                        Access Level <span class="text-destructive">*</span>
                    </Label>
                    <Select.Root
                        type="single"
                        name="access_level"
                        bind:value={accessLevelValue}
                        disabled={loading}
                    >
                        <Select.Trigger class="w-full">
                            {accessLevelOptions.find(
                                (opt) => opt.value === accessLevelValue,
                            )?.label || accessLevelValue}
                        </Select.Trigger>
                        <Select.Content>
                            {#each accessLevelOptions as option (option.value)}
                                <Select.Item
                                    value={option.value}
                                    label={option.label}
                                >
                                    {option.label}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                    <p class="text-xs text-muted-foreground">
                        {accessLevelOptions.find(
                            (opt) => opt.value === accessLevelValue,
                        )?.description || ""}
                    </p>
                </div>
            </div>

            <Dialog.Footer>
                <Dialog.Close
                    class={buttonVariants({ variant: "outline" })}
                    disabled={loading}
                >
                    Cancel
                </Dialog.Close>
                <Button type="submit" disabled={loading || !name}>
                    {loading ? "Creating..." : "Create Tenant"}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>

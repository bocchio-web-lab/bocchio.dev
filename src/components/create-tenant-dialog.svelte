<script lang="ts">
    import { Button, buttonVariants } from "$components/ui/button/index.js";
    import * as Dialog from "$components/ui/dialog/index.js";
    import * as Select from "$components/ui/select/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import type { Service } from "$lib/types/platform";

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
    let publicSlug = $state("");
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

    const getAccessLevelLabel = (value: string) => {
        return (
            accessLevelOptions.find((opt) => opt.value === value)?.label ||
            value
        );
    };

    const getAccessLevelDescription = (value: string) => {
        return (
            accessLevelOptions.find((opt) => opt.value === value)
                ?.description || ""
        );
    };

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            // const result = await tenantApi.createTenant({
            //     name,
            //     service_id: service.id,
            //     public_slug: publicSlug || undefined,
            //     access_level: accessLevelValue as
            //         | "public"
            //         | "private"
            //         | "token_protected",
            // });

            const result = { error: null } as any; // Replace with actual API call
            if (result.error) {
                error = result.error.message;
            } else {
                // Success - reset form and close dialog
                name = "";
                publicSlug = "";
                accessLevelValue = "public";
                open = false;

                // Call success callback
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
        } finally {
            loading = false;
        }
    }

    function handleOpenChange(newOpen: boolean) {
        open = newOpen;
        if (!newOpen) {
            // Reset form when closing
            error = null;
        }
    }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
    <Dialog.Trigger class={buttonVariants({ variant: "outline", size: "sm" })}>
        Create Tenant
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-125">
        <form onsubmit={handleSubmit}>
            <Dialog.Header>
                <Dialog.Title>Create New Tenant</Dialog.Title>
                <Dialog.Description>
                    Create a new tenant for <strong>{service.name}</strong>. {service.description}
                </Dialog.Description>
            </Dialog.Header>

            <div class="grid gap-4 py-4">
                {#if error}
                    <div
                        class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                {/if}

                <div class="grid gap-2">
                    <Label for="name"
                        >Tenant Name <span class="text-destructive">*</span
                        ></Label
                    >
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
                    <Label for="public_slug">Public Slug</Label>
                    <Input
                        id="public_slug"
                        name="public_slug"
                        bind:value={publicSlug}
                        placeholder="my-awesome-blog"
                        disabled={loading}
                    />
                    <p class="text-xs text-muted-foreground">
                        Optional. Leave empty to auto-generate from name. Used
                        in public URLs.
                    </p>
                </div>

                <div class="grid gap-2">
                    <Label for="access_level"
                        >Access Level <span class="text-destructive">*</span
                        ></Label
                    >
                    <Select.Root
                        type="single"
                        name="access_level"
                        bind:value={accessLevelValue}
                        disabled={loading}
                    >
                        <Select.Trigger class="w-full">
                            {getAccessLevelLabel(accessLevelValue)}
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
                        {getAccessLevelDescription(accessLevelValue)}
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

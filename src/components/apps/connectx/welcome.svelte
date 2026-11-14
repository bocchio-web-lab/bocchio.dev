<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { replaceState } from "$app/navigation";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { LoaderCircle } from "@lucide/svelte";
    import { LIMITS } from "$lib/apps/connectx/protocol";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";

    interface Props {
        session: ConnectXSession;
        /** The room that a link asks to join. */
        invite: string | null;
    }

    let { session, invite }: Props = $props();

    const STORAGE_KEY = "connectx:name";

    let name = $state("");

    const connecting = $derived(session.phase === "connecting");

    // The name is remembered for the next time (and works without it, if the browser does not allow storing it)
    onMount(() => {
        try {
            name = localStorage.getItem(STORAGE_KEY) ?? "";
        } catch {
            // No storage: the visitor types the name again
        }
    });

    async function start(event: SubmitEvent) {
        event.preventDefault();

        try {
            localStorage.setItem(STORAGE_KEY, name.trim());
        } catch {
            // Not remembered
        }

        const connected = await session.connect(name);

        // The invitation is used up: the address no longer asks for the room
        if (connected && invite) {
            replaceState(page.url.pathname, {});
            await session.joinNamed(invite);
        }
    }
</script>

<Card.Root class="mx-auto w-full max-w-md">
    <Card.Header class="px-6 pt-6">
        <Card.Title class="text-xl">Play ConnectX</Card.Title>
        <Card.Description>
            Challenge the computer, or somebody else, on the classic board or on
            any size you like.
        </Card.Description>
    </Card.Header>
    <Card.Content class="px-6 pb-6">
        <form class="space-y-4" onsubmit={start}>
            {#if invite}
                <p class="rounded-lg bg-primary/10 p-3 text-sm">
                    You have been invited to the room
                    <strong class="break-words">“{invite}”</strong>.
                </p>
            {/if}

            <div class="space-y-2">
                <Label for="player-name">Your name</Label>
                <Input
                    id="player-name"
                    bind:value={name}
                    maxlength={LIMITS.maxName}
                    placeholder="Guest"
                    autocomplete="nickname"
                    spellcheck={false}
                />
            </div>

            <Button type="submit" size="lg" class="w-full" disabled={connecting}>
                {#if connecting}
                    <LoaderCircle class="animate-spin" />
                    Connecting…
                {:else if invite}
                    Join the room
                {:else}
                    Start playing
                {/if}
            </Button>
        </form>
    </Card.Content>
</Card.Root>

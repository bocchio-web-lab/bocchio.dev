<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Bot } from "@lucide/svelte";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";
    import LevelPicker from "./level-picker.svelte";

    interface Props {
        session: ConnectXSession;
    }

    let { session }: Props = $props();
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Play the computer</Card.Title>
        <Card.Description>A classic game, which starts at once.</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4 px-5 pb-5">
        {#if session.levels === null}
            <p class="text-sm text-muted-foreground">Looking for computers…</p>
        {:else if !session.levels.available}
            <p class="text-sm text-muted-foreground">
                No computer is available at the moment. You can still play against other people.
            </p>
        {:else}
            <LevelPicker {session} id="lobby-level" />

            <Button class="w-full" disabled={session.busy} onclick={() => session.playComputer()}>
                <Bot />
                Start the game
            </Button>
        {/if}
    </Card.Content>
</Card.Root>

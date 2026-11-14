<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { RefreshCw } from "@lucide/svelte";
    import { describeConfig } from "$lib/apps/connectx/board";
    import { GameStatus } from "$lib/apps/connectx/protocol";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";

    interface Props {
        session: ConnectXSession;
    }

    let { session }: Props = $props();

    let refreshing = $state(false);

    // The rooms that have a place for the visitor, and how many games are going on without one
    const open = $derived(
        session.rooms.filter(
            (room) => room.status === GameStatus.NOT_STARTED && room.players < room.config.players,
        ),
    );
    const running = $derived(session.rooms.length - open.length);

    async function refresh() {
        refreshing = true;
        session.touch();

        await session.refreshRooms();

        refreshing = false;
    }
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Open rooms</Card.Title>
        <Card.Description>People waiting for somebody to play with.</Card.Description>
        <Card.Action>
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Look for rooms again"
                title="Look for rooms again"
                onclick={refresh}
            >
                <RefreshCw class={refreshing ? "animate-spin" : ""} />
            </Button>
        </Card.Action>
    </Card.Header>
    <Card.Content class="px-5 pb-5">
        {#if !session.roomsLoaded}
            <p class="py-6 text-center text-sm text-muted-foreground">Looking for rooms…</p>
        {:else if open.length === 0}
            <p class="py-6 text-center text-sm text-muted-foreground">
                Nobody is waiting right now. Open a room and invite a friend, try the quick
                match, or play the computer.
            </p>
        {:else}
            <ul class="space-y-2">
                {#each open as room (room.id)}
                    <li class="flex items-center gap-3 rounded-lg border p-3">
                        <div class="min-w-0 flex-1">
                            <p class="truncate font-medium">{room.name || "Quick match game"}</p>
                            <p class="text-xs text-muted-foreground">
                                {describeConfig(room.config)} · {room.players} of {room.config.players}
                                players
                            </p>
                        </div>
                        <Button size="sm" disabled={session.busy} onclick={() => session.joinRoom(room)}>
                            Join
                        </Button>
                    </li>
                {/each}
            </ul>
        {/if}

        {#if running > 0}
            <p class="mt-3 text-xs text-muted-foreground">
                {running === 1 ? "1 game is" : `${running} games are`} being played right now.
            </p>
        {/if}
    </Card.Content>
</Card.Root>

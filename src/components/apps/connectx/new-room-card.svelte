<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { Plus } from "@lucide/svelte";
    import { CLASSIC, PRESETS, checkConfig, sameConfig } from "$lib/apps/connectx/config";
    import { LIMITS } from "$lib/apps/connectx/protocol";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";

    interface Props {
        session: ConnectXSession;
    }

    let { session }: Props = $props();

    let roomName = $state("");
    let rows = $state(CLASSIC.rows);
    let cols = $state(CLASSIC.cols);
    let connect = $state(CLASSIC.connect);
    let players = $state(CLASSIC.players);

    const config = $derived({
        rows: Number(rows),
        cols: Number(cols),
        connect: Number(connect),
        players: Number(players),
    });
    const problem = $derived(checkConfig(config));
    const preset = $derived(PRESETS.find((candidate) => sameConfig(candidate.config, config)));
    const suggestion = $derived(`${session.name}'s room`.slice(0, LIMITS.maxName));

    function choose(next: typeof CLASSIC) {
        rows = next.rows;
        cols = next.cols;
        connect = next.connect;
        players = next.players;
    }

    function submit(event: SubmitEvent) {
        event.preventDefault();

        if (!problem) session.createRoom(roomName.trim() || suggestion, config);
    }
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Open a room</Card.Title>
        <Card.Description>Wait for somebody to join, or send them the link.</Card.Description>
    </Card.Header>
    <Card.Content class="px-5 pb-5">
        <form class="space-y-4" onsubmit={submit}>
            <div class="space-y-2">
                <Label for="room-name">Name of the room</Label>
                <Input
                    id="room-name"
                    bind:value={roomName}
                    maxlength={LIMITS.maxName}
                    placeholder={suggestion}
                    autocomplete="off"
                    spellcheck={false}
                />
            </div>

            <div class="space-y-2">
                <p class="text-sm font-medium">Game</p>
                <div class="flex flex-wrap gap-2">
                    {#each PRESETS as option (option.id)}
                        <Button
                            size="sm"
                            variant={preset?.id === option.id ? "default" : "outline"}
                            aria-pressed={preset?.id === option.id}
                            onclick={() => choose(option.config)}
                        >
                            {option.label}
                        </Button>
                    {/each}
                </div>
            </div>

            <details class="group rounded-lg border" open={preset === undefined}>
                <summary class="cursor-pointer px-3 py-2 text-sm font-medium select-none">
                    {config.rows} × {config.cols} board, connect {config.connect}, {config.players} players
                </summary>
                <div class="grid grid-cols-2 gap-3 border-t p-3">
                    <div class="space-y-1.5">
                        <Label for="room-rows">Rows</Label>
                        <Input id="room-rows" type="number" bind:value={rows} min={LIMITS.minSize} max={LIMITS.maxSize} />
                    </div>
                    <div class="space-y-1.5">
                        <Label for="room-cols">Columns</Label>
                        <Input id="room-cols" type="number" bind:value={cols} min={LIMITS.minSize} max={LIMITS.maxSize} />
                    </div>
                    <div class="space-y-1.5">
                        <Label for="room-connect">Discs to connect</Label>
                        <Input id="room-connect" type="number" bind:value={connect} min={LIMITS.minConnect} max={LIMITS.maxSize} />
                    </div>
                    <div class="space-y-1.5">
                        <Label for="room-players">Players</Label>
                        <Input id="room-players" type="number" bind:value={players} min={LIMITS.minPlayers} max={LIMITS.maxPlayers} />
                    </div>
                </div>
            </details>

            {#if problem}
                <p class="text-sm text-destructive" role="alert">{problem}</p>
            {/if}

            <Button type="submit" class="w-full" disabled={session.busy || problem !== null}>
                <Plus />
                Open the room
            </Button>
        </form>
    </Card.Content>
</Card.Root>

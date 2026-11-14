<script lang="ts">
    import { page } from "$app/state";
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { Bot, Check, Copy, DoorOpen, RotateCcw, Trophy } from "@lucide/svelte";
    import { describeConfig, emptyBoard, winningLine } from "$lib/apps/connectx/board";
    import { computerCanPlay } from "$lib/apps/connectx/config";
    import {
        canMove,
        colorOf,
        isFinished,
        seats,
        summarize,
        type GameView,
        type Tone,
    } from "$lib/apps/connectx/game";
    import { GameStatus } from "$lib/apps/connectx/protocol";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";
    import { cn } from "$lib/utils";
    import Board from "./board.svelte";
    import LevelPicker from "./level-picker.svelte";

    interface Props {
        session: ConnectXSession;
        game: GameView;
    }

    let { session, game }: Props = $props();

    const toneClasses: Record<Tone, string> = {
        waiting: "border-border bg-muted/50",
        turn: "border-primary bg-primary/10",
        opponent: "border-border bg-muted/50",
        won: "border-chart-2 bg-chart-2/10",
        lost: "border-destructive/50 bg-destructive/10",
        draw: "border-border bg-muted/50",
        alone: "border-border bg-muted/50",
    };

    const snapshot = $derived(game.state);
    const board = $derived(snapshot?.board ?? emptyBoard(game.config.rows, game.config.cols));
    const summary = $derived(summarize(game));
    const table = $derived(seats(game));
    const finished = $derived(isFinished(game));
    const waiting = $derived(summary.tone === "waiting");
    const playable = $derived(canMove(game) && !session.moving);

    const win = $derived(
        snapshot?.status === GameStatus.FINISHED_WIN && snapshot.winner !== null
            ? winningLine(board, game.config.connect, snapshot.winner)
            : [],
    );

    const offerComputer = $derived(
        waiting &&
            game.computer === null &&
            session.levels?.available === true &&
            computerCanPlay(game.config),
    );

    // Only the rooms that have a name can be reached by a link
    const link = $derived(
        game.name
            ? `${page.url.origin}${page.url.pathname}?room=${encodeURIComponent(game.name)}`
            : null,
    );

    let copied = $state(false);
    let copiedTimer: ReturnType<typeof setTimeout> | undefined;

    async function copy() {
        if (!link) return;

        try {
            await navigator.clipboard.writeText(link);
        } catch {
            // The visitor can still select the link and copy it
            return;
        }

        copied = true;
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => (copied = false), 2000);
    }

    // The digits drop a disc in the column of that number, for those who prefer the keyboard
    function handleKey(event: KeyboardEvent) {
        if (!playable || event.ctrlKey || event.metaKey || event.altKey) return;
        if ((event.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]")) return;

        const column = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;

        if (column >= 0 && column < game.config.cols) {
            event.preventDefault();
            session.move(column);
        }
    }
</script>

<svelte:window onkeydown={handleKey} />

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div class="flex min-w-0 flex-col gap-4">
        <div
            role="status"
            class={cn("rounded-lg border px-4 py-3 text-center transition-colors", toneClasses[summary.tone])}
        >
            <p class="text-lg font-semibold">{summary.headline}</p>
            {#if summary.detail}
                <p class="text-sm text-muted-foreground">{summary.detail}</p>
            {/if}
        </div>

        {#if game.problem}
            <p class="text-center text-sm text-destructive" role="alert">{game.problem}</p>
        {/if}

        <div class="mx-auto w-full" style:max-width="min(100%, {game.config.cols * 4.8}rem)">
            <Board
                {board}
                {win}
                last={game.last}
                me={game.me}
                {playable}
                onmove={(column) => session.move(column)}
            />
        </div>

        <p class="text-center text-xs text-muted-foreground">
            <span class="pointer-coarse:hidden">
                Click a column to drop a disc in it, or press its number.
            </span>
            <span class="hidden pointer-coarse:inline">Tap a column to drop a disc in it.</span>
        </p>
    </div>

    <aside class="flex flex-col gap-4">
        <Card.Root>
            <Card.Header class="px-5 py-4">
                <Card.Title class="text-base">Players</Card.Title>
                <Card.Description class="break-words">
                    {game.name ? `${game.name} · ` : ""}{describeConfig(game.config)}
                </Card.Description>
            </Card.Header>
            <Card.Content class="px-5 pb-5">
                <ul class="space-y-1">
                    {#each table as seat (seat.player)}
                        {@const toMove = snapshot?.status === GameStatus.IN_PROGRESS && snapshot.current === seat.player}
                        {@const winner = snapshot?.status === GameStatus.FINISHED_WIN && snapshot.winner === seat.player}
                        <li
                            class={cn(
                                "flex items-center gap-3 rounded-md px-2 py-1.5",
                                toMove && "bg-primary/10",
                            )}
                        >
                            <span
                                class={cn(
                                    "size-5 shrink-0 rounded-full ring-1 ring-black/10",
                                    seat.presence !== "here" && "opacity-30",
                                )}
                                style:background-color={colorOf(seat.player)}
                                aria-hidden="true"
                            ></span>

                            <span class="min-w-0 flex-1 truncate">
                                {#if seat.presence === "free"}
                                    <span class="text-muted-foreground">Waiting…</span>
                                {:else}
                                    {seat.name || `Player ${seat.player}`}
                                    {#if seat.you}
                                        <span class="text-muted-foreground">(you)</span>
                                    {/if}
                                    {#if seat.presence === "left"}
                                        <span class="text-muted-foreground">· left the game</span>
                                    {/if}
                                {/if}
                            </span>

                            {#if winner}
                                <Trophy class="size-4 text-chart-2" aria-label="Winner" />
                            {:else if toMove}
                                <span class="text-xs font-medium text-primary">to move</span>
                            {/if}
                        </li>
                    {/each}
                </ul>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Content class="space-y-4 p-5">
                {#if waiting && link}
                    <div class="space-y-2">
                        <Label for="invite-link">Invite somebody</Label>
                        <div class="flex gap-2">
                            <Input
                                id="invite-link"
                                readonly
                                value={link}
                                onfocus={(event) => event.currentTarget.select()}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                class="shrink-0"
                                aria-label="Copy the link"
                                title="Copy the link"
                                onclick={copy}
                            >
                                {#if copied}
                                    <Check />
                                {:else}
                                    <Copy />
                                {/if}
                            </Button>
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Whoever opens this link joins the room.
                        </p>
                    </div>
                {/if}

                {#if offerComputer}
                    <div class={cn("space-y-3", link && "border-t pt-4")}>
                        <LevelPicker {session} id="room-level" />
                        <Button
                            variant="outline"
                            class="w-full"
                            disabled={session.busy}
                            onclick={() => session.addComputer()}
                        >
                            <Bot />
                            Add a computer
                        </Button>
                    </div>
                {/if}

                <div class={cn("space-y-2", (waiting && (link || offerComputer)) && "border-t pt-4")}>
                    {#if finished}
                        {#if game.level !== null}
                            <Button class="w-full" disabled={session.busy} onclick={() => session.rematch()}>
                                <RotateCcw />
                                Play again
                            </Button>
                        {/if}
                        <Button
                            variant={game.level !== null ? "outline" : "default"}
                            class="w-full"
                            onclick={() => session.leave()}
                        >
                            Back to the lobby
                        </Button>
                    {:else}
                        <Button variant="outline" class="w-full" onclick={() => session.leave()}>
                            <DoorOpen />
                            Leave the game
                        </Button>
                    {/if}
                </div>
            </Card.Content>
        </Card.Root>
    </aside>
</div>

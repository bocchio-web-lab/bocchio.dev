<script lang="ts">
    import type { Cell } from "$lib/apps/connectx/board";
    import { isColumnFull } from "$lib/apps/connectx/board";
    import { colorOf } from "$lib/apps/connectx/game";

    interface Props {
        board: number[][];
        /** The discs of the winning line, once there is one. */
        win: Cell[];
        /** The disc that was dropped last. */
        last: Cell | null;
        /** The number of the player who is looking, whose discs hover over the board. */
        me: number;
        /** Whether a disc can be dropped now. */
        playable: boolean;
        onmove: (column: number) => void;
    }

    let { board, win, last, me, playable, onmove }: Props = $props();

    // The drawing is made in units of one cell. The margin is the frame around the holes, the top is the room
    // over the board for the disc that is about to fall.
    const CELL = 100;
    const MARGIN = 14;
    const TOP = CELL;
    const HOLE = CELL * 0.43;
    const DISC = CELL * 0.4;
    const CORNER = 28;

    const rows = $derived(board.length);
    const cols = $derived(board[0]?.length ?? 0);
    const width = $derived(cols * CELL + 2 * MARGIN);
    const height = $derived(TOP + rows * CELL + 2 * MARGIN);

    const x = (col: number) => MARGIN + col * CELL + CELL / 2;
    const y = (row: number) => TOP + MARGIN + row * CELL + CELL / 2;

    // The board is a plate with a hole for every cell: the discs are behind it, so that they seem to fall inside
    const plate = $derived.by(() => {
        const w = width;
        const h = height;
        const r = CORNER;

        let path = `M ${r} ${TOP} H ${w - r} Q ${w} ${TOP} ${w} ${TOP + r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${TOP + r} Q 0 ${TOP} ${r} ${TOP} Z`;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                path += ` M ${x(col) - HOLE} ${y(row)} a ${HOLE} ${HOLE} 0 1 0 ${2 * HOLE} 0 a ${HOLE} ${HOLE} 0 1 0 ${-2 * HOLE} 0 Z`;
            }
        }

        return path;
    });

    // A dark ring around every hole, so that the plate has some thickness
    const rims = $derived.by(() => {
        let path = "";

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                path += ` M ${x(col) - HOLE} ${y(row)} a ${HOLE} ${HOLE} 0 1 0 ${2 * HOLE} 0 a ${HOLE} ${HOLE} 0 1 0 ${-2 * HOLE} 0 Z`;
            }
        }

        return path;
    });

    const discs = $derived(
        board.flatMap((line, row) =>
            line.flatMap((player, col) => (player === 0 ? [] : [{ row, col, player }])),
        ),
    );

    // The discs are painted with a light spot, which is what makes a flat colour look like a thing with a shape
    const PLAYERS = [1, 2, 3, 4];

    /** The colour moved towards white (amount above 0) or towards black (below 0). */
    function shade(color: string, amount: number): string {
        const target = amount < 0 ? 0 : 255;
        const channel = (i: number) =>
            Math.round(parseInt(color.slice(1 + 2 * i, 3 + 2 * i), 16) * (1 - Math.abs(amount)) + target * Math.abs(amount));

        return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
    }

    const paint = (player: number) => `url(#disc-paint-${((player - 1) % PLAYERS.length) + 1})`;

    let hovered = $state<number | null>(null);

    const ghost = $derived(
        playable && hovered !== null && !isColumnFull(board, hovered) ? hovered : null,
    );

    /** Moves the focus along the columns, as the arrow keys say. */
    function navigate(event: KeyboardEvent) {
        const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
        const container = event.currentTarget as HTMLElement;
        const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);

        if (event.key in keys && current >= 0) {
            buttons[Math.max(0, Math.min(buttons.length - 1, current + keys[event.key]))]?.focus();
            event.preventDefault();
        } else if (event.key === "Home") {
            buttons[0]?.focus();
            event.preventDefault();
        } else if (event.key === "End") {
            buttons[buttons.length - 1]?.focus();
            event.preventDefault();
        }
    }
</script>

<div class="relative select-none">
    <svg
        viewBox="0 0 {width} {height}"
        class="block h-auto w-full"
        role="img"
        aria-label="The board, with {rows} rows and {cols} columns"
    >
        <defs>
            <linearGradient id="plate-paint" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#4b78f6" />
                <stop offset="1" stop-color="#1a37a2" />
            </linearGradient>
            {#each PLAYERS as player (player)}
                <radialGradient id="disc-paint-{player}" cx="0.5" cy="0.5" r="0.5" fx="0.36" fy="0.3">
                    <stop offset="0" stop-color={shade(colorOf(player), 0.4)} />
                    <stop offset="0.5" stop-color={colorOf(player)} />
                    <stop offset="1" stop-color={shade(colorOf(player), -0.3)} />
                </radialGradient>
            {/each}
        </defs>

        <!-- Behind the plate: the discs, and the one that hovers over the column -->
        {#if ghost !== null}
            <circle
                cx={x(ghost)}
                cy={TOP / 2}
                r={DISC}
                fill={paint(me)}
                opacity="0.55"
            />
        {/if}

        {#each discs as disc (`${disc.row}-${disc.col}`)}
            <circle
                class="disc"
                cx={x(disc.col)}
                cy={y(disc.row)}
                r={DISC}
                fill={paint(disc.player)}
                style:--drop="{-(y(disc.row) + CELL / 2)}px"
                style:--fall="{0.25 + disc.row * 0.05}s"
            />
        {/each}

        {#if last}
            {#key `${last.row}-${last.col}`}
                <circle
                    class="last"
                    cx={x(last.col)}
                    cy={y(last.row)}
                    r="9"
                    style:--fall="{0.25 + last.row * 0.05}s"
                />
            {/key}
        {/if}

        <path class="plate" d={plate} fill="url(#plate-paint)" fill-rule="evenodd" />
        <path d={rims} fill="none" stroke="#0d2070" stroke-opacity="0.5" stroke-width="5" />

        {#if ghost !== null}
            <rect
                class="column"
                x={MARGIN + ghost * CELL}
                y={TOP}
                width={CELL}
                height={height - TOP}
            />
        {/if}

        <!-- In front of the plate: the line that won -->
        {#each win as cell (`${cell.row}-${cell.col}`)}
            <circle class="win" cx={x(cell.col)} cy={y(cell.row)} r={HOLE - 3} />
        {/each}
    </svg>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="absolute inset-y-0 flex"
        style:left="{(MARGIN / width) * 100}%"
        style:width="{((cols * CELL) / width) * 100}%"
        onkeydown={navigate}
    >
        {#each Array(cols) as _, col (col)}
            <button
                type="button"
                class="h-full flex-1 cursor-pointer rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-default"
                aria-label="Drop a disc in column {col + 1}"
                disabled={!playable || isColumnFull(board, col)}
                onclick={() => onmove(col)}
                onpointerenter={() => (hovered = col)}
                onpointerleave={() => (hovered = null)}
                onfocus={() => (hovered = col)}
                onblur={() => (hovered = null)}
            ></button>
        {/each}
    </div>
</div>

<style>
    .column {
        fill: white;
        opacity: 0.08;
        pointer-events: none;
    }

    .last {
        fill: white;
        opacity: 0.85;
        animation: appear 0.15s linear var(--fall) backwards;
    }

    .win {
        fill: none;
        stroke: white;
        stroke-width: 7;
        animation: pulse 1.2s ease-in-out infinite;
    }

    .disc {
        animation: fall var(--fall) cubic-bezier(0.55, 0, 0.8, 0.6) backwards;
    }

    @keyframes fall {
        from {
            transform: translateY(var(--drop));
        }
    }

    @keyframes appear {
        from {
            opacity: 0;
        }
    }

    @keyframes pulse {
        50% {
            opacity: 0.35;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .disc,
        .last,
        .win {
            animation: none;
        }
    }
</style>

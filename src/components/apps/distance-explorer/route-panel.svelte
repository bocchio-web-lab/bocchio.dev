<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { X } from "@lucide/svelte";
    import type { DistanceExplorer } from "$lib/apps/distance-explorer/explorer.svelte";
    import { letter, MAX_STOPS } from "$lib/apps/distance-explorer/route";

    interface Props {
        explorer: DistanceExplorer;
    }

    let { explorer }: Props = $props();

    const summary = $derived(explorer.summary);
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Route</Card.Title>
        <Card.Description>
            {#if summary.stops.length === 0}
                Nothing yet.
            {:else if summary.stops.length === 1}
                Add a second point to see how far it is.
            {:else}
                {summary.stops.length - 1} {summary.stops.length === 2 ? "leg" : "legs"}, from {letter(0)} to {letter(summary.stops.length - 1)}.
            {/if}
        </Card.Description>
        {#if summary.stops.length > 0}
            <Card.Action>
                <Button variant="ghost" size="sm" onclick={() => explorer.clear()}>Clear</Button>
            </Card.Action>
        {/if}
    </Card.Header>

    <Card.Content class="px-5 pb-5">
        {#if summary.stops.length === 0}
            <p class="text-sm text-muted-foreground">
                The first point is the start. From the second one on, the distance from the point before is shown, and the total.
            </p>
        {:else}
            <ol>
                {#each summary.stops as stop, i (i)}
                    {#if i > 0}
                        <li class="my-1 ml-3.5 border-l border-dashed pl-6">
                            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 py-1.5 text-sm">
                                {#each summary.legs[i - 1] as row (row.label)}
                                    <dt class="text-muted-foreground">{row.label}</dt>
                                    <dd class="tabular-nums">
                                        {row.value}
                                        {#if row.note}
                                            <span class="block text-xs text-muted-foreground">{row.note}</span>
                                        {/if}
                                    </dd>
                                {/each}
                            </dl>
                        </li>
                    {/if}

                    <li class="flex items-center gap-3">
                        <span class="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {letter(i)}
                        </span>
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium">{stop.title}</p>
                            <p class="truncate text-xs text-muted-foreground">{stop.detail}</p>
                        </div>
                        <Button variant="ghost" size="icon-sm" aria-label="Remove {stop.title}" title="Remove" onclick={() => explorer.remove(i)}>
                            <X />
                        </Button>
                    </li>
                {/each}
            </ol>

            {#if summary.totals.length > 0}
                <div class="mt-4 border-t pt-3">
                    <p class="mb-1 text-sm font-medium">Total</p>
                    <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                        {#each summary.totals as row (row.label)}
                            <dt class="text-muted-foreground">{row.label}</dt>
                            <dd class="tabular-nums">
                                {row.value}
                                {#if row.note}
                                    <span class="block text-xs text-muted-foreground">{row.note}</span>
                                {/if}
                            </dd>
                        {/each}
                    </dl>
                </div>
            {/if}

            {#if summary.note}
                <p class="mt-4 text-xs text-muted-foreground">{summary.note}</p>
            {/if}

            {#if explorer.full}
                <p class="mt-4 text-xs text-muted-foreground">That is as many points as there are letters ({MAX_STOPS}).</p>
            {/if}
        {/if}
    </Card.Content>
</Card.Root>

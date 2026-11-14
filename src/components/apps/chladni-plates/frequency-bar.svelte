<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Slider } from "$components/ui/slider/index.js";
    import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "@lucide/svelte";
    import type { ChladniStudio } from "$lib/apps/chladni-plates/studio.svelte";
    import SpectrumPlot from "./spectrum-plot.svelte";

    interface Props {
        studio: ChladniStudio;
    }

    let { studio }: Props = $props();

    const ready = $derived(studio.prepared !== null);

    /** The resonance that the frequency is at (or very near), if there is one. */
    const nearest = $derived(studio.resonances.find((resonance) => Math.abs(resonance.frequency / studio.frequency - 1) < 0.012));

    const step = $derived(Math.max(1, Math.round((studio.range.max - studio.range.min) / 3000)));
</script>

<Card.Root>
    <Card.Content class="space-y-3 px-5 py-4">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div class="flex items-baseline gap-2">
                <span class="text-3xl font-semibold tabular-nums">{Math.round(studio.frequency)}</span>
                <span class="text-sm text-muted-foreground">Hz</span>
            </div>

            <p class="order-last w-full text-sm text-muted-foreground sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:truncate">
                {#if nearest}
                    <span class="font-medium text-foreground">Resonance</span> · mode {nearest.mode + 1}
                {:else}
                    Between two resonances
                {/if}
            </p>

            <div class="ml-auto flex shrink-0 gap-1 sm:ml-0">
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous resonance"
                    title="Previous resonance"
                    disabled={!ready}
                    onclick={() => studio.stepResonance(-1)}
                >
                    <ChevronLeft />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next resonance"
                    title="Next resonance"
                    disabled={!ready}
                    onclick={() => studio.stepResonance(1)}
                >
                    <ChevronRight />
                </Button>
                <Button
                    variant={studio.sound ? "default" : "outline"}
                    size="icon"
                    aria-label={studio.sound ? "Turn the sound off" : "Hear the sound of the shaker"}
                    aria-pressed={studio.sound}
                    title={studio.sound ? "Turn the sound off" : "Hear the sound of the shaker"}
                    onclick={() => studio.setSound(!studio.sound)}
                >
                    {#if studio.sound}
                        <Volume2 />
                    {:else}
                        <VolumeX />
                    {/if}
                </Button>
            </div>
        </div>

        <Slider
            type="single"
            aria-label="Frequency of the shaker, in hertz"
            min={studio.range.min}
            max={studio.range.max}
            {step}
            value={studio.frequency}
            disabled={!ready}
            onValueChange={(value) => studio.setFrequency(value)}
        />

        <div class="space-y-1">
            <SpectrumPlot {studio} />
            <div class="flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground tabular-nums">
                <span class="whitespace-nowrap">{studio.range.min} Hz</span>
                <span class="order-last w-full text-center sm:order-none sm:w-auto">How strongly the plate responds: the peaks are its resonances</span>
                <span class="whitespace-nowrap">{studio.range.max} Hz</span>
            </div>
        </div>
    </Card.Content>
</Card.Root>

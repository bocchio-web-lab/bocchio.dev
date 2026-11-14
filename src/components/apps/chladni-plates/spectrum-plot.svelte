<script lang="ts">
    import { overallResponse } from "$lib/apps/chladni-plates/response";
    import type { ChladniStudio } from "$lib/apps/chladni-plates/studio.svelte";

    interface Props {
        studio: ChladniStudio;
    }

    let { studio }: Props = $props();

    const WIDTH = 600;
    const HEIGHT = 84;
    const POINTS = 300;
    /** How many powers of ten of response the plot shows below the highest peak. */
    const DECADES = 3;

    /** How strongly the plate responds at each frequency, as the points of a line: the peaks are the resonances. */
    const curve = $derived.by(() => {
        const prepared = studio.prepared;
        if (!prepared) return null;

        const { min, max } = studio.range;
        const sizes = Array.from({ length: POINTS }, (_, i) => {
            const frequency = min + ((max - min) * i) / (POINTS - 1);
            return overallResponse(prepared.modes, studio.coupling, frequency / studio.scale, studio.quality);
        });

        const highest = Math.max(...sizes, 1e-12);

        return sizes
            .map((size, i) => {
                const level = Math.max(0, 1 + Math.log10(Math.max(size, 1e-12) / highest) / DECADES);
                return `${i === 0 ? "M" : "L"}${((i / (POINTS - 1)) * WIDTH).toFixed(1)} ${(HEIGHT - 2 - level * (HEIGHT - 8)).toFixed(1)}`;
            })
            .join(" ");
    });

    const toX = (frequency: number) => ((frequency - studio.range.min) / (studio.range.max - studio.range.min)) * WIDTH;

    function tune(event: PointerEvent) {
        const { left, width } = (event.currentTarget as SVGElement).getBoundingClientRect();
        const { min, max } = studio.range;

        studio.setFrequency(min + (max - min) * Math.max(0, Math.min(1, (event.clientX - left) / width)));
    }

    let dragging = false;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
    viewBox="0 0 {WIDTH} {HEIGHT}"
    class="h-20 w-full cursor-pointer touch-pan-y"
    role="img"
    aria-label="How strongly the plate responds at each frequency. Click or drag to choose a frequency."
    onpointerdown={(event) => {
        dragging = true;
        (event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
        tune(event);
    }}
    onpointermove={(event) => dragging && tune(event)}
    onpointerup={() => (dragging = false)}
    onpointercancel={() => (dragging = false)}
>
    <line x1="0" y1={HEIGHT - 1} x2={WIDTH} y2={HEIGHT - 1} class="stroke-border" />

    {#each studio.resonances as resonance (resonance.mode)}
        <line
            x1={toX(resonance.frequency)}
            y1={HEIGHT - 6}
            x2={toX(resonance.frequency)}
            y2={HEIGHT - 1}
            class="stroke-muted-foreground"
            stroke-width="2"
        />
    {/each}

    {#if curve}
        <path d={curve} fill="none" class="stroke-primary" stroke-width="1.6" stroke-linejoin="round" />
    {/if}

    <line x1={toX(studio.frequency)} y1="0" x2={toX(studio.frequency)} y2={HEIGHT} class="stroke-foreground" stroke-width="1.5" />
</svg>

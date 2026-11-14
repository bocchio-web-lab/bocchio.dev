<script lang="ts">
    import * as Card from "$components/ui/card/index.js";
    import type { FourierStudio } from "$lib/apps/fourier-drawing/studio.svelte";
    import SliderField from "$components/apps/slider-field.svelte";

    interface Props {
        studio: FourierStudio;
    }

    let { studio }: Props = $props();

    // Shapes are not made of a picture, so there is nothing to detect in them
    const enabled = $derived(studio.fromImage);
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Edge detection</Card.Title>
        <Card.Description>
            {#if enabled}
                The lines of the picture are found with a Canny edge detector.
            {:else}
                Load a picture to find its lines with a Canny edge detector.
            {/if}
        </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5 px-5 pb-5">
        <SliderField
            label="Detail"
            display="{Math.round(studio.sensitivity * 100)}%"
            hint="How faint an edge can be and still be kept. Pictures with little contrast need more."
            value={studio.sensitivity}
            min={0}
            max={1}
            step={0.01}
            disabled={!enabled}
            onchange={(value) => {
                studio.sensitivity = value;
                studio.reanalyze();
            }}
        />

        <SliderField
            label="Smoothing"
            display="{studio.smoothing.toFixed(1)} px"
            hint="Blur applied before looking for edges: it hides fine textures and noise."
            value={studio.smoothing}
            min={0.5}
            max={4}
            step={0.1}
            disabled={!enabled}
            onchange={(value) => {
                studio.smoothing = value;
                studio.reanalyze();
            }}
        />

        <SliderField
            label="Ignore lines shorter than"
            display="{studio.minLength} px"
            hint="Short strokes are usually noise rather than part of the picture."
            value={studio.minLength}
            min={2}
            max={80}
            step={1}
            disabled={!enabled}
            onchange={(value) => {
                studio.minLength = value;
                studio.reanalyze();
            }}
        />

        {#if enabled && studio.drawing}
            <p class="text-xs text-muted-foreground">
                {studio.drawing.strokes.toLocaleString("en-US")}
                {studio.drawing.strokes === 1 ? "stroke" : "strokes"} found.
            </p>
        {/if}
    </Card.Content>
</Card.Root>

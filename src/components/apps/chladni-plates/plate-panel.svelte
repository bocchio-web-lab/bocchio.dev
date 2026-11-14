<script lang="ts">
    import * as Card from "$components/ui/card/index.js";
    import SliderField from "$components/apps/slider-field.svelte";
    import { SHAPES, createShape, type ShapeId } from "$lib/apps/chladni-plates/shapes";
    import type { ChladniStudio } from "$lib/apps/chladni-plates/studio.svelte";
    import { cn } from "$lib/utils";

    interface Props {
        studio: ChladniStudio;
    }

    let { studio }: Props = $props();

    /** A small drawing of every shape, from its outline. */
    const icons = Object.fromEntries(
        SHAPES.map(({ id }) => {
            const outline = createShape(id).outline(48);
            const points = Array.from({ length: outline.length / 2 }, (_, i) => `${outline[2 * i].toFixed(3)},${(-outline[2 * i + 1]).toFixed(3)}`);

            return [id, points.join(" ")];
        }),
    ) as Record<ShapeId, string>;

    const chosen = $derived(SHAPES.find((shape) => shape.id === studio.shapeId));
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">The plate</Card.Title>
        <Card.Description>Any shape has its own resonances, and its own figures.</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5 px-5 pb-5">
        <div class="grid grid-cols-3 gap-2" role="group" aria-label="Shape of the plate">
            {#each SHAPES as shape (shape.id)}
                <button
                    type="button"
                    class={cn(
                        "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-2 text-xs transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                        studio.shapeId === shape.id && "border-primary bg-primary/10 font-medium",
                    )}
                    aria-pressed={studio.shapeId === shape.id}
                    onclick={() => studio.selectShape(shape.id)}
                >
                    <svg viewBox="-0.85 -0.85 1.7 1.7" class="size-9" aria-hidden="true">
                        <polygon points={icons[shape.id]} class="fill-current/15 stroke-current" stroke-width="0.08" stroke-linejoin="round" />
                    </svg>
                    <span class="text-center leading-tight">{shape.label}</span>
                </button>
            {/each}
        </div>

        {#if chosen?.parameter}
            <SliderField
                label={chosen.parameter.label}
                display={chosen.id === "flower" ? `${studio.parameter}` : studio.parameter.toFixed(chosen.parameter.step < 1 ? 2 : 0)}
                value={studio.parameter}
                min={chosen.parameter.min}
                max={chosen.parameter.max}
                step={chosen.parameter.step}
                onchange={(value) => studio.setParameter(value)}
            />
        {/if}

        <SliderField
            label="Size"
            display="{studio.size} cm"
            hint="The side of a square plate with the same area. Bigger plates ring lower."
            value={studio.size}
            min={10}
            max={40}
            step={1}
            onchange={(value) => studio.setSize(value)}
        />

        <SliderField
            label="Thickness"
            display="{studio.thickness.toFixed(1)} mm"
            hint="The plate is aluminium. Thicker plates ring higher, with the same figures."
            value={studio.thickness}
            min={0.5}
            max={3}
            step={0.1}
            onchange={(value) => studio.setThickness(Math.round(value * 10) / 10)}
        />
    </Card.Content>
</Card.Root>

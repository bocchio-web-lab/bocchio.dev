<script lang="ts">
    import { Checkbox } from "$components/ui/checkbox/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Label } from "$components/ui/label/index.js";
    import * as Select from "$components/ui/select/index.js";
    import type { FourierStudio } from "$lib/apps/fourier-drawing/studio.svelte";
    import type { EpicycleOrder } from "$lib/apps/fourier-drawing/spectrum";
    import SliderField from "./slider-field.svelte";

    interface Props {
        studio: FourierStudio;
    }

    let { studio }: Props = $props();

    const orders: { value: EpicycleOrder; label: string }[] = [
        { value: "size", label: "Biggest first" },
        { value: "frequency", label: "Slowest first" },
    ];

    const ready = $derived(studio.drawing !== null);
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Circles</Card.Title>
        <Card.Description>
            Each one adds a little more detail to the drawing.
        </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5 px-5 pb-5">
        <SliderField
            label="Number of circles"
            display="{studio.count.toLocaleString('en-US')} of {studio.maxHarmonics.toLocaleString('en-US')}"
            value={studio.harmonicsPosition}
            min={0}
            max={studio.countScale.steps}
            step={1}
            disabled={!ready || studio.countScale.steps === 0}
            onchange={(position) => studio.setHarmonicsPosition(position)}
        />

        <SliderField
            label="Speed"
            display="{studio.speed.toFixed(2)}×"
            value={studio.speed}
            min={0.25}
            max={4}
            step={0.05}
            onchange={(speed) => (studio.speed = speed)}
        />

        <div class="space-y-2">
            <Label for="circle-order">Which circles come first</Label>
            <Select.Root
                type="single"
                value={studio.order}
                onValueChange={(value) => (studio.order = value as EpicycleOrder)}
                disabled={!ready}
            >
                <Select.Trigger id="circle-order" class="w-full">
                    {orders.find((option) => option.value === studio.order)?.label}
                </Select.Trigger>
                <Select.Content>
                    {#each orders as option (option.value)}
                        <Select.Item value={option.value} label={option.label}>
                            {option.label}
                        </Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
            <p class="text-xs text-muted-foreground">
                {studio.order === "size"
                    ? "The biggest circles, which matter most, are used first."
                    : "The slowest circles are used first, like the terms of a Fourier series."}
            </p>
        </div>

        <div class="space-y-3 pt-1">
            <div class="flex items-center gap-2">
                <Checkbox id="show-circles" bind:checked={studio.showCircles} />
                <Label for="show-circles">Show the circles</Label>
            </div>
            <div class="flex items-center gap-2">
                <Checkbox id="lift-pen" bind:checked={studio.liftPen} />
                <Label for="lift-pen">Lift the pen between strokes</Label>
            </div>
            <div class="flex items-center gap-2">
                <Checkbox id="show-target" bind:checked={studio.showTarget} />
                <Label for="show-target">Show the line to follow</Label>
            </div>
            {#if studio.reference}
                <div class="flex items-center gap-2">
                    <Checkbox id="show-reference" bind:checked={studio.showReference} />
                    <Label for="show-reference">Show the original picture</Label>
                </div>
            {/if}
        </div>
    </Card.Content>
</Card.Root>

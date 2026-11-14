<script lang="ts">
    import { Checkbox } from "$components/ui/checkbox/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Label } from "$components/ui/label/index.js";
    import SliderField from "$components/apps/slider-field.svelte";
    import type { ChladniStudio } from "$lib/apps/chladni-plates/studio.svelte";

    interface Props {
        studio: ChladniStudio;
    }

    let { studio }: Props = $props();
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Shaker and sand</Card.Title>
        <Card.Description>
            The shaker pushes the plate at the point you click, at the frequency you choose.
        </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5 px-5 pb-5">
        <SliderField
            label="Shaker power"
            display="{studio.power.toFixed(1)}×"
            hint="With more power the sand moves further from the resonances, and the lines get thinner."
            value={studio.power}
            min={0.5}
            max={10}
            step={0.1}
            onchange={(value) => studio.setPower(value)}
        />

        <SliderField
            label="Sharpness of the resonances"
            display={studio.quality.toFixed(0)}
            hint="Plates with a high value only respond very close to a resonance."
            value={studio.quality}
            min={10}
            max={300}
            step={5}
            onchange={(value) => studio.setQuality(value)}
        />

        <SliderField
            label="Grains of sand"
            display={studio.grains.toLocaleString("en-US")}
            value={studio.grains}
            min={5000}
            max={60000}
            step={1000}
            onchange={(value) => studio.setGrains(value)}
        />

        <div class="flex items-center gap-2">
            <Checkbox id="show-motion" bind:checked={studio.showMotion} />
            <Label for="show-motion">Show how the plate moves (up and down)</Label>
        </div>
    </Card.Content>
</Card.Root>

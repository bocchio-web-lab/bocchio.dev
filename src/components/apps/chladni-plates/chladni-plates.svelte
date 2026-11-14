<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { ChladniStudio } from "$lib/apps/chladni-plates/studio.svelte";
    import FrequencyBar from "./frequency-bar.svelte";
    import PlateCanvas from "./plate-canvas.svelte";
    import PlatePanel from "./plate-panel.svelte";
    import ShakerPanel from "./shaker-panel.svelte";

    const studio = new ChladniStudio();

    let canvas = $state<HTMLCanvasElement | null>(null);

    // Nothing is worked out on the server: the first plate is analysed as soon as the page is in the browser
    onMount(() => {
        studio.selectShape("square");
    });

    onDestroy(() => studio.dispose());
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <div class="flex min-w-0 flex-col gap-4">
        <PlateCanvas {studio} bind:canvas />
        <FrequencyBar {studio} />
    </div>

    <aside class="flex flex-col gap-4">
        <PlatePanel {studio} />
        <ShakerPanel {studio} />
    </aside>
</div>

<p class="sr-only" role="status" aria-live="polite">
    {studio.busy ? "Working out how the plate vibrates" : `The plate is shaken at ${Math.round(studio.frequency)} hertz`}
</p>

<script lang="ts">
    import { DistanceExplorer } from "$lib/apps/distance-explorer/explorer.svelte";
    import MapCanvas from "./map-canvas.svelte";
    import PlacesPanel from "./places-panel.svelte";
    import RoutePanel from "./route-panel.svelte";

    const explorer = new DistanceExplorer();
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <MapCanvas {explorer} />

    <aside class="flex flex-col gap-4">
        <PlacesPanel {explorer} />
        <RoutePanel {explorer} />
    </aside>
</div>

<p class="sr-only" role="status" aria-live="polite">
    {explorer.summary.stops.length === 0 ? "The route is empty" : `The route has ${explorer.summary.stops.length} points`}
</p>

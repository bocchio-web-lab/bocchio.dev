<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { Label } from "$components/ui/label/index.js";
    import { BODIES, GROUPS } from "$lib/apps/distance-explorer/catalog";
    import { CITIES } from "$lib/apps/distance-explorer/cities";
    import { FIRST_DAY, LAST_DAY, type DistanceExplorer } from "$lib/apps/distance-explorer/explorer.svelte";

    interface Props {
        explorer: DistanceExplorer;
    }

    let { explorer }: Props = $props();

    let latitude = $state<number | null>(null);
    let longitude = $state<number | null>(null);

    const valid = $derived(latitude != null && longitude != null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180);

    function addCity(event: Event & { currentTarget: HTMLSelectElement }) {
        const city = CITIES.find(({ name }) => name === event.currentTarget.value);

        if (city) explorer.addPlace({ ...city }, true);

        event.currentTarget.value = "";
    }

    function addCoordinates(event: SubmitEvent) {
        event.preventDefault();

        if (!valid || latitude == null || longitude == null) return;

        explorer.addPlace({ lat: latitude, lon: longitude }, true);
        latitude = longitude = null;
    }
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">{explorer.scale === "earth" ? "Places on the Earth" : "Bodies in space"}</Card.Title>
        <Card.Description>
            {explorer.scale === "earth"
                ? "Click the globe, or add a place from here. Each one is a point of the route."
                : "Click a body on the map, or add one from here. Each one is a point of the route."}
        </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4 px-5 pb-5">
        {#if explorer.scale === "earth"}
            <div class="space-y-1.5">
                <Label for="city">City</Label>
                <select
                    id="city"
                    class="h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                    disabled={explorer.full}
                    onchange={addCity}
                >
                    <option value="">Choose a city…</option>
                    {#each CITIES as city (city.name)}
                        <option value={city.name}>{city.name}</option>
                    {/each}
                </select>
            </div>

            <form class="space-y-1.5" onsubmit={addCoordinates}>
                <Label for="latitude">Coordinates, in degrees</Label>
                <div class="flex gap-2">
                    <Input id="latitude" type="number" inputmode="decimal" step="any" min="-90" max="90" placeholder="Latitude" aria-label="Latitude" bind:value={latitude} />
                    <Input
                        id="longitude"
                        type="number"
                        inputmode="decimal"
                        step="any"
                        min="-180"
                        max="180"
                        placeholder="Longitude"
                        aria-label="Longitude"
                        bind:value={longitude}
                    />
                    <Button type="submit" variant="outline" disabled={!valid || explorer.full}>Add</Button>
                </div>
                <p class="text-xs text-muted-foreground">North and east are positive, south and west are negative.</p>
            </form>

            <Button variant="outline" class="w-full" disabled={explorer.places.length === 0 || explorer.full} onclick={() => explorer.addAntipode()}>
                Add the opposite point of the Earth
            </Button>
        {:else}
            <div class="space-y-1.5">
                <Label for="day">Day</Label>
                <div class="flex gap-2">
                    <Input
                        id="day"
                        type="date"
                        min={FIRST_DAY}
                        max={LAST_DAY}
                        value={explorer.day}
                        onchange={(event) => {
                            explorer.setDay(event.currentTarget.value);
                            // A day that is not accepted is not left in the box
                            event.currentTarget.value = explorer.day;
                        }}
                    />
                    <Button variant="outline" onclick={() => explorer.setToday()}>Today</Button>
                </div>
                <p class="text-xs text-muted-foreground">The planets move, so how far they are from each other depends on the day (from 1800 to 2050).</p>
            </div>

            {#each GROUPS as group (group)}
                <div class="space-y-2">
                    <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{group}</p>
                    <div class="flex flex-wrap gap-1.5">
                        {#each BODIES.filter((body) => body.group === group) as body (body.id)}
                            <Button variant="outline" size="sm" disabled={explorer.full} onclick={() => explorer.addBody(body)}>
                                <span class="size-2 rounded-full" style:background={body.color}></span>
                                {body.name}
                            </Button>
                        {/each}
                    </div>
                    {#if group === "Solar System"}
                        <p class="text-xs text-muted-foreground">The Moon is too close to the Earth to be seen apart from it on the map.</p>
                    {/if}
                </div>
            {/each}
        {/if}
    </Card.Content>
</Card.Root>

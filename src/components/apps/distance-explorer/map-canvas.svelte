<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import { Card } from "$components/ui/card/index";
    import { Maximize, Minus, Plus } from "@lucide/svelte";
    import { BODIES } from "$lib/apps/distance-explorer/catalog";
    import type { LatLon } from "$lib/apps/distance-explorer/earth";
    import type { DistanceExplorer } from "$lib/apps/distance-explorer/explorer.svelte";
    import { Globe, globeRadius, pickGlobe } from "$lib/apps/distance-explorer/globe";
    import { drawSpace, pickSpace, type SpaceScene } from "$lib/apps/distance-explorer/space-map";
    import { formatCoordinates } from "$lib/apps/distance-explorer/units";
    import { turn } from "$lib/apps/distance-explorer/view";
    import { cn } from "$lib/utils";

    interface Props {
        explorer: DistanceExplorer;
    }

    let { explorer }: Props = $props();

    let canvas = $state<HTMLCanvasElement | null>(null);
    let frame = $state<HTMLDivElement | null>(null);
    let size = $state({ width: 0, height: 0, pixelRatio: 1 });

    let dragging = $state(false);
    /** Whether the picture is being turned: the globe is drawn roughly then. */
    let turning = $state(false);
    /** The place of the Earth that the pointer is over, and the body in space. */
    let overPlace = $state<LatLon | null>(null);
    let overBody = $state<number | null>(null);

    const globe = new Globe();

    // Size of the canvas on the screen
    $effect(() => {
        if (!frame) return;

        const observer = new ResizeObserver(([entry]) => {
            size = {
                width: entry.contentRect.width,
                height: entry.contentRect.height,
                pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            };
        });

        observer.observe(frame);

        return () => observer.disconnect();
    });

    /** What there is in space, as the picture needs it. */
    const spaceScene = (): SpaceScene => ({
        view: explorer.view,
        bodies: BODIES,
        positions: explorer.positions,
        route: explorer.routeIndices,
        hovered: overBody,
    });

    // The picture is drawn again when anything it shows has changed, once for every frame of the screen
    $effect(() => {
        const { width, height, pixelRatio } = size;
        const { scale, view, places } = explorer;
        const rough = turning;
        const scene = scale === "space" ? spaceScene() : null;

        if (!canvas || width === 0 || height === 0) return;

        const handle = requestAnimationFrame(() => {
            const context = canvas?.getContext("2d");

            if (!canvas || !context) return;

            const pixelWidth = Math.round(width * pixelRatio);
            const pixelHeight = Math.round(height * pixelRatio);

            if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
                canvas.width = pixelWidth;
                canvas.height = pixelHeight;
            }

            if (scene) drawSpace(context, scene, width, height, pixelRatio);
            else globe.draw(context, { view, route: places, rough }, width, height, pixelRatio);
        });

        return () => cancelAnimationFrame(handle);
    });

    // Dragging turns the picture, a click adds a point: a click is a drag that has hardly moved
    let last = { x: 0, y: 0 };
    let start = { x: 0, y: 0 };
    let turned = false;

    function point(event: PointerEvent): [number, number] {
        const { left, top } = canvas!.getBoundingClientRect();

        return [event.clientX - left, event.clientY - top];
    }

    function handlePointerDown(event: PointerEvent) {
        dragging = true;
        turned = false;
        last = start = { x: event.clientX, y: event.clientY };
        canvas?.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
        const { width, height } = size;
        const [x, y] = point(event);

        if (!dragging) {
            if (explorer.scale === "earth") overPlace = pickGlobe(explorer.view, width, height, x, y);
            else overBody = pickSpace(spaceScene(), width, height, x, y);

            return;
        }

        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) turned = turning = true;

        if (turned) {
            // On the globe the pointer holds a place and the place follows it; in space it is turned by as much
            const radius = explorer.scale === "earth" ? globeRadius(explorer.view, width, height) : 0.4 * Math.min(width, height);

            explorer.setView(turn(explorer.view, event.clientX - last.x, event.clientY - last.y, radius));
        }

        last = { x: event.clientX, y: event.clientY };
    }

    function handlePointerUp(event: PointerEvent) {
        dragging = false;
        turning = false;

        if (turned) return;

        const { width, height } = size;
        const [x, y] = point(event);

        if (explorer.scale === "earth") {
            const place = pickGlobe(explorer.view, width, height, x, y);

            if (place) explorer.addPlace(place);
        } else {
            const body = pickSpace(spaceScene(), width, height, x, y);

            if (body !== null) explorer.addBody(BODIES[body]);
        }
    }

    function handlePointerLeave() {
        overPlace = null;
        overBody = null;
    }

    // Ctrl + scroll (or a pinch on a trackpad) zooms; a plain scroll still scrolls the page
    $effect(() => {
        const element = canvas;
        if (!element) return;

        const handleWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;

            event.preventDefault();
            explorer.zoomBy(Math.exp(-event.deltaY * 0.0025));
        };

        element.addEventListener("wheel", handleWheel, { passive: false });

        return () => element.removeEventListener("wheel", handleWheel);
    });

    const caption = $derived(
        explorer.scale === "earth"
            ? overPlace
                ? formatCoordinates(overPlace)
                : "Earth"
            : overBody !== null
              ? BODIES[overBody].name
              : "Space",
    );
</script>

<Card bind:ref={frame} class="relative aspect-square w-full overflow-hidden border-slate-800 bg-[#0b1020] sm:aspect-[4/3] lg:max-h-[calc(100svh-11rem)]">
    <canvas
        bind:this={canvas}
        aria-label={explorer.scale === "earth"
            ? "A globe of the Earth: click to add a point to the route, drag to turn it"
            : "A map of the Solar System, the stars and the galaxies: click a body to add it to the route, drag to turn it"}
        class={cn("absolute inset-0 size-full", dragging ? "cursor-grabbing" : explorer.scale === "space" && overBody !== null ? "cursor-pointer" : "cursor-crosshair")}
        style:touch-action="none"
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={() => (dragging = turning = false)}
        onpointerleave={handlePointerLeave}
    >
        A picture of the route.
    </canvas>

    <div class="absolute top-3 left-3 flex gap-1 rounded-md border bg-background/80 p-1 backdrop-blur-sm">
        <Button
            variant={explorer.scale === "earth" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={explorer.scale === "earth"}
            onclick={() => explorer.setScale("earth")}
        >
            Earth
        </Button>
        <Button
            variant={explorer.scale === "space" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={explorer.scale === "space"}
            onclick={() => explorer.setScale("space")}
        >
            Space
        </Button>
    </div>

    <div class="absolute top-3 right-3 flex gap-1 rounded-md border bg-background/80 p-1 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" aria-label="Zoom in" title="Zoom in" onclick={() => explorer.zoomBy(1.4)}>
            <Plus />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Zoom out" title="Zoom out" onclick={() => explorer.zoomBy(1 / 1.4)}>
            <Minus />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Show the whole route" title="Show the whole route" onclick={() => explorer.fit()}>
            <Maximize />
        </Button>
    </div>

    {#if explorer.scale === "earth" && explorer.places.length > 1}
        <div class="pointer-events-none absolute top-16 left-3 space-y-1 rounded-md border bg-background/80 px-2.5 py-1.5 text-xs backdrop-blur-sm">
            <p class="flex items-center gap-2">
                <span class="h-0.5 w-5 rounded bg-primary"></span>
                Shortest way on the surface
            </p>
            <p class="flex items-center gap-2">
                <span class="w-5 border-t-2 border-dashed border-foreground/80"></span>
                Tunnel through the Earth
            </p>
        </div>
    {/if}

    <div
        class="pointer-events-none absolute bottom-3 left-3 flex max-w-[70%] items-center gap-2 rounded-md border bg-background/80 px-2.5 py-1 text-xs backdrop-blur-sm"
    >
        <span class="truncate font-medium tabular-nums">{caption}</span>
    </div>

    <p
        class="pointer-events-none absolute right-3 bottom-3 hidden max-w-[45%] rounded-md border bg-background/80 px-2.5 py-1 text-right text-xs text-muted-foreground backdrop-blur-sm sm:block"
    >
        {explorer.scale === "earth"
            ? "Click to add a point. Drag to turn the globe."
            : "Each ring is ten times farther from the Sun. Click a body to add it."}
    </p>
</Card>

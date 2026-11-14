<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$components/ui/button/index.js";
    import { Card } from "$components/ui/card/index";
    import { Download, LoaderCircle, Shuffle } from "@lucide/svelte";
    import { SHAPES } from "$lib/apps/chladni-plates/shapes";
    import { drawPlate, drawPlate3D, toPlate, type View } from "$lib/apps/chladni-plates/renderer";
    import type { ChladniStudio } from "$lib/apps/chladni-plates/studio.svelte";
    import { DEFAULT_CAMERA } from "$lib/apps/chladni-plates/view3d";
    import { cn } from "$lib/utils";

    interface Props {
        studio: ChladniStudio;
        canvas?: HTMLCanvasElement | null;
    }

    let { studio, canvas = $bindable(null) }: Props = $props();

    let frame = $state<HTMLDivElement | null>(null);
    let dragging = $state(false);

    // Size of the canvas on the screen, and where the plate was drawn last (to turn the pointer into a place on the plate)
    let size = { width: 0, height: 0, pixelRatio: 1 };
    let plateView: View | null = null;

    /** The plate that is in the picture, and the frequency it is shaken at, in words. */
    const label = $derived(SHAPES.find((shape) => shape.id === studio.shapeId)?.label ?? "");

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

    // The clock: lets the sand go on and draws the plate, once for every frame of the screen
    onMount(() => {
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let previous = performance.now();

        let drawn = { revision: -1, key: "" };

        let handle = requestAnimationFrame(function tick(now) {
            studio.advance(Math.min((now - previous) / 1000, 0.1));
            previous = now;

            // The plate that does not move is not drawn again, unless it is moving in the picture
            const key = `${studio.view}|${size.width}x${size.height}|${studio.showMotion}|${studio.prepared ? 1 : 0}`;
            const animated = studio.view === "model" || studio.showMotion;

            if (animated || studio.revision !== drawn.revision || key !== drawn.key) {
                draw(calm);
                drawn = { revision: studio.revision, key };
            }

            handle = requestAnimationFrame(tick);
        });

        return () => cancelAnimationFrame(handle);
    });

    function draw(calm: boolean) {
        const context = canvas?.getContext("2d");
        const prepared = studio.prepared;
        const { width, height, pixelRatio } = size;

        if (!canvas || !context || width === 0 || height === 0) return;

        const pixelWidth = Math.round(width * pixelRatio);
        const pixelHeight = Math.round(height * pixelRatio);

        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }

        if (!prepared) {
            context.clearRect(0, 0, pixelWidth, pixelHeight);
            return;
        }

        // Whoever asks for less motion gets a plate that does not oscillate (the sand still finds its way)
        const phase = calm ? 1.2 : studio.phase;

        if (studio.view === "sand") {
            if (studio.showMotion) prepared.motion.update(phase, studio.peak);

            plateView = drawPlate(
                context,
                studio.layer,
                {
                    shape: prepared.shape,
                    sand: prepared.sand,
                    drive: studio.drive,
                    motion: studio.showMotion ? prepared.motion : null,
                },
                pixelWidth,
                pixelHeight,
                pixelRatio,
            );
        } else {
            drawPlate3D(
                context,
                studio.layer,
                {
                    shape: prepared.shape,
                    mesh: prepared.mesh,
                    bend: prepared.meshBend,
                    grid: prepared.grid,
                    sand: prepared.sand,
                    drive: studio.drive,
                    camera: studio.camera,
                    phase,
                    height: 0.04 + 0.14 * studio.resonance,
                    peak: studio.peak,
                    grains: 9000,
                },
                pixelWidth,
                pixelHeight,
                pixelRatio,
            );
        }
    }

    // Where the pointer was at the last move while the plate is being turned
    let dragX = 0;
    let dragY = 0;

    function place(event: PointerEvent) {
        if (!canvas || !plateView) return;

        const { left, top } = canvas.getBoundingClientRect();
        const [x, y] = toPlate(plateView, event.clientX - left, event.clientY - top);

        studio.moveDrive(x, y);
    }

    function handlePointerDown(event: PointerEvent) {
        dragging = true;
        dragX = event.clientX;
        dragY = event.clientY;
        canvas?.setPointerCapture(event.pointerId);

        if (studio.view === "sand") place(event);
    }

    function handlePointerMove(event: PointerEvent) {
        if (!dragging) return;

        if (studio.view === "sand") {
            place(event);
            return;
        }

        // Dragging turns the plate: sideways goes round it, up and down goes over it
        const { camera } = studio;

        studio.camera = {
            ...camera,
            yaw: camera.yaw - (event.clientX - dragX) * 0.008,
            pitch: Math.max(0.15, Math.min(Math.PI / 2, camera.pitch + (event.clientY - dragY) * 0.008)),
        };

        dragX = event.clientX;
        dragY = event.clientY;
    }

    // Ctrl + scroll (or a pinch on a trackpad) zooms the 3D view; a plain scroll still scrolls the page
    $effect(() => {
        const element = canvas;
        if (!element) return;

        const handleWheel = (event: WheelEvent) => {
            if (studio.view !== "model" || (!event.ctrlKey && !event.metaKey)) return;

            event.preventDefault();

            const { camera } = studio;
            studio.camera = { ...camera, zoom: Math.max(0.6, Math.min(3, camera.zoom * Math.exp(-event.deltaY * 0.0025))) };
        };

        element.addEventListener("wheel", handleWheel, { passive: false });

        return () => element.removeEventListener("wheel", handleWheel);
    });
</script>

<Card bind:ref={frame} class="relative aspect-square w-full overflow-hidden sm:aspect-[4/3] lg:max-h-[calc(100svh-11rem)]">
    <canvas
        bind:this={canvas}
        aria-label="A vibrating plate with sand on it, which gathers along the lines where the plate stands still"
        class={cn("absolute inset-0 size-full", dragging ? "cursor-grabbing" : "cursor-crosshair")}
        style:touch-action={studio.view === "sand" ? "pan-y" : "none"}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={() => (dragging = false)}
        onpointercancel={() => (dragging = false)}
        ondblclick={() => (studio.camera = DEFAULT_CAMERA)}
    >
        A vibrating plate with sand on it.
    </canvas>

    {#if studio.busy}
        <div class="absolute inset-0 grid place-items-center bg-background/40 backdrop-blur-[1px]">
            <div class="flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 text-sm">
                <LoaderCircle class="size-4 animate-spin" />
                Working out how the plate vibrates…
            </div>
        </div>
    {/if}

    <div class="absolute top-3 left-3 flex gap-1 rounded-md border bg-background/80 p-1 backdrop-blur-sm">
        <Button
            variant={studio.view === "sand" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={studio.view === "sand"}
            onclick={() => (studio.view = "sand")}
        >
            Sand
        </Button>
        <Button
            variant={studio.view === "model" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={studio.view === "model"}
            onclick={() => (studio.view = "model")}
        >
            3D
        </Button>
    </div>

    <div class="absolute top-3 right-3 flex gap-1 rounded-md border bg-background/80 p-1 backdrop-blur-sm">
        <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Scatter the sand again"
            title="Scatter the sand again"
            onclick={() => studio.scatter()}
        >
            <Shuffle />
        </Button>
        <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Save a picture"
            title="Save a picture"
            disabled={!canvas || !studio.prepared}
            onclick={() => canvas && studio.exportPng(canvas)}
        >
            <Download />
        </Button>
    </div>

    <div
        class="pointer-events-none absolute bottom-3 left-3 flex max-w-[70%] items-center gap-2 rounded-md border bg-background/80 px-2.5 py-1 text-xs backdrop-blur-sm"
    >
        <span class="truncate font-medium">{label}</span>
        <span class="shrink-0 text-muted-foreground tabular-nums">{Math.round(studio.frequency)} Hz</span>
    </div>

    <p
        class="pointer-events-none absolute right-3 bottom-3 hidden max-w-[40%] rounded-md border bg-background/80 px-2.5 py-1 text-right text-xs text-muted-foreground backdrop-blur-sm sm:block"
    >
        {studio.view === "sand" ? "Click the plate to move the shaker" : "Drag to turn the plate"}
    </p>
</Card>

<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$components/ui/button/index.js";
    import { Card } from "$components/ui/card/index";
    import {
        Crosshair,
        LoaderCircle,
        Maximize,
        ZoomIn,
        ZoomOut,
    } from "@lucide/svelte";
    import {
        DEFAULT_PALETTE,
        MAX_ZOOM,
        drawScene,
        readPalette,
        viewOf,
        zoomCamera,
        type Palette,
    } from "$lib/apps/fourier-drawing/renderer";
    import type { FourierStudio } from "$lib/apps/fourier-drawing/studio.svelte";
    import { cn } from "$lib/utils";

    interface Props {
        studio: FourierStudio;
        canvas?: HTMLCanvasElement | null;
    }

    let { studio, canvas = $bindable(null) }: Props = $props();

    let frame = $state<HTMLDivElement | null>(null);
    let size = $state({ width: 0, height: 0, pixelRatio: 1 });
    let palette = $state.raw<Palette>(DEFAULT_PALETTE);
    let panning = $state(false);

    /** The view can be dragged around once it is magnified, unless it follows the pen. */
    const pannable = $derived(studio.zoom > 1 && !studio.follow);

    /** How much each press of the zoom buttons magnifies. */
    const ZOOM_STEP = 1.5;

    // Colours of the site, which change with the theme
    onMount(() => {
        palette = readPalette();

        const observer = new MutationObserver(() => (palette = readPalette()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style"],
        });

        return () => observer.disconnect();
    });

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

    // The clock: moves the animation forward with every frame
    onMount(() => {
        let previous = performance.now();

        let handle = requestAnimationFrame(function tick(now) {
            studio.advance(Math.min((now - previous) / 1000, 0.1));
            previous = now;
            handle = requestAnimationFrame(tick);
        });

        return () => cancelAnimationFrame(handle);
    });

    // Draws again whenever anything it depends on changes: the position of the pen, the settings, the size...
    $effect(() => {
        const { width, height, pixelRatio } = size;
        const context = canvas?.getContext("2d");

        if (!canvas || !context || width === 0 || height === 0) return;

        const pixelWidth = Math.round(width * pixelRatio);
        const pixelHeight = Math.round(height * pixelRatio);

        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const scene = studio.scene(palette);

        if (scene) drawScene(context, width, height, scene);
        else context.clearRect(0, 0, width, height);
    });

    /** Magnifies the view by `factor`, keeping the drawing point under `(x, y)` where it is. */
    function zoomAt(factor: number, x: number, y: number) {
        const scene = studio.scene(palette);
        if (!scene) return;

        const { zoom, panX, panY } = zoomCamera(scene.bounds, size.width, size.height, scene.camera, factor, x, y);

        studio.zoom = zoom;
        studio.panX = panX;
        studio.panY = panY;
    }

    // Ctrl + scroll (or a pinch on a trackpad) zooms; a plain scroll still scrolls the page
    $effect(() => {
        const element = canvas;
        if (!element) return;

        const handleWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;

            event.preventDefault();

            const { left, top } = element.getBoundingClientRect();
            zoomAt(Math.exp(-event.deltaY * 0.0025), event.clientX - left, event.clientY - top);
        };

        element.addEventListener("wheel", handleWheel, { passive: false });

        return () => element.removeEventListener("wheel", handleWheel);
    });

    // Where the pointer was at the last move while dragging the view
    let dragX = 0;
    let dragY = 0;

    function handlePointerDown(event: PointerEvent) {
        if (!pannable) return;

        panning = true;
        dragX = event.clientX;
        dragY = event.clientY;
        canvas?.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
        if (!panning) return;

        const scene = studio.scene(palette);
        if (!scene) return;

        const { scale } = viewOf(scene, size.width, size.height);

        studio.panX -= (event.clientX - dragX) / scale;
        studio.panY -= (event.clientY - dragY) / scale;

        dragX = event.clientX;
        dragY = event.clientY;
    }

    function toggleFollow() {
        studio.follow = !studio.follow;

        // Following the pen is only interesting close up
        if (studio.follow && studio.zoom < 3) studio.zoom = 4;
    }
</script>

<Card
    bind:ref={frame}
    class="relative aspect-square w-full overflow-hidden sm:aspect-[4/3] lg:max-h-[calc(100svh-11rem)]"
>
    <canvas
        bind:this={canvas}
        aria-label="A drawing being traced by a chain of rotating circles"
        class={cn(
            "absolute inset-0 size-full",
            pannable && (panning ? "cursor-grabbing" : "cursor-grab"),
        )}
        style:touch-action={pannable ? "none" : "auto"}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={() => (panning = false)}
        onpointercancel={() => (panning = false)}
        ondblclick={() => studio.resetView()}
    >
        A drawing being traced by a chain of rotating circles.
    </canvas>

    {#if !studio.drawing}
        <div class="absolute inset-0 grid place-items-center">
            <LoaderCircle class="size-6 animate-spin text-muted-foreground" />
        </div>
    {/if}

    <div
        class="pointer-events-none absolute top-3 left-3 flex max-w-[55%] items-center gap-2 rounded-md border bg-background/80 px-2.5 py-1 text-xs backdrop-blur-sm"
    >
        {#if studio.busy}
            <LoaderCircle class="size-3.5 shrink-0 animate-spin" />
            <span>Looking for lines…</span>
        {:else if studio.source}
            <span class="truncate font-medium">{studio.source.label}</span>
            <span class="shrink-0 text-muted-foreground">
                {studio.count.toLocaleString("en-US")} circles
            </span>
        {/if}
    </div>

    <div
        class="absolute top-3 right-3 flex gap-1 rounded-md border bg-background/80 p-1 backdrop-blur-sm"
    >
        <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={studio.zoom <= 1}
            onclick={() => zoomAt(1 / ZOOM_STEP, size.width / 2, size.height / 2)}
        >
            <ZoomOut />
        </Button>
        <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            title="Zoom in (or Ctrl + scroll)"
            disabled={studio.zoom >= MAX_ZOOM}
            onclick={() => zoomAt(ZOOM_STEP, size.width / 2, size.height / 2)}
        >
            <ZoomIn />
        </Button>
        <Button
            variant={studio.follow ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Follow the pen"
            aria-pressed={studio.follow}
            title="Follow the pen"
            onclick={toggleFollow}
        >
            <Crosshair />
        </Button>
        <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reset the view"
            title="Reset the view (or double click)"
            disabled={studio.zoom === 1 && !studio.follow}
            onclick={() => studio.resetView()}
        >
            <Maximize />
        </Button>
    </div>
</Card>

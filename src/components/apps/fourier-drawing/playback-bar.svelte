<script lang="ts">
    import { Button, buttonVariants } from "$components/ui/button/index.js";
    import * as DropdownMenu from "$components/ui/dropdown-menu/index.js";
    import { Slider } from "$components/ui/slider/index.js";
    import {
        Download,
        FileCode,
        FileImage,
        Film,
        LoaderCircle,
        Pause,
        Play,
        RotateCcw,
        Square,
    } from "@lucide/svelte";
    import { supportedVideoType } from "$lib/apps/fourier-drawing/export";
    import { readPalette } from "$lib/apps/fourier-drawing/renderer";
    import type { FourierStudio } from "$lib/apps/fourier-drawing/studio.svelte";
    import { cn } from "$lib/utils";

    interface Props {
        studio: FourierStudio;
        canvas: HTMLCanvasElement | null;
    }

    let { studio, canvas }: Props = $props();

    const canRecord = $derived(supportedVideoType() !== null);
    const ready = $derived(studio.drawing !== null);

    // While the position is being dragged the animation stands still, then it goes on from where it was left
    let resumeAfterSeek = false;

    function startSeeking() {
        resumeAfterSeek = studio.playing;
        studio.playing = false;

        window.addEventListener(
            "pointerup",
            () => {
                if (resumeAfterSeek) studio.playing = true;
                resumeAfterSeek = false;
            },
            { once: true },
        );
    }
</script>

<div class="flex items-center gap-2 sm:gap-3">
    <Button
        variant="outline"
        size="icon"
        aria-label={studio.playing ? "Pause" : "Play"}
        title={studio.playing ? "Pause" : "Play"}
        disabled={!ready || studio.recording}
        onclick={() => studio.togglePlay()}
    >
        {#if studio.playing}
            <Pause />
        {:else}
            <Play />
        {/if}
    </Button>

    <Button
        variant="outline"
        size="icon"
        aria-label="Start over"
        title="Start over"
        disabled={!ready || studio.recording}
        onclick={() => studio.restart()}
    >
        <RotateCcw />
    </Button>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="min-w-0 flex-1 px-1" onpointerdown={startSeeking}>
        <Slider
            type="single"
            aria-label="Position of the pen along the drawing"
            min={0}
            max={1}
            step={0.001}
            value={studio.time}
            disabled={!ready || studio.recording}
            onValueChange={(value) => (studio.progress = value)}
        />
    </div>

    {#if studio.recording}
        <Button variant="destructive" onclick={() => studio.cancelRecording()}>
            <LoaderCircle class="animate-spin" />
            <span class="hidden sm:inline">Recording…</span>
            <Square class="size-3 fill-current" />
            <span class="sr-only">Stop recording</span>
        </Button>
    {:else}
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                class={cn(buttonVariants({ variant: "default" }))}
                disabled={!ready}
            >
                <Download />
                <span class="hidden sm:inline">Download</span>
                <span class="sr-only sm:hidden">Download</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Item onclick={() => studio.exportPng(readPalette())}>
                    <FileImage />
                    Picture (PNG)
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => studio.exportSvg(readPalette())}>
                    <FileCode />
                    Vector (SVG)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    disabled={!canRecord || !canvas}
                    onclick={() => canvas && studio.startRecording(canvas)}
                >
                    <Film />
                    Video of the animation
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    {/if}
</div>

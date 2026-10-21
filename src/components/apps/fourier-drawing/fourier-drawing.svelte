<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { page } from "$app/state";
    import { afterNavigate, replaceState } from "$app/navigation";
    import { FourierStudio } from "$lib/apps/fourier-drawing/studio.svelte";
    import type { PresetId } from "$lib/apps/fourier-drawing/presets";
    import { cn } from "$lib/utils";
    import FourierCanvas from "./fourier-canvas.svelte";
    import PlaybackBar from "./playback-bar.svelte";
    import SourcePanel from "./source-panel.svelte";
    import EpicyclesPanel from "./epicycles-panel.svelte";
    import AnalysisPanel from "./analysis-panel.svelte";

    const studio = new FourierStudio();

    let canvas = $state<HTMLCanvasElement | null>(null);
    let container = $state<HTMLDivElement | null>(null);
    let dragging = $state(false);

    // The address can ask for a picture: `?image=https://example.com/photo.jpg`, which makes it easy to share
    // one. It is read on arrival, and when a link of the site points here again.
    afterNavigate(({ to }) => showAddress(to?.url ?? page.url));

    function showAddress(url: URL) {
        const link = url.searchParams.get("image");

        if (!link) {
            if (!studio.source) studio.loadPreset("butterfly");
            return;
        }

        if (studio.source?.kind === "url" && studio.source.url === link) return;

        studio.loadUrl(link).then(() => {
            if (studio.drawing) return;

            // Nothing to show after all: start from a shape, but keep telling why the link did not work
            const reason = studio.error;
            studio.loadPreset("butterfly");
            studio.error = reason;
        });
    }

    // Whoever asks for less motion gets the finished drawing, and decides when to play
    onMount(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) studio.playing = false;
    });

    onDestroy(() => studio.dispose());

    /** The picture asked for in the address bar. It is read from the browser, because `page.url` does not follow `replaceState`. */
    function addressLink(): string | null {
        return new URL(window.location.href).searchParams.get("image");
    }

    /** Leaves the link out of the address when the drawing comes from somewhere else. */
    function forgetLink() {
        if (addressLink() !== null) replaceState(page.url.pathname, {});
    }

    function selectPreset(id: PresetId) {
        forgetLink();
        studio.loadPreset(id);
    }

    function selectFile(file: File) {
        forgetLink();
        studio.loadFile(file);
    }

    let requestedLink = "";

    async function selectUrl(link: string) {
        requestedLink = link;

        // A picture embedded in the link itself would make the address enormous
        if (link.startsWith("data:")) forgetLink();
        else replaceState(`${page.url.pathname}?image=${encodeURIComponent(link)}`, {});

        await studio.loadUrl(link);

        // The address should not claim to show a picture that could not be loaded
        const shown = studio.source?.kind === "url" && studio.source.url === link;
        if (!shown && requestedLink === link) forgetLink();
    }

    function firstImage(files: FileList | null | undefined): File | undefined {
        return Array.from(files ?? []).find((file) => file.type.startsWith("image/"));
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        dragging = false;

        const file = firstImage(event.dataTransfer?.files);
        if (file) selectFile(file);
    }

    function handleDragLeave(event: DragEvent) {
        if (!container?.contains(event.relatedTarget as Node | null)) dragging = false;
    }

    // Pictures can also be pasted from the clipboard, unless the visitor is typing somewhere
    function handlePaste(event: ClipboardEvent) {
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, textarea, [contenteditable]")) return;

        const file = firstImage(event.clipboardData?.files);

        if (file) {
            event.preventDefault();
            selectFile(file);
        }
    }

    const status = $derived(
        studio.busy
            ? "Looking for the lines of the picture"
            : studio.error
              ? studio.error
              : studio.drawing
                ? "Drawing ready"
                : "",
    );
</script>

<svelte:window onpaste={handlePaste} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={container}
    class="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
    ondragover={(event) => {
        if (event.dataTransfer?.types.includes("Files")) {
            event.preventDefault();
            dragging = true;
        }
    }}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
>
    <div class="flex min-w-0 flex-col gap-4">
        {#if studio.error}
            <div
                role="alert"
                class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
                {studio.error}
            </div>
        {/if}

        <div class="relative">
            <FourierCanvas {studio} bind:canvas />

            <div
                class={cn(
                    "pointer-events-none absolute inset-0 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-background/80 text-lg font-medium opacity-0 transition-opacity",
                    dragging && "opacity-100",
                )}
                aria-hidden="true"
            >
                Drop the picture to draw it
            </div>
        </div>

        <PlaybackBar {studio} {canvas} />
    </div>

    <aside class="flex flex-col gap-4">
        <SourcePanel
            {studio}
            onpreset={selectPreset}
            onfile={selectFile}
            onurl={selectUrl}
        />
        <AnalysisPanel {studio} />
        <EpicyclesPanel {studio} />
    </aside>
</div>

<p class="sr-only" role="status" aria-live="polite">{status}</p>

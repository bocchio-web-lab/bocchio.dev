import { createCountScale } from './count-scale';
import { drawingFromPath, traceDrawing, type Drawing } from './drawing';
import { buildSvg, downloadBlob, renderPng, slugify, supportedVideoType, toHex, videoExtension } from './export';
import { getPreset, type PresetId } from './presets';
import type { Palette, Scene } from './renderer';
import {
    ImageSourceError,
    describeImageUrl,
    isAbortError,
    loadImageFile,
    loadImageUrl,
    type LoadedImage,
} from './source';
import { circlesForEnergy, sortEpicycles, synthesize, type EpicycleOrder } from './spectrum';
import type { Raster } from './types';
import { DEFAULT_ANALYSIS, type AnalysisOptions } from './vision/pipeline';

/** Seconds the pen takes to go around the drawing once, at normal speed. */
const CYCLE_SECONDS = 16;

/** How long the finished drawing stays on screen before the pen starts over. */
const HOLD_SECONDS = 1.5;

/** Length of a whole turn of the animation, drawing and pause included, as a share of the drawing time. */
const TURN = 1 + HOLD_SECONDS / CYCLE_SECONDS;

/** A new drawing starts with as few circles as it takes to carry this share of its energy: sharp enough, yet far from all. */
const STARTING_ENERGY = 0.99999;

/** Wait before analysing again, so that dragging a slider does not run the analysis for every tick. */
const REANALYSE_DELAY = 150;

export type Source =
    | { kind: 'preset'; id: PresetId; label: string }
    | { kind: 'file'; label: string }
    | { kind: 'url'; label: string; url: string };

/** Gives the browser a moment to show the "busy" state before the analysis takes the page over. */
function breathe(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 50));
}

/**
 * Everything the Fourier drawing page knows and does: what is being drawn, how it is analysed,
 * how it is played and shown, and how it is exported.
 */
export class FourierStudio {
    // What is being drawn
    source = $state.raw<Source | null>(null);
    drawing = $state.raw<Drawing | null>(null);
    /** The picture the lines were found in, to be shown behind the drawing. */
    reference = $state.raw<HTMLCanvasElement | null>(null);
    busy = $state(false);
    error = $state<string | null>(null);

    // How pictures are turned into lines
    smoothing = $state(DEFAULT_ANALYSIS.smoothing);
    sensitivity = $state(DEFAULT_ANALYSIS.sensitivity);
    minLength = $state(DEFAULT_ANALYSIS.minLength);

    // The circles
    order = $state<EpicycleOrder>('size');
    harmonics = $state(0);

    // Playback
    playing = $state(true);
    speed = $state(1);
    /** Position in the animation: 0 to 1 while the pen draws, then a little more during the pause. */
    progress = $state(0);

    // View
    zoom = $state(1);
    panX = $state(0);
    panY = $state(0);
    follow = $state(false);

    // Layers
    showCircles = $state(true);
    showReference = $state(false);
    showTarget = $state(false);
    liftPen = $state(true);

    recording = $state(false);

    epicycles = $derived(this.drawing ? sortEpicycles(this.drawing.spectrum, this.order) : null);
    /** Circles beyond this number are too small to make any difference. */
    maxHarmonics = $derived(this.epicycles?.useful ?? 0);
    /** Circles actually in use. */
    count = $derived(Math.min(this.harmonics, this.maxHarmonics));
    /** The drawing the circles make with the current settings. */
    trace = $derived(this.epicycles ? synthesize(this.epicycles, this.count) : null);
    /** Position of the pen in its cycle, from 0 to 1. */
    time = $derived(Math.min(1, this.progress));
    /** Whether the lines were found in a picture, so that they depend on the analysis settings. */
    fromImage = $derived(this.source !== null && this.source.kind !== 'preset');
    /** How the positions of the "circles" slider translate into a number of circles. */
    countScale = $derived(createCountScale(this.maxHarmonics));
    /** Where the thumb of the "circles" slider sits. */
    harmonicsPosition = $derived(this.countScale.position(this.count));

    #raster: Raster | null = null;
    #request = 0;
    #controller: AbortController | null = null;
    #reanalyse: ReturnType<typeof setTimeout> | undefined;
    #recorder: MediaRecorder | null = null;
    #recordingCancelled = false;

    // Choosing what to draw

    loadPreset(id: PresetId): void {
        this.#cancelPending();

        const preset = getPreset(id);

        this.#raster = null;
        this.#show(drawingFromPath(preset.build(), 1), { kind: 'preset', id: preset.id, label: preset.label }, null);
    }

    loadFile(file: File): Promise<void> {
        return this.#load({ kind: 'file', label: file.name }, () => loadImageFile(file));
    }

    loadUrl(url: string): Promise<void> {
        return this.#load({ kind: 'url', label: describeImageUrl(url), url }, (signal) => loadImageUrl(url, signal));
    }

    /** Looks for lines again with the current settings, a moment after the last change. */
    reanalyze(): void {
        clearTimeout(this.#reanalyse);

        if (!this.#raster) return;

        this.#reanalyse = setTimeout(async () => {
            const raster = this.#raster;
            if (!raster) return;

            const request = ++this.#request;
            this.busy = true;

            try {
                await breathe();
                if (request !== this.#request) return;

                const drawing = traceDrawing(raster, this.#options());

                if (drawing) {
                    this.error = null;
                    this.drawing = drawing;
                } else {
                    this.error = 'No lines found with these settings. Try raising the detail or lowering the noise filter.';
                }
            } catch (error) {
                console.error(error);
                this.error = 'Something went wrong while looking for the lines';
            } finally {
                if (request === this.#request) this.busy = false;
            }
        }, REANALYSE_DELAY);
    }

    async #load(source: Source, loader: (signal: AbortSignal) => Promise<LoadedImage>): Promise<void> {
        this.#cancelPending();

        const request = ++this.#request;
        const controller = new AbortController();

        this.#controller = controller;
        this.busy = true;
        this.error = null;

        try {
            const image = await loader(controller.signal);
            if (request !== this.#request) return;

            await breathe();
            if (request !== this.#request) return;

            const drawing = traceDrawing(image.raster, this.#options());

            if (!drawing) {
                this.error = 'No lines found in this picture. Try a clearer one, or raise the detail.';
                return;
            }

            this.#raster = image.raster;
            this.#show(drawing, source, image.canvas);
        } catch (error) {
            if (request !== this.#request || isAbortError(error)) return;

            this.error = error instanceof ImageSourceError ? error.message : 'Something went wrong while loading the picture';

            if (!(error instanceof ImageSourceError)) console.error(error);
        } finally {
            if (request === this.#request) this.busy = false;
        }
    }

    #cancelPending(): void {
        clearTimeout(this.#reanalyse);
        this.#controller?.abort();
        this.#controller = null;
        this.#request++;
        this.busy = false;
    }

    /** The current analysis settings, as they are at this very moment. */
    #options(): AnalysisOptions {
        return { smoothing: this.smoothing, sensitivity: this.sensitivity, minLength: this.minLength };
    }

    #show(drawing: Drawing, source: Source, reference: HTMLCanvasElement | null): void {
        const epicycles = sortEpicycles(drawing.spectrum, this.order);

        this.source = source;
        this.reference = reference;
        this.drawing = drawing;
        this.error = null;
        this.harmonics = Math.min(epicycles.useful, Math.max(10, circlesForEnergy(epicycles, STARTING_ENERGY)));

        this.resetView();

        // A paused animation has nobody waiting to see the pen start: show the finished drawing right away
        this.progress = this.playing ? 0 : 1;
    }

    // Circles

    /** Sets how many circles are used from the position of the slider thumb. */
    setHarmonicsPosition(position: number): void {
        this.harmonics = this.countScale.count(position);
    }

    // Playback

    restart(): void {
        this.progress = 0;
    }

    togglePlay(): void {
        // Playing a finished drawing again means starting over
        if (!this.playing && this.progress >= 1) this.restart();

        this.playing = !this.playing;
    }

    /** Moves the animation forward by `seconds` of real time. */
    advance(seconds: number): void {
        if (!this.playing || !this.drawing) return;

        this.progress += (seconds * this.speed) / CYCLE_SECONDS;

        if (this.progress < TURN) return;

        if (this.recording) {
            // The video ends on the finished drawing
            this.progress = TURN;
            this.#stopRecorder();
        } else {
            this.progress %= TURN;
        }
    }

    // View

    resetView(): void {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.follow = false;
    }

    // Output

    /** Everything the renderer needs to draw the current frame. */
    scene(palette: Palette): Scene | null {
        const { drawing, epicycles, trace } = this;

        if (!drawing || !epicycles || !trace) return null;

        return {
            bounds: drawing.bounds,
            epicycles,
            count: this.count,
            trace,
            target: drawing.path,
            reference: this.reference,
            time: this.time,
            camera: { zoom: this.zoom, panX: this.panX, panY: this.panY, follow: this.follow },
            layers: {
                circles: this.showCircles,
                reference: this.showReference,
                target: this.showTarget,
                liftPen: this.liftPen,
            },
            palette,
        };
    }

    get fileName(): string {
        return `fourier-${slugify(this.source?.label ?? 'drawing')}-${this.count}-circles`;
    }

    async exportPng(palette: Palette): Promise<void> {
        const scene = this.scene(palette);
        if (!scene) return;

        try {
            downloadBlob(await renderPng(scene), `${this.fileName}.png`);
        } catch (error) {
            console.error(error);
            this.error = "The image couldn't be created";
        }
    }

    exportSvg(palette: Palette): void {
        const { drawing, trace } = this;
        if (!drawing || !trace) return;

        const svg = buildSvg(trace, this.liftPen ? drawing.path.pen : null, drawing.bounds, {
            stroke: toHex(palette.primary),
            background: toHex(palette.background),
        });

        downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${this.fileName}.svg`);
    }

    /** Records one full turn of the animation, from the first line to the finished drawing, as a video. */
    startRecording(canvas: HTMLCanvasElement): void {
        const type = supportedVideoType();
        if (!type || this.recording || !this.drawing) return;

        const chunks: Blob[] = [];
        let recorder: MediaRecorder;

        try {
            recorder = new MediaRecorder(canvas.captureStream(60), { mimeType: type, videoBitsPerSecond: 10_000_000 });
        } catch (error) {
            console.error(error);
            this.error = "Your browser can't record videos of the drawing";
            return;
        }

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
        };

        recorder.onstop = () => {
            if (!this.#recordingCancelled && chunks.length > 0) {
                downloadBlob(new Blob(chunks, { type }), `${this.fileName}.${videoExtension(type)}`);
            }

            this.#recorder = null;
            this.recording = false;
        };

        this.#recorder = recorder;
        this.#recordingCancelled = false;
        this.recording = true;
        this.playing = true;
        this.restart();

        recorder.start(250);
    }

    cancelRecording(): void {
        this.#recordingCancelled = true;
        this.#stopRecorder();
    }

    #stopRecorder(): void {
        if (this.#recorder?.state === 'recording') this.#recorder.stop();
    }

    /** Stops everything that is going on in the background. */
    dispose(): void {
        this.#cancelPending();
        this.cancelRecording();
    }
}

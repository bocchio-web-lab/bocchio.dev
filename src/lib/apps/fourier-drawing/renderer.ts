import { chainAt, type Epicycles } from './spectrum';
import type { Bounds, Point, SampledPath } from './types';

export interface Palette {
    background: string;
    foreground: string;
    muted: string;
    primary: string;
}

export interface Camera {
    /** 1 fits the whole drawing in the view, bigger values magnify it. */
    zoom: number;
    /** Shift of the view away from the centre of the drawing, in drawing units. */
    panX: number;
    panY: number;
    /** Keeps the pen at the centre of the view. */
    follow: boolean;
}

export interface Layers {
    circles: boolean;
    /** The original picture, faded, behind the drawing. */
    reference: boolean;
    /** The lines found in the picture, which the epicycles are trying to follow. */
    target: boolean;
    /** Leaves out the segments where the pen travels between two strokes. */
    liftPen: boolean;
}

export interface Scene {
    bounds: Bounds;
    epicycles: Epicycles;
    /** How many circles are used. */
    count: number;
    /** The finished drawing made by those circles. */
    trace: { x: Float64Array; y: Float64Array };
    /** The path that was analysed, with the pen flags that tell strokes from jumps. */
    target: SampledPath;
    reference: HTMLCanvasElement | null;
    /** Where we are in the cycle, from 0 to 1. */
    time: number;
    camera: Camera;
    layers: Layers;
    palette: Palette;
}

/**
 * Where the drawing is on the screen: a point of the drawing at `(x, y)` is shown at
 * `(x * scale + offsetX, y * scale + offsetY)`. The view is `width` × `height` pixels.
 */
export interface View {
    scale: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
}

/** Share of the view left empty around the drawing when it is fitted. */
const MARGIN = 0.07;

/** The most the view can be magnified. */
export const MAX_ZOOM = 40;

const ORIGIN: Point = { x: 0, y: 0 };

/** Circles smaller than this on screen (in pixels) are not worth drawing, nor are more than this many in all. */
const MIN_CIRCLE_RADIUS = 0.75;
const MAX_CIRCLES = 600;

const TAU = Math.PI * 2;

// Reused every frame, so that drawing does not allocate
let chainX = new Float64Array(0);
let chainY = new Float64Array(0);

/** Used until the real colours can be read, which is not possible while the page is rendered on the server. */
export const DEFAULT_PALETTE: Palette = {
    background: '#ffffff',
    foreground: '#1c1917',
    muted: '#78716c',
    primary: '#f97316',
};

/** Reads the colours of the site theme, which change between light and dark mode. */
export function readPalette(element: Element = document.documentElement): Palette {
    const style = getComputedStyle(element);
    const read = (name: keyof Palette, variable: string) => style.getPropertyValue(variable).trim() || DEFAULT_PALETTE[name];

    return {
        background: read('background', '--background'),
        foreground: read('foreground', '--foreground'),
        muted: read('muted', '--muted-foreground'),
        primary: read('primary', '--primary'),
    };
}

export function fitScale(bounds: Bounds, width: number, height: number): number {
    const drawingWidth = Math.max(bounds.maxX - bounds.minX, 1);
    const drawingHeight = Math.max(bounds.maxY - bounds.minY, 1);

    return Math.min((width * (1 - 2 * MARGIN)) / drawingWidth, (height * (1 - 2 * MARGIN)) / drawingHeight);
}

export function resolveView(bounds: Bounds, width: number, height: number, camera: Camera, tip: Point): View {
    const scale = fitScale(bounds, width, height) * camera.zoom;

    // The point of the drawing that sits in the middle of the view
    const centerX = camera.follow ? tip.x : (bounds.minX + bounds.maxX) / 2 + camera.panX;
    const centerY = camera.follow ? tip.y : (bounds.minY + bounds.maxY) / 2 + camera.panY;

    return { scale, offsetX: width / 2 - centerX * scale, offsetY: height / 2 - centerY * scale, width, height };
}

/** The view for the current frame, which depends on where the pen is when the camera follows it. */
export function viewOf(scene: Scene, width: number, height: number): View {
    let tip = ORIGIN;

    if (scene.camera.follow) {
        ensureScratch(scene.count + 1);
        chainAt(scene.epicycles, scene.count, clamp01(scene.time), chainX, chainY);
        tip = { x: chainX[scene.count], y: chainY[scene.count] };
    }

    return resolveView(scene.bounds, width, height, scene.camera, tip);
}

/**
 * The camera after magnifying the view by `factor` around the point `(x, y)` of the screen, which keeps showing
 * the same point of the drawing.
 */
export function zoomCamera(
    bounds: Bounds,
    width: number,
    height: number,
    camera: Camera,
    factor: number,
    x: number,
    y: number,
): Camera {
    const zoom = Math.min(MAX_ZOOM, Math.max(1, camera.zoom * factor));

    // Back to the whole drawing: there is nothing left to shift
    if (zoom === 1) return { ...camera, zoom, panX: 0, panY: 0 };

    // The pen stays in the middle of the view while it is followed, so only the magnification changes
    if (camera.follow) return { ...camera, zoom };

    const before = resolveView(bounds, width, height, camera, ORIGIN);
    const scale = (before.scale / camera.zoom) * zoom;

    // The point of the drawing that is under (x, y) now must still be there afterwards,
    // and that decides which point ends up in the middle of the view
    const pointX = (x - before.offsetX) / before.scale;
    const pointY = (y - before.offsetY) / before.scale;

    return {
        ...camera,
        zoom,
        panX: pointX - (x - width / 2) / scale - (bounds.minX + bounds.maxX) / 2,
        panY: pointY - (y - height / 2) / scale - (bounds.minY + bounds.maxY) / 2,
    };
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

function ensureScratch(size: number): void {
    if (chainX.length >= size) return;

    chainX = new Float64Array(size);
    chainY = new Float64Array(size);
}

/** Adds the polyline through the first `last + 1` points to the current path, lifting the pen where `pen` says so. */
function polyline(
    ctx: CanvasRenderingContext2D,
    x: Float64Array,
    y: Float64Array,
    pen: Uint8Array | null,
    last: number,
    view: View,
): void {
    for (let i = 0; i <= last; i++) {
        const px = x[i] * view.scale + view.offsetX;
        const py = y[i] * view.scale + view.offsetY;

        if (i === 0 || (pen && !pen[i - 1])) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
}

/**
 * Draws one frame. The context is expected to be scaled so that one unit is a CSS pixel;
 * `opaque` paints the background instead of leaving it transparent.
 */
export function drawScene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    { opaque = false } = {},
): void {
    const { epicycles, count, trace, target, palette, layers } = scene;
    const time = clamp01(scene.time);

    ensureScratch(count + 1);
    chainAt(epicycles, count, time, chainX, chainY);

    const tip = { x: chainX[count], y: chainY[count] };
    const view = resolveView(scene.bounds, width, height, scene.camera, tip);

    ctx.save();

    if (opaque) {
        ctx.fillStyle = palette.background;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.clearRect(0, 0, width, height);
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (layers.reference && scene.reference) {
        ctx.globalAlpha = 0.3;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(
            scene.reference,
            view.offsetX,
            view.offsetY,
            scene.reference.width * view.scale,
            scene.reference.height * view.scale,
        );
        ctx.globalAlpha = 1;
    }

    if (layers.target) {
        ctx.beginPath();
        polyline(ctx, target.x, target.y, target.pen, target.x.length - 1, view);
        ctx.strokeStyle = palette.muted;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // The drawing so far: everything up to the current sample, then a last stretch to the exact position of the pen
    const samples = trace.x.length;
    const last = Math.min(samples - 1, Math.floor(time * samples));
    const pen = layers.liftPen ? target.pen : null;

    ctx.beginPath();
    polyline(ctx, trace.x, trace.y, pen, last, view);

    const penX = tip.x * view.scale + view.offsetX;
    const penY = tip.y * view.scale + view.offsetY;

    if (!pen || pen[last]) ctx.lineTo(penX, penY);

    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 2.25;
    ctx.stroke();

    if (layers.circles) drawEpicycles(ctx, scene, view);

    // The pen itself, with a halo so that it stands out on the lines
    ctx.beginPath();
    ctx.arc(penX, penY, 6, 0, TAU);
    ctx.fillStyle = palette.background;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(penX, penY, 3.75, 0, TAU);
    ctx.fillStyle = palette.primary;
    ctx.fill();

    ctx.restore();
}

function drawEpicycles(ctx: CanvasRenderingContext2D, scene: Scene, view: View): void {
    const { epicycles, count, palette } = scene;
    const shown = Math.min(count, MAX_CIRCLES);

    // Circles
    ctx.beginPath();

    for (let i = 0; i < shown; i++) {
        const radius = epicycles.radius[i] * view.scale;
        if (radius < MIN_CIRCLE_RADIUS) continue;

        const x = chainX[i] * view.scale + view.offsetX;
        const y = chainY[i] * view.scale + view.offsetY;

        // Nothing to draw if the circle is entirely outside the view
        if (x + radius < 0 || y + radius < 0 || x - radius > view.width || y - radius > view.height) continue;

        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, TAU);
    }

    ctx.strokeStyle = palette.foreground;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Arms: the chain that goes from the centre to the pen
    ctx.beginPath();

    for (let i = 0; i <= count; i++) {
        const x = chainX[i] * view.scale + view.offsetX;
        const y = chainY[i] * view.scale + view.offsetY;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.globalAlpha = 0.7;
    ctx.stroke();

    // The fixed centre of the first circle
    ctx.beginPath();
    ctx.arc(chainX[0] * view.scale + view.offsetX, chainY[0] * view.scale + view.offsetY, 2.5, 0, TAU);
    ctx.fillStyle = palette.foreground;
    ctx.fill();

    ctx.globalAlpha = 1;
}

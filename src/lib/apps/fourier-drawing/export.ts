import { drawScene, type Scene } from './renderer';
import type { Bounds } from './types';

/** Longest side, in pixels, of the exported picture. */
const PNG_SIZE = 2000;

/** Containers the browser might be able to record, best supported by players first. */
const VIDEO_TYPES = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    // Give the browser time to start the download before the link goes away
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A name that is safe to use in a file name. */
export function slugify(text: string): string {
    return text.toLowerCase().replace(/\.[a-z0-9]{2,5}$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'drawing';
}

/** Any CSS colour (the theme uses the modern `hsl(24 95% 53%)` syntax) as a `#rrggbb` string every program understands. */
export function toHex(color: string): string {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return color;

    context.fillStyle = '#000000';
    context.fillStyle = color;

    return context.fillStyle;
}

/** The finished drawing as a clean picture, on the background colour of the site. */
export function renderPng(scene: Scene): Promise<Blob> {
    const { bounds } = scene;
    const ratio = Math.min(4, Math.max(0.25, (bounds.maxX - bounds.minX) / Math.max(bounds.maxY - bounds.minY, 1)));

    // The drawing code works in CSS pixels, so draw on a 1000-unit wide canvas and let the scale do the rest
    const width = ratio >= 1 ? 1000 : Math.round(1000 * ratio);
    const height = ratio >= 1 ? Math.round(1000 / ratio) : 1000;
    const pixelRatio = PNG_SIZE / Math.max(width, height);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext('2d');
    if (!context) return Promise.reject(new Error('Your browser cannot create images'));

    context.scale(pixelRatio, pixelRatio);

    drawScene(
        context,
        width,
        height,
        {
            ...scene,
            time: 1,
            camera: { zoom: 1, panX: 0, panY: 0, follow: false },
            layers: { circles: false, reference: false, target: false, liftPen: scene.layers.liftPen },
        },
        { opaque: true },
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The image could not be created'))), 'image/png');
    });
}

const format = (value: number) => String(Math.round(value * 10) / 10);

/**
 * The finished drawing as a vector image: one path that can be scaled, edited or sent to a plotter.
 * Colours are written as they are given, so they should be ones every program knows, like `#f97316`.
 */
export function buildSvg(
    trace: { x: Float64Array; y: Float64Array },
    pen: Uint8Array | null,
    bounds: Bounds,
    colors: { stroke: string; background: string },
): string {
    const drawingWidth = bounds.maxX - bounds.minX;
    const drawingHeight = bounds.maxY - bounds.minY;
    const margin = Math.max(drawingWidth, drawingHeight) * 0.05;

    const x = bounds.minX - margin;
    const y = bounds.minY - margin;
    const width = drawingWidth + margin * 2;
    const height = drawingHeight + margin * 2;

    const samples = trace.x.length;
    let path = '';

    for (let i = 0; i < samples; i++) {
        const command = i === 0 || (pen && !pen[i - 1]) ? 'M' : 'L';
        path += `${command}${format(trace.x[i])} ${format(trace.y[i])}`;
    }

    // Back to the start, to close the last stretch
    if (!pen || pen[samples - 1]) path += `L${format(trace.x[0])} ${format(trace.y[0])}`;

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${format(x)} ${format(y)} ${format(width)} ${format(height)}" width="${format(width)}" height="${format(height)}">`,
        `<rect x="${format(x)}" y="${format(y)}" width="${format(width)}" height="${format(height)}" fill="${colors.background}"/>`,
        `<path d="${path}" fill="none" stroke="${colors.stroke}" stroke-width="${format(Math.max(drawingWidth, drawingHeight) / 300)}" stroke-linecap="round" stroke-linejoin="round"/>`,
        '</svg>',
    ].join('\n');
}

/** The video format this browser can record the canvas in, if any. */
export function supportedVideoType(): string | null {
    if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return null;

    return VIDEO_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function videoExtension(type: string): string {
    return type.startsWith('video/mp4') ? 'mp4' : 'webm';
}

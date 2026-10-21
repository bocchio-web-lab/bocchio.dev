import type { Point, Raster } from '../types';
import { detectEdges } from './canny';
import { toLuminance } from './luminance';
import { polylineLength, smoothStroke, traceStrokes } from './strokes';
import { thin } from './thinning';

export interface AnalysisOptions {
    /** Blur applied before looking for edges, in pixels: bigger values keep only the broad lines. */
    smoothing: number;
    /** From 0 to 1: how faint a line can be and still be drawn. */
    sensitivity: number;
    /** Strokes shorter than this (in pixels) are taken for noise and dropped. */
    minLength: number;
}

export const DEFAULT_ANALYSIS: AnalysisOptions = {
    smoothing: 1.6,
    sensitivity: 0.5,
    minLength: 14,
};

/** Upper limit to the total length of ink, which a very busy picture (a texture, noise) could push to the sky. */
const MAX_INK = 40000;

/** Half-width of the moving average that irons out the staircase of the pixel grid. */
const SMOOTHING_RADIUS = 2;

/**
 * Finds the main lines of an image: the strokes a pen would follow to sketch it.
 * Edges are detected, thinned to a single pixel, chained into strokes and cleaned up.
 */
export function extractStrokes(raster: Raster, options: AnalysisOptions): Point[][] {
    const { width, height } = raster;
    const grey = toLuminance(raster);
    const { mask, magnitude } = detectEdges(grey, width, height, {
        sigma: options.smoothing,
        sensitivity: options.sensitivity,
    });

    thin(mask, width, height);

    const candidates = traceStrokes(mask, width, height, magnitude)
        .map((stroke) => {
            const points = smoothStroke(stroke.points, SMOOTHING_RADIUS);
            const length = polylineLength(points);

            return { points, length, prominence: length * stroke.strength };
        })
        .filter((stroke) => stroke.length >= options.minLength)
        .sort((a, b) => b.prominence - a.prominence);

    // Too many lines to draw: keep the longest and strongest ones
    const kept: Point[][] = [];
    let ink = 0;

    for (const { points, length } of candidates) {
        if (ink + length > MAX_INK && kept.length > 0) continue;

        kept.push(points);
        ink += length;
    }

    return kept;
}

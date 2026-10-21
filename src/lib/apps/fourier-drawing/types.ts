/**
 * Shared types of the Fourier drawing engine.
 *
 * Everything is expressed on the drawing plane: units are image pixels and the y axis points down,
 * exactly like a canvas, so no conversion is needed when rendering.
 */

export interface Point {
    x: number;
    y: number;
}

export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * A closed path sampled at N evenly spaced instants of a full cycle: the input of the Fourier analysis.
 * Sample `i` is the pen position at time `i / N`; after the last sample the path wraps back to the first.
 */
export interface SampledPath {
    x: Float64Array;
    y: Float64Array;
    /**
     * `pen[i]` is 1 when the segment going from sample `i` to sample `i + 1` is inked, and 0 when the pen
     * is lifted to travel between two separate strokes.
     */
    pen: Uint8Array;
}

/** Pixel data in the same layout as the browser's `ImageData`, so the engine stays free of DOM types. */
export interface Raster {
    width: number;
    height: number;
    /** RGBA, 4 bytes per pixel, row by row. */
    data: Uint8ClampedArray;
}

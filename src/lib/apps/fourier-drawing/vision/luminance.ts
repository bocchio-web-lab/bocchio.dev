import type { Raster } from '../types';

/**
 * Grey levels (0-255) of an image.
 *
 * Transparent areas are composited over a backdrop that contrasts with the visible pixels — black behind
 * light artwork, white behind dark artwork — so the outline of a cut-out logo is never lost.
 */
export function toLuminance(raster: Raster): Float32Array {
    const { data, width, height } = raster;
    const pixels = width * height;
    const grey = new Float32Array(pixels);

    let visibleSum = 0;
    let visibleWeight = 0;

    for (let i = 0; i < pixels; i++) {
        const o = i * 4;
        const alpha = data[o + 3] / 255;
        const luma = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];

        grey[i] = luma;
        visibleSum += luma * alpha;
        visibleWeight += alpha;
    }

    const backdrop = visibleWeight > 0 && visibleSum / visibleWeight < 127.5 ? 255 : 0;

    for (let i = 0; i < pixels; i++) {
        const alpha = data[i * 4 + 3] / 255;
        if (alpha < 1) grey[i] = grey[i] * alpha + backdrop * (1 - alpha);
    }

    return grey;
}

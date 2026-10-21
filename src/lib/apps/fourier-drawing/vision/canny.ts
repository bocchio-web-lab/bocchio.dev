/**
 * Canny edge detector: Gaussian blur → Sobel gradient → non-maximum suppression → hysteresis thresholding.
 * It works on plain arrays so it can run anywhere, including unit tests.
 */

export interface EdgeOptions {
    /** Standard deviation of the Gaussian blur applied first, in pixels. Bigger values ignore finer details. */
    sigma: number;
    /** From 0 to 1: how faint an edge can be and still be kept. */
    sensitivity: number;
}

export interface EdgeMap {
    /** 1 on the pixels that belong to an edge. Roughly one pixel thick, never touching the image border. */
    mask: Uint8Array;
    /** Gradient strength on the ridge pixels, 0 anywhere else. */
    magnitude: Float32Array;
}

/**
 * Edges weaker than this (in Sobel units, about 2 grey levels of contrast) are noise, whatever the sensitivity.
 * It is also what makes a flat image yield no edges at all.
 */
const NOISE_FLOOR = 8;

/** The "strong edge" level is measured on this percentile of the ridge strengths, which ignores a few outliers. */
const REFERENCE_PERCENTILE = 0.95;

/** Share of the reference strength that starts a strong edge, at the least and the most sensitive settings. */
const HIGH_THRESHOLD_RANGE = { least: 0.8, most: 0.06 };

/** Weak pixels join an edge when they touch a strong one: this is how much weaker they may be. */
const LOW_TO_HIGH_RATIO = 0.4;

const TAN_22_5 = Math.SQRT2 - 1;
const TAN_67_5 = Math.SQRT2 + 1;

export function gaussianBlur(source: Float32Array, width: number, height: number, sigma: number): Float32Array {
    if (sigma < 0.3) return source.slice();

    const radius = Math.max(1, Math.ceil(sigma * 3));
    const kernel = new Float32Array(radius * 2 + 1);
    let total = 0;

    for (let i = -radius; i <= radius; i++) {
        kernel[i + radius] = Math.exp(-(i * i) / (2 * sigma * sigma));
        total += kernel[i + radius];
    }

    for (let i = 0; i < kernel.length; i++) kernel[i] /= total;

    // Two 1D passes are equivalent to the 2D kernel, with the borders clamped
    const horizontal = new Float32Array(source.length);

    for (let y = 0; y < height; y++) {
        const row = y * width;

        for (let x = 0; x < width; x++) {
            let sum = 0;

            for (let k = -radius; k <= radius; k++) {
                const xx = Math.min(width - 1, Math.max(0, x + k));
                sum += source[row + xx] * kernel[k + radius];
            }

            horizontal[row + x] = sum;
        }
    }

    const blurred = new Float32Array(source.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;

            for (let k = -radius; k <= radius; k++) {
                const yy = Math.min(height - 1, Math.max(0, y + k));
                sum += horizontal[yy * width + x] * kernel[k + radius];
            }

            blurred[y * width + x] = sum;
        }
    }

    return blurred;
}

function sobel(image: Float32Array, width: number, height: number) {
    const gx = new Float32Array(image.length);
    const gy = new Float32Array(image.length);
    const magnitude = new Float32Array(image.length);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;

            const tl = image[i - width - 1];
            const tc = image[i - width];
            const tr = image[i - width + 1];
            const ml = image[i - 1];
            const mr = image[i + 1];
            const bl = image[i + width - 1];
            const bc = image[i + width];
            const br = image[i + width + 1];

            gx[i] = tr + 2 * mr + br - (tl + 2 * ml + bl);
            gy[i] = bl + 2 * bc + br - (tl + 2 * tc + tr);
            magnitude[i] = Math.hypot(gx[i], gy[i]);
        }
    }

    return { gx, gy, magnitude };
}

/** Keeps only the pixels that are at least as strong as both neighbours along the direction of the gradient. */
function suppressNonMaxima(
    magnitude: Float32Array,
    gx: Float32Array,
    gy: Float32Array,
    width: number,
    height: number,
): Float32Array {
    const ridges = new Float32Array(magnitude.length);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            const m = magnitude[i];

            if (m === 0) continue;

            const ax = Math.abs(gx[i]);
            const ay = Math.abs(gy[i]);
            let before: number;
            let after: number;

            if (ay <= ax * TAN_22_5) {
                before = magnitude[i - 1];
                after = magnitude[i + 1];
            } else if (ay >= ax * TAN_67_5) {
                before = magnitude[i - width];
                after = magnitude[i + width];
            } else if (gx[i] * gy[i] > 0) {
                before = magnitude[i - width - 1];
                after = magnitude[i + width + 1];
            } else {
                before = magnitude[i - width + 1];
                after = magnitude[i + width - 1];
            }

            // One strict comparison so that a plateau of equal values leaves a single ridge
            if (m >= before && m > after) ridges[i] = m;
        }
    }

    return ridges;
}

function chooseThresholds(ridges: Float32Array, sensitivity: number): { low: number; high: number } | null {
    let count = 0;
    for (let i = 0; i < ridges.length; i++) if (ridges[i] > 0) count++;
    if (count === 0) return null;

    const strengths = new Float32Array(count);
    for (let i = 0, n = 0; i < ridges.length; i++) if (ridges[i] > 0) strengths[n++] = ridges[i];
    strengths.sort();

    const reference = strengths[Math.floor((count - 1) * REFERENCE_PERCENTILE)];
    if (reference < NOISE_FLOOR) return null;

    const { least, most } = HIGH_THRESHOLD_RANGE;
    const clamped = Math.min(1, Math.max(0, sensitivity));
    const share = least * Math.pow(most / least, clamped);

    const low = Math.max(NOISE_FLOOR, reference * share * LOW_TO_HIGH_RATIO);
    const high = Math.max(low * 1.5, reference * share);

    return { low, high };
}

/** Starts from every strong pixel and spreads through the weak ones that touch it. */
function applyHysteresis(ridges: Float32Array, width: number, height: number, low: number, high: number): Uint8Array {
    const mask = new Uint8Array(ridges.length);
    const stack = new Int32Array(ridges.length);
    let size = 0;

    for (let i = 0; i < ridges.length; i++) {
        if (ridges[i] < high) continue;

        mask[i] = 1;
        stack[size++] = i;

        while (size > 0) {
            const current = stack[--size];
            const cx = current % width;
            const cy = (current - cx) / width;

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = cx + dx;
                    const ny = cy + dy;

                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                    const n = ny * width + nx;

                    if (!mask[n] && ridges[n] >= low) {
                        mask[n] = 1;
                        stack[size++] = n;
                    }
                }
            }
        }
    }

    return mask;
}

export function detectEdges(grey: Float32Array, width: number, height: number, options: EdgeOptions): EdgeMap {
    const blurred = gaussianBlur(grey, width, height, options.sigma);
    const { gx, gy, magnitude } = sobel(blurred, width, height);
    const ridges = suppressNonMaxima(magnitude, gx, gy, width, height);
    const thresholds = chooseThresholds(ridges, options.sensitivity);

    if (!thresholds) {
        return { mask: new Uint8Array(grey.length), magnitude: ridges };
    }

    return {
        mask: applyHysteresis(ridges, width, height, thresholds.low, thresholds.high),
        magnitude: ridges,
    };
}

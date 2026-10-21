import { fft } from './fft';
import type { SampledPath } from './types';

/**
 * How the epicycles are sorted before the first `n` of them are kept:
 * - `size`: biggest radius first, which gives the best drawing for any given number of circles;
 * - `frequency`: slowest first (+1, -1, +2, -2, ...), i.e. the classic partial sums of a Fourier series.
 */
export type EpicycleOrder = 'size' | 'frequency';

/** Circles whose radius is below this fraction of the biggest one can never be seen. */
const NEGLIGIBLE_RADIUS = 1e-5;

/** The discrete Fourier transform of a sampled closed path, in the usual FFT layout. */
export interface Spectrum {
    /** Number of samples N the spectrum was computed from. */
    size: number;
    /** Complex coefficients `c_k` of the path `x + i·y`: index `j` holds the frequency `j` (below N/2) or `j - N`. */
    re: Float64Array;
    im: Float64Array;
}

/** The chain of rotating circles that redraws the path, ordered as requested. */
export interface Epicycles {
    size: number;
    /** Fixed centre of the first circle: the average position of the path. */
    centerX: number;
    centerY: number;
    /** Turns per cycle of each circle. Negative frequencies spin the opposite way. */
    frequency: Int32Array;
    /** Complex coefficient of each circle: its modulus is the radius and its argument the starting angle. */
    re: Float64Array;
    im: Float64Array;
    radius: Float64Array;
    /** How many circles are worth using: the following ones are far too small to change the drawing. */
    useful: number;
}

/** Frequency stored at index `j` of an N-points FFT. */
export function frequencyAt(j: number, size: number): number {
    return j < size / 2 ? j : j - size;
}

/** Index where the frequency `k` is stored in an N-points FFT. */
function indexOfFrequency(k: number, size: number): number {
    return (k + size) % size;
}

/** Fourier transform of the path, scaled so that `c_k` is the amplitude of the circle turning `k` times per cycle. */
export function analyze(path: SampledPath): Spectrum {
    const size = path.x.length;
    const re = Float64Array.from(path.x);
    const im = Float64Array.from(path.y);

    fft(re, im);

    for (let i = 0; i < size; i++) {
        re[i] /= size;
        im[i] /= size;
    }

    return { size, re, im };
}

export function sortEpicycles(spectrum: Spectrum, order: EpicycleOrder): Epicycles {
    const { size, re, im } = spectrum;

    const amplitude = new Float64Array(size);
    for (let j = 0; j < size; j++) amplitude[j] = Math.hypot(re[j], im[j]);

    // Every index but 0, which is the fixed centre rather than a rotating circle
    const indices: number[] = [];

    if (order === 'frequency') {
        for (let p = 1; p < size / 2; p++) indices.push(p, size - p);
        if (size > 1) indices.push(size / 2);
    } else {
        for (let j = 1; j < size; j++) indices.push(j);

        indices.sort((a, b) => {
            const bySize = amplitude[b] - amplitude[a];
            if (bySize !== 0) return bySize;

            // Equal circles (symmetric drawings): keep the order stable, slowest first and positive before negative
            const fa = frequencyAt(a, size);
            const fb = frequencyAt(b, size);
            return Math.abs(fa) - Math.abs(fb) || fb - fa;
        });
    }

    const count = indices.length;
    const epicycles: Epicycles = {
        size,
        centerX: re[0],
        centerY: im[0],
        frequency: new Int32Array(count),
        re: new Float64Array(count),
        im: new Float64Array(count),
        radius: new Float64Array(count),
        useful: 0,
    };

    let biggest = 0;

    for (let i = 0; i < count; i++) {
        const j = indices[i];
        epicycles.frequency[i] = frequencyAt(j, size);
        epicycles.re[i] = re[j];
        epicycles.im[i] = im[j];
        epicycles.radius[i] = amplitude[j];
        biggest = Math.max(biggest, epicycles.radius[i]);
    }

    const threshold = biggest * NEGLIGIBLE_RADIUS;

    for (let i = 0; i < count; i++) {
        if (epicycles.radius[i] > threshold) epicycles.useful = i + 1;
    }

    return epicycles;
}

/** Smallest number of circles that carry at least `fraction` of the energy of the drawing. */
export function circlesForEnergy(epicycles: Epicycles, fraction: number): number {
    const { radius } = epicycles;

    let total = 0;
    for (let i = 0; i < radius.length; i++) total += radius[i] * radius[i];

    let carried = 0;
    for (let i = 0; i < radius.length; i++) {
        carried += radius[i] * radius[i];
        if (carried >= fraction * total) return i + 1;
    }

    return radius.length;
}

/**
 * Rebuilds the path using only the first `count` circles (plus the fixed centre) with an inverse FFT.
 * The result has the same number of samples as the analysed path, so index `i` is the instant `i / N`.
 */
export function synthesize(epicycles: Epicycles, count: number): { x: Float64Array; y: Float64Array } {
    const { size } = epicycles;
    const x = new Float64Array(size);
    const y = new Float64Array(size);

    x[0] = epicycles.centerX;
    y[0] = epicycles.centerY;

    const used = Math.min(Math.max(0, Math.floor(count)), epicycles.frequency.length);

    for (let i = 0; i < used; i++) {
        const j = indexOfFrequency(epicycles.frequency[i], size);
        x[j] = epicycles.re[i];
        y[j] = epicycles.im[i];
    }

    // The coefficients are now the spectrum; the transform turns them back into positions
    fft(x, y, true);

    return { x, y };
}

/**
 * Places the first `count` circles at the instant `t` (0 to 1): `x[i]`, `y[i]` become the centre of circle `i`,
 * and the entry `count` is the tip of the chain, i.e. the point being drawn.
 * The output arrays need room for `count + 1` values.
 */
export function chainAt(epicycles: Epicycles, count: number, t: number, x: Float64Array, y: Float64Array): void {
    const { frequency, re, im } = epicycles;

    let px = epicycles.centerX;
    let py = epicycles.centerY;

    x[0] = px;
    y[0] = py;

    for (let i = 0; i < count; i++) {
        const angle = 2 * Math.PI * frequency[i] * t;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        px += re[i] * cos - im[i] * sin;
        py += re[i] * sin + im[i] * cos;

        x[i + 1] = px;
        y[i + 1] = py;
    }
}

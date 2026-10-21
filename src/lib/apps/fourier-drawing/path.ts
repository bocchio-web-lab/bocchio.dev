import { nextPowerOfTwo } from './fft';
import type { Bounds, Point, SampledPath } from './types';

export interface PathOptions {
    /** How many times faster the pen moves while it is lifted between two strokes. */
    jumpSpeed: number;
    /** Samples per pixel of ink. */
    density: number;
    minSamples: number;
    maxSamples: number;
}

export const DEFAULT_PATH_OPTIONS: PathOptions = {
    jumpSpeed: 5,
    density: 1,
    minSamples: 1024,
    maxSamples: 32768,
};

/** 2-opt keeps going until nothing improves, but this stops pathological inputs from running for long. */
const MAX_SWEEPS = 12;

export function boundsOf(x: ArrayLike<number>, y: ArrayLike<number>): Bounds {
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

    for (let i = 0; i < x.length; i++) {
        bounds.minX = Math.min(bounds.minX, x[i]);
        bounds.maxX = Math.max(bounds.maxX, x[i]);
        bounds.minY = Math.min(bounds.minY, y[i]);
        bounds.maxY = Math.max(bounds.maxY, y[i]);
    }

    return bounds;
}

/** Total length of the straight jumps needed to visit the strokes in the given order and come back to the start. */
export function jumpLength(strokes: Point[][]): number {
    let total = 0;

    for (let i = 0; i < strokes.length; i++) {
        const from = strokes[i][strokes[i].length - 1];
        const to = strokes[(i + 1) % strokes.length][0];
        total += Math.hypot(to.x - from.x, to.y - from.y);
    }

    return total;
}

/**
 * Decides in which order, and in which direction, the strokes are drawn so that the pen wastes as little time
 * as possible travelling between them: a nearest-neighbour tour polished with 2-opt.
 * The first stroke is the longest one, so the drawing starts from its main line.
 */
export function orderStrokes(strokes: Point[][]): Point[][] {
    const count = strokes.length;
    if (count <= 1) return strokes.slice();

    // Both ends of every stroke, in its original direction
    const startX = strokes.map((stroke) => stroke[0].x);
    const startY = strokes.map((stroke) => stroke[0].y);
    const endX = strokes.map((stroke) => stroke[stroke.length - 1].x);
    const endY = strokes.map((stroke) => stroke[stroke.length - 1].y);

    const lengths = strokes.map((stroke) => {
        let length = 0;
        for (let i = 1; i < stroke.length; i++) length += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
        return length;
    });

    // The tour: which stroke, and whether it is walked backwards
    const order: number[] = [];
    const reversed: boolean[] = [];

    const first = lengths.indexOf(Math.max(...lengths));
    const used = new Uint8Array(count);
    used[first] = 1;
    order.push(first);
    reversed.push(false);

    let x = endX[first];
    let y = endY[first];

    for (let step = 1; step < count; step++) {
        let best = -1;
        let bestReversed = false;
        let bestDistance = Infinity;

        for (let i = 0; i < count; i++) {
            if (used[i]) continue;

            const toStart = (startX[i] - x) ** 2 + (startY[i] - y) ** 2;
            const toEnd = (endX[i] - x) ** 2 + (endY[i] - y) ** 2;

            if (toStart < bestDistance) {
                best = i;
                bestReversed = false;
                bestDistance = toStart;
            }

            if (toEnd < bestDistance) {
                best = i;
                bestReversed = true;
                bestDistance = toEnd;
            }
        }

        used[best] = 1;
        order.push(best);
        reversed.push(bestReversed);

        x = bestReversed ? startX[best] : endX[best];
        y = bestReversed ? startY[best] : endY[best];
    }

    // Where the tour position `p` begins and ends
    const beginX = (p: number) => (reversed[p] ? endX[order[p]] : startX[order[p]]);
    const beginY = (p: number) => (reversed[p] ? endY[order[p]] : startY[order[p]]);
    const finishX = (p: number) => (reversed[p] ? startX[order[p]] : endX[order[p]]);
    const finishY = (p: number) => (reversed[p] ? startY[order[p]] : endY[order[p]]);
    const distance = (ax: number, ay: number, bx: number, by: number) => Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);

    // 2-opt: walking a stretch of the tour backwards replaces the jumps a→b and c→d with a→c and b→d.
    // The first stroke never moves, which loses nothing since the tour is a loop.
    for (let sweep = 0, improved = true; improved && sweep < MAX_SWEEPS; sweep++) {
        improved = false;

        for (let i = 1; i < count; i++) {
            for (let j = i; j < count; j++) {
                const next = (j + 1) % count;

                const before =
                    distance(finishX(i - 1), finishY(i - 1), beginX(i), beginY(i)) +
                    distance(finishX(j), finishY(j), beginX(next), beginY(next));
                const after =
                    distance(finishX(i - 1), finishY(i - 1), finishX(j), finishY(j)) +
                    distance(beginX(i), beginY(i), beginX(next), beginY(next));

                if (after < before - 1e-9) {
                    for (let lo = i, hi = j; lo <= hi; lo++, hi--) {
                        const stroke = order[lo];
                        const wasReversed = reversed[lo];

                        order[lo] = order[hi];
                        reversed[lo] = !reversed[hi];

                        // Swapping a position with itself still has to flip its direction
                        if (lo !== hi) {
                            order[hi] = stroke;
                            reversed[hi] = !wasReversed;
                        }
                    }

                    improved = true;
                }
            }
        }
    }

    return order.map((index, p) => (reversed[p] ? strokes[index].slice().reverse() : strokes[index]));
}

/**
 * Joins the strokes, in the given order, into one closed path and samples it at evenly spaced instants.
 *
 * The pen moves at constant speed over the strokes and `jumpSpeed` times faster while it travels from one stroke
 * to the next (and from the last back to the first), so little of the cycle is spent on lines nobody will see.
 */
export function buildPath(strokes: Point[][], options: Partial<PathOptions> = {}): SampledPath {
    const { jumpSpeed, density, minSamples, maxSamples } = { ...DEFAULT_PATH_OPTIONS, ...options };

    // The closed polyline: `inked[v]` tells whether the segment leaving vertex v is part of a stroke
    const xs: number[] = [];
    const ys: number[] = [];
    const inked: number[] = [];

    for (const stroke of strokes) {
        if (stroke.length < 2) continue;

        for (let i = 0; i < stroke.length; i++) {
            xs.push(stroke[i].x);
            ys.push(stroke[i].y);
            inked.push(i < stroke.length - 1 ? 1 : 0);
        }
    }

    const vertices = xs.length;

    // Time needed to cross each segment, and the instant at which each one starts
    const start = new Float64Array(vertices + 1);

    for (let v = 0; v < vertices; v++) {
        const next = (v + 1) % vertices;
        const length = Math.hypot(xs[next] - xs[v], ys[next] - ys[v]);
        start[v + 1] = start[v] + length / (inked[v] ? 1 : jumpSpeed);
    }

    const duration = start[vertices];
    if (!(duration > 0)) throw new Error('There is nothing to draw');

    const size = nextPowerOfTwo(Math.min(maxSamples, Math.max(minSamples, Math.ceil(duration * density))));
    const path: SampledPath = { x: new Float64Array(size), y: new Float64Array(size), pen: new Uint8Array(size) };
    const sampleInked = new Uint8Array(size);

    for (let i = 0, v = 0; i < size; i++) {
        const time = (i * duration) / size;

        while (v < vertices - 1 && start[v + 1] <= time) v++;

        const next = (v + 1) % vertices;
        const span = start[v + 1] - start[v];
        const along = span > 0 ? (time - start[v]) / span : 0;

        path.x[i] = xs[v] + (xs[next] - xs[v]) * along;
        path.y[i] = ys[v] + (ys[next] - ys[v]) * along;
        sampleInked[i] = inked[v];
    }

    // A segment between two samples is inked only if both ends are, so strokes never grow a tail towards the next one
    for (let i = 0; i < size; i++) {
        path.pen[i] = sampleInked[i] & sampleInked[(i + 1) % size];
    }

    return path;
}

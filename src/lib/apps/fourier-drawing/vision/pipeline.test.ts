import { describe, expect, it } from 'vitest';
import type { Point, Raster } from '../types';
import { detectEdges } from './canny';
import { DEFAULT_ANALYSIS, extractStrokes } from './pipeline';
import { polylineLength, traceStrokes } from './strokes';
import { thin } from './thinning';

/** Paints a raster from a function returning [r, g, b, a] for every pixel. */
function paint(width: number, height: number, color: (x: number, y: number) => number[]): Raster {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            data.set(color(x, y), (y * width + x) * 4);
        }
    }

    return { width, height, data };
}

const WHITE = [255, 255, 255, 255];
const BLACK = [0, 0, 0, 255];

const disc = (cx: number, cy: number, r: number, inside = BLACK, outside = WHITE) =>
    (x: number, y: number) => (Math.hypot(x - cx, y - cy) <= r ? inside : outside);

const square = (x0: number, y0: number, size: number, inside = BLACK, outside = WHITE) =>
    (x: number, y: number) => (x >= x0 && x < x0 + size && y >= y0 && y < y0 + size ? inside : outside);

function totalLength(strokes: Point[][]) {
    return strokes.reduce((sum, stroke) => sum + polylineLength(stroke), 0);
}

describe('extractStrokes', () => {
    it('traces a disc as a single loop around its border', () => {
        const strokes = extractStrokes(paint(120, 120, disc(60, 60, 30)), DEFAULT_ANALYSIS);

        expect(strokes.length).toBe(1);
        expect(totalLength(strokes)).toBeGreaterThan(2 * Math.PI * 30 * 0.9);
        expect(totalLength(strokes)).toBeLessThan(2 * Math.PI * 30 * 1.1);

        // Every point lies on the circle, to within a pixel and a bit
        for (const { x, y } of strokes[0]) {
            expect(Math.abs(Math.hypot(x - 60, y - 60) - 30)).toBeLessThan(1.6);
        }

        // ...and the loop closes on itself
        const first = strokes[0][0];
        const last = strokes[0][strokes[0].length - 1];
        expect(Math.hypot(first.x - last.x, first.y - last.y)).toBeLessThan(3);
    });

    it('traces a square along its four sides', () => {
        const strokes = extractStrokes(paint(100, 100, square(30, 30, 40)), DEFAULT_ANALYSIS);

        expect(totalLength(strokes)).toBeGreaterThan(4 * 40 * 0.85);
        expect(totalLength(strokes)).toBeLessThan(4 * 40 * 1.1);

        for (const { x, y } of strokes.flat()) {
            expect(x).toBeGreaterThan(28);
            expect(x).toBeLessThan(72);
            expect(y).toBeGreaterThan(28);
            expect(y).toBeLessThan(72);
        }
    });

    it('finds nothing in a flat image', () => {
        expect(extractStrokes(paint(80, 80, () => [120, 130, 140, 255]), DEFAULT_ANALYSIS)).toEqual([]);
    });

    it('keeps separate shapes as separate strokes', () => {
        const image = paint(160, 100, (x, y) =>
            square(20, 30, 40)(x, y) === BLACK || square(100, 30, 40)(x, y) === BLACK ? BLACK : WHITE);

        expect(extractStrokes(image, DEFAULT_ANALYSIS).length).toBeGreaterThanOrEqual(2);
    });

    it('draws faint lines only when the sensitivity is high', () => {
        // A strong black square next to a barely visible light-grey one
        const image = paint(160, 100, (x, y) => {
            if (square(20, 30, 40)(x, y) === BLACK) return BLACK;
            if (square(100, 30, 40)(x, y) === BLACK) return [226, 226, 226, 255];
            return WHITE;
        });

        const strict = totalLength(extractStrokes(image, { ...DEFAULT_ANALYSIS, sensitivity: 0.1 }));
        const lenient = totalLength(extractStrokes(image, { ...DEFAULT_ANALYSIS, sensitivity: 0.9 }));

        expect(lenient).toBeGreaterThan(strict * 1.5);
    });

    it('drops strokes shorter than the minimum length', () => {
        const image = paint(120, 120, (x, y) =>
            disc(60, 60, 30)(x, y) === BLACK || disc(15, 15, 4)(x, y) === BLACK ? BLACK : WHITE);

        const permissive = extractStrokes(image, { ...DEFAULT_ANALYSIS, minLength: 4 });
        const strict = extractStrokes(image, { ...DEFAULT_ANALYSIS, minLength: 40 });

        expect(permissive.length).toBeGreaterThan(strict.length);
        expect(strict.length).toBe(1);
    });

    it('outlines a light cut-out on a transparent background', () => {
        const image = paint(100, 100, (x, y) => (square(30, 30, 40)(x, y) === BLACK ? [255, 255, 255, 255] : [0, 0, 0, 0]));
        const strokes = extractStrokes(image, DEFAULT_ANALYSIS);

        expect(totalLength(strokes)).toBeGreaterThan(4 * 40 * 0.85);
    });
});

/** Number of 8-connected groups of set pixels. */
function components(mask: Uint8Array, width: number, height: number): number {
    const seen = new Uint8Array(mask.length);
    let count = 0;

    for (let start = 0; start < mask.length; start++) {
        if (!mask[start] || seen[start]) continue;

        count++;
        const stack = [start];
        seen[start] = 1;

        while (stack.length) {
            const current = stack.pop()!;
            const x = current % width;
            const y = Math.floor(current / width);

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                    const n = ny * width + nx;
                    if (mask[n] && !seen[n]) {
                        seen[n] = 1;
                        stack.push(n);
                    }
                }
            }
        }
    }

    return count;
}

function hasSolidBlock(mask: Uint8Array, width: number, height: number): boolean {
    for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
            const i = y * width + x;
            if (mask[i] && mask[i + 1] && mask[i + width] && mask[i + width + 1]) return true;
        }
    }

    return false;
}

describe('thin', () => {
    it('reduces a thick bar to a one-pixel line through its middle', () => {
        const width = 40;
        const height = 20;
        const mask = new Uint8Array(width * height);

        for (let y = 7; y <= 12; y++) for (let x = 5; x <= 34; x++) mask[y * width + x] = 1;

        thin(mask, width, height);

        const remaining = Array.from(mask.keys()).filter((i) => mask[i]);

        // Almost the whole length is kept, with a single pixel per column in the middle of the bar
        expect(remaining.length).toBeGreaterThan(20);
        expect(remaining.length).toBeLessThan(40);

        for (const i of remaining) {
            const y = Math.floor(i / width);
            expect(y).toBeGreaterThanOrEqual(8);
            expect(y).toBeLessThanOrEqual(11);
        }
    });

    it('does not split a line', () => {
        const width = 30;
        const height = 30;
        const mask = new Uint8Array(width * height);

        // A 3px thick L shape
        for (let y = 4; y < 26; y++) for (let x = 4; x < 7; x++) mask[y * width + x] = 1;
        for (let y = 23; y < 26; y++) for (let x = 4; x < 26; x++) mask[y * width + x] = 1;

        thin(mask, width, height);

        const strokes = traceStrokes(mask, width, height);
        expect(strokes.length).toBe(1);
        expect(strokes[0].points.length).toBeGreaterThan(30);
    });

    it('reduces two-pixel-wide diagonals, which Zhang-Suen leaves alone', () => {
        const width = 40;
        const height = 40;
        const mask = new Uint8Array(width * height);

        for (let i = 5; i < 34; i++) {
            mask[i * width + i] = 1;
            mask[i * width + i + 1] = 1;
        }

        thin(mask, width, height);

        expect(hasSolidBlock(mask, width, height)).toBe(false);
        expect(components(mask, width, height)).toBe(1);
        expect(mask.reduce((sum, value) => sum + value, 0)).toBeLessThan(34);
    });

    it('keeps the number of separate shapes and leaves no solid blocks, whatever the shape', () => {
        const width = 90;
        const height = 90;
        let seed = 42;
        const random = (max: number) => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * max;

        for (let round = 0; round < 12; round++) {
            const mask = new Uint8Array(width * height);

            // A few overlapping blobs of different sizes
            for (let blob = 0; blob < 5; blob++) {
                const cx = 15 + random(60);
                const cy = 15 + random(60);
                const rx = 3 + random(9);
                const ry = 3 + random(9);

                for (let y = 2; y < height - 2; y++) {
                    for (let x = 2; x < width - 2; x++) {
                        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) mask[y * width + x] = 1;
                    }
                }
            }

            const before = components(mask, width, height);
            thin(mask, width, height);

            expect(components(mask, width, height)).toBe(before);
            expect(hasSolidBlock(mask, width, height)).toBe(false);
        }
    });
});

describe('traceStrokes', () => {
    it('follows a line from end to end', () => {
        const width = 20;
        const height = 10;
        const mask = new Uint8Array(width * height);
        for (let x = 3; x <= 15; x++) mask[5 * width + x] = 1;

        const strokes = traceStrokes(mask, width, height);

        expect(strokes.length).toBe(1);
        expect(strokes[0].points.length).toBe(13);
        expect(strokes[0].points[0].y).toBe(5.5);
        expect(polylineLength(strokes[0].points)).toBeCloseTo(12, 9);
    });

    it('keeps going straight through a crossing', () => {
        const width = 21;
        const height = 21;
        const mask = new Uint8Array(width * height);

        for (let x = 2; x <= 18; x++) mask[10 * width + x] = 1;
        for (let y = 2; y <= 18; y++) mask[y * width + 10] = 1;

        const strokes = traceStrokes(mask, width, height);

        // Two long straight lines rather than four stubs
        expect(strokes.length).toBe(2);
        for (const stroke of strokes) expect(polylineLength(stroke.points)).toBeCloseTo(16, 9);
    });

    it('covers a T junction with two strokes that meet on the junction', () => {
        const width = 21;
        const height = 21;
        const mask = new Uint8Array(width * height);

        // A horizontal line with a stem coming down onto it
        for (let x = 2; x <= 18; x++) mask[15 * width + x] = 1;
        for (let y = 3; y < 15; y++) mask[y * width + 10] = 1;

        const strokes = traceStrokes(mask, width, height);
        const covered = new Set(strokes.flatMap((stroke) => stroke.points.map((p) => `${p.x},${p.y}`)));

        expect(strokes.length).toBe(2);
        expect(covered.size).toBe(mask.reduce((sum, value) => sum + value, 0));

        // Both strokes go through the junction pixel, so there is no gap to jump over
        expect(strokes.every((stroke) => stroke.points.some((p) => p.x === 10.5 && p.y === 15.5))).toBe(true);
    });

    it('closes a loop on itself', () => {
        const width = 30;
        const height = 30;
        const mask = new Uint8Array(width * height);

        // The border of a 12x12 square
        for (let i = 8; i <= 19; i++) {
            mask[8 * width + i] = 1;
            mask[19 * width + i] = 1;
            mask[i * width + 8] = 1;
            mask[i * width + 19] = 1;
        }

        const [loop, ...others] = traceStrokes(mask, width, height);
        const { points } = loop;

        expect(others).toEqual([]);
        expect(points[0]).toEqual(points[points.length - 1]);
        expect(polylineLength(points)).toBeCloseTo(4 * 11, 9);
    });
});

describe('detectEdges', () => {
    it('never marks the border of the image', () => {
        const image = paint(60, 60, square(0, 0, 30));
        const { mask } = detectEdges(
            Float32Array.from({ length: 60 * 60 }, (_, i) => image.data[i * 4]),
            60,
            60,
            { sigma: 1.4, sensitivity: 0.5 },
        );

        for (let i = 0; i < 60; i++) {
            expect(mask[i]).toBe(0);
            expect(mask[59 * 60 + i]).toBe(0);
            expect(mask[i * 60]).toBe(0);
            expect(mask[i * 60 + 59]).toBe(0);
        }
    });
});

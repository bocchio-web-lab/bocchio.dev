import { describe, expect, it } from 'vitest';
import { boundsOf, buildPath, jumpLength, orderStrokes } from './path';
import type { Point } from './types';

const line = (x0: number, y0: number, x1: number, y1: number, steps = 20): Point[] =>
    Array.from({ length: steps + 1 }, (_, i) => ({
        x: x0 + ((x1 - x0) * i) / steps,
        y: y0 + ((y1 - y0) * i) / steps,
    }));

describe('orderStrokes', () => {
    it('visits nearby strokes one after the other, turning them around when needed', () => {
        // Shuffled on purpose, and some of them pointing the wrong way
        const strokes = [
            line(300, 0, 200, 0),
            line(0, 0, 100, 0),
            line(250, 0, 350, 0), // far from everything: should come last
            line(100, 0, 200, 0),
        ];

        const ordered = orderStrokes(strokes);

        expect(ordered.length).toBe(4);
        // Whatever the start, consecutive strokes should chain end to start with no long jump
        expect(jumpLength(ordered)).toBeLessThan(jumpLength(strokes) / 2);
    });

    it('never loses or duplicates a stroke', () => {
        const strokes = Array.from({ length: 40 }, (_, i) => line(i * 7 % 50, i * 13 % 50, i * 11 % 50, i * 3 % 50, 3));
        const ordered = orderStrokes(strokes);

        const signature = (list: Point[][]) =>
            list.map((s) => [s[0], s[s.length - 1]].map((p) => `${p.x},${p.y}`).sort().join('|')).sort();

        expect(signature(ordered)).toEqual(signature(strokes));
    });

    it('starts from the longest stroke', () => {
        const ordered = orderStrokes([line(0, 0, 10, 0), line(0, 50, 200, 50), line(0, 90, 20, 90)]);

        expect(ordered[0][0].y).toBe(50);
        expect(ordered[0][0].x).toBe(0);
    });

    it('is no worse than the greedy tour it starts from (2-opt only improves)', () => {
        // Random-looking but deterministic scattering of short strokes
        let seed = 7;
        const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 400;
        const strokes = Array.from({ length: 60 }, () => {
            const x = random();
            const y = random();
            return line(x, y, x + 10, y + 5, 2);
        });

        // A naive tour in input order would be awful; the ordered one should be a small fraction of it
        expect(jumpLength(orderStrokes(strokes))).toBeLessThan(jumpLength(strokes) * 0.4);
    });
});

describe('buildPath', () => {
    const square = [line(0, 0, 100, 0, 100), line(100, 0, 100, 100, 100), line(100, 100, 0, 100, 100), line(0, 100, 0, 0, 100)];

    it('samples a power of two number of points', () => {
        const { x } = buildPath(square);

        expect(x.length & (x.length - 1)).toBe(0);
        expect(x.length).toBeGreaterThanOrEqual(1024);
    });

    it('starts where the first stroke starts and stays inside the drawing', () => {
        const path = buildPath(square);
        const bounds = boundsOf(path.x, path.y);

        expect(path.x[0]).toBeCloseTo(0, 9);
        expect(path.y[0]).toBeCloseTo(0, 9);
        expect(bounds.minX).toBeGreaterThanOrEqual(-1e-9);
        expect(bounds.maxX).toBeLessThanOrEqual(100 + 1e-9);
    });

    it('moves at a constant pace while the pen is down', () => {
        const path = buildPath(square, { jumpSpeed: 5 });
        const steps: number[] = [];

        for (let i = 0; i < path.x.length - 1; i++) {
            if (path.pen[i]) steps.push(Math.hypot(path.x[i + 1] - path.x[i], path.y[i + 1] - path.y[i]));
        }

        const typical = steps.sort((a, b) => a - b)[Math.floor(steps.length / 2)];

        // Same distance between consecutive samples (the corners cut it slightly, hence the tolerance)
        expect(steps.length).toBeGreaterThan(900);
        expect(Math.min(...steps)).toBeGreaterThan(typical * 0.6);
        expect(Math.max(...steps)).toBeLessThan(typical * 1.01);
    });

    it('lifts the pen between strokes and ink only the strokes', () => {
        // Two segments far apart: the way from one to the other is not drawn
        const path = buildPath([line(0, 0, 100, 0, 50), line(0, 400, 100, 400, 50)], { jumpSpeed: 4 });
        const down = path.pen.reduce((sum, value) => sum + value, 0);

        // 200px of ink out of 200 + 2 jumps of ~400px at quadruple speed (about 200px worth of time)
        expect(down / path.pen.length).toBeGreaterThan(0.4);
        expect(down / path.pen.length).toBeLessThan(0.6);

        // No ink is laid on the jump itself
        for (let i = 0; i < path.x.length - 1; i++) {
            if (path.pen[i]) {
                expect(Math.abs(path.y[i] - path.y[i + 1])).toBeLessThan(1e-9);
            }
        }
    });

    it('ignores strokes with fewer than two points and refuses an empty drawing', () => {
        expect(() => buildPath([])).toThrow();
        expect(() => buildPath([[{ x: 1, y: 1 }]])).toThrow();
        expect(buildPath([[{ x: 1, y: 1 }], ...square]).x.length).toBeGreaterThan(0);
    });

    it('never exceeds the sample budget', () => {
        const long = [line(0, 0, 100000, 0, 10)];
        expect(buildPath(long, { maxSamples: 2048 }).x.length).toBe(2048);
    });
});

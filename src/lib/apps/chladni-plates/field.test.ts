import { beforeAll, describe, expect, it } from 'vitest';
import { Bend, Grid } from './field';
import { analyzePlate, type PlateModes } from './ritz';
import { createShape } from './shapes';

let circle: PlateModes;

beforeAll(() => {
    circle = analyzePlate(createShape('circle'), { modes: 12 });
});

describe('the bend', () => {
    it('is the sum of the modes, each as big as it is told to be', () => {
        const points = Float64Array.from([0.1, 0.05, -0.2, 0.15, 0.0, -0.3]);
        const bend = new Bend(circle, points);
        const values = circle.sample(points);

        const amplitudes = new Float64Array(2 * circle.count);
        amplitudes[2 * 3] = 2; // real part of mode 3
        amplitudes[2 * 5 + 1] = -1.5; // imaginary part of mode 5

        bend.combine(amplitudes);

        for (let p = 0; p < 3; p++) {
            expect(bend.re[p]).toBeCloseTo(2 * values[p * circle.count + 3], 5);
            expect(bend.im[p]).toBeCloseTo(-1.5 * values[p * circle.count + 5], 5);
        }
    });

    it('tells that it has changed: the version goes up each time it is combined', () => {
        const bend = new Bend(circle, Float64Array.from([0.1, 0.1]));
        const before = bend.version;

        bend.combine(new Float64Array(2 * circle.count));
        bend.combine(new Float64Array(2 * circle.count));

        expect(bend.version).toBe(before + 2);
    });

    it('starts at nothing', () => {
        const bend = new Bend(circle, Float64Array.from([0, 0, 0.1, 0.1]));

        expect(Array.from(bend.re)).toEqual([0, 0]);
        expect(Array.from(bend.im)).toEqual([0, 0]);
    });
});

describe('the part of the bend that moves in step', () => {
    const points = Float64Array.from([0.1, 0.05, -0.2, 0.15, 0.0, -0.3, 0.25, 0.1]);

    it('is the whole bend when it is a single mode, whatever the delay of the plate behind the shaker', () => {
        const bend = new Bend(circle, points);
        const values = circle.sample(points);

        // Mode 4, as big as 2 and a quarter of a period behind the force
        const amplitudes = new Float64Array(2 * circle.count);
        amplitudes[2 * 4] = 0;
        amplitudes[2 * 4 + 1] = -2;

        bend.combine(amplitudes);

        for (let p = 0; p < 4; p++) expect(Math.abs(bend.standing[p])).toBeCloseTo(2 * Math.abs(values[p * circle.count + 4]), 5);
    });

    it('leaves out what a second mode adds a quarter of a period behind, which is not zero on the nodal lines', () => {
        const bend = new Bend(circle, points);
        const values = circle.sample(points);

        // Mode 4 is big and in step with the force; mode 6 is a little one, a quarter of a period behind it
        const amplitudes = new Float64Array(2 * circle.count);
        amplitudes[2 * 4] = 3;
        amplitudes[2 * 6 + 1] = 0.3;

        bend.combine(amplitudes);

        for (let p = 0; p < 4; p++) {
            expect(bend.standing[p]).toBeCloseTo(3 * values[p * circle.count + 4], 5);
            expect(bend.im[p]).toBeCloseTo(0.3 * values[p * circle.count + 6], 5);
        }
    });

    it('is a real combination of the real and the imaginary part, with the same size at most', () => {
        const bend = new Bend(circle, points);

        const amplitudes = new Float64Array(2 * circle.count);
        for (let k = 0; k < circle.count; k++) {
            amplitudes[2 * k] = Math.sin(k + 1);
            amplitudes[2 * k + 1] = Math.cos(2 * k + 1);
        }

        bend.combine(amplitudes);

        for (let p = 0; p < 4; p++) expect(Math.abs(bend.standing[p])).toBeLessThanOrEqual(Math.hypot(bend.re[p], bend.im[p]) + 1e-6);
    });
});

describe('the grid', () => {
    it('has a cell for each place of a square that holds the plate', () => {
        const grid = new Grid(circle, 40);

        expect(grid.bend.count).toBe(1600);
        expect(grid.half).toBeGreaterThan(circle.shape.half.x);
        expect(grid.coordinate(0)).toBeCloseTo(-grid.half + grid.half / 40, 12);
        expect(grid.coordinate(39)).toBeCloseTo(grid.half - grid.half / 40, 12);
    });

    it('reads the exact value of anything that is a linear function of the place', () => {
        const grid = new Grid(circle, 40);

        // The bend is made to be 3 x - 2 y + 1 (real part) and x + y (imaginary part) at the points of the grid
        for (let j = 0; j < 40; j++) {
            for (let i = 0; i < 40; i++) {
                const x = grid.coordinate(i);
                const y = grid.coordinate(j);

                grid.bend.re[j * 40 + i] = 3 * x - 2 * y + 1;
                grid.bend.im[j * 40 + i] = x + y;
            }
        }

        const out = new Float64Array(2);

        for (const [x, y] of [
            [0.05, 0.1],
            [-0.2, 0.17],
            [0.3, -0.25],
        ]) {
            grid.read(x, y, out);

            expect(out[0]).toBeCloseTo(3 * x - 2 * y + 1, 5);
            expect(out[1]).toBeCloseTo(x + y, 5);
        }
    });

    it('reads the part that moves in step in the same way: exact for a linear function', () => {
        const grid = new Grid(circle, 40);

        for (let j = 0; j < 40; j++) {
            for (let i = 0; i < 40; i++) grid.bend.standing[j * 40 + i] = 3 * grid.coordinate(i) - 2 * grid.coordinate(j) + 1;
        }

        for (const [x, y] of [
            [-0.13, 0.21],
            [0.3, -0.25],
        ]) {
            expect(grid.standingAt(x, y)).toBeCloseTo(3 * x - 2 * y + 1, 5);
        }
    });

    it('can be read at the edge of the square without going out of it', () => {
        const grid = new Grid(circle, 40);
        const out = new Float64Array(2);

        grid.read(grid.half, grid.half, out);
        grid.read(-grid.half, -grid.half, out);
        grid.read(10, 10, out);

        expect(Number.isFinite(out[0])).toBe(true);
        expect(Number.isFinite(out[1])).toBe(true);
    });
});

import { describe, expect, it } from 'vitest';
import { analyze, chainAt, circlesForEnergy, sortEpicycles, synthesize } from './spectrum';
import type { SampledPath } from './types';

/** x + iy = (10 + 5i) + 3·e^(2πi·t) + 1.5·e^(-2πi·2t) sampled at N instants. */
function twoCirclePath(n: number): SampledPath {
    const path: SampledPath = { x: new Float64Array(n), y: new Float64Array(n), pen: new Uint8Array(n).fill(1) };

    for (let i = 0; i < n; i++) {
        const t = i / n;
        path.x[i] = 10 + 3 * Math.cos(2 * Math.PI * t) + 1.5 * Math.cos(-4 * Math.PI * t);
        path.y[i] = 5 + 3 * Math.sin(2 * Math.PI * t) + 1.5 * Math.sin(-4 * Math.PI * t);
    }

    return path;
}

/** A closed polygon-ish path with plenty of harmonics: a square walked at constant speed. */
function squarePath(n: number): SampledPath {
    const path: SampledPath = { x: new Float64Array(n), y: new Float64Array(n), pen: new Uint8Array(n).fill(1) };
    const corners = [[0, 0], [100, 0], [100, 100], [0, 100]];

    for (let i = 0; i < n; i++) {
        const side = Math.floor((4 * i) / n);
        const local = (4 * i) / n - side;
        const [ax, ay] = corners[side];
        const [bx, by] = corners[(side + 1) % 4];

        path.x[i] = ax + (bx - ax) * local;
        path.y[i] = ay + (by - ay) * local;
    }

    return path;
}

describe('analyze + sortEpicycles', () => {
    it('finds the centre and the circles of a known drawing', () => {
        const epicycles = sortEpicycles(analyze(twoCirclePath(256)), 'size');

        expect(epicycles.centerX).toBeCloseTo(10, 9);
        expect(epicycles.centerY).toBeCloseTo(5, 9);
        expect(epicycles.useful).toBe(2);

        expect(Array.from(epicycles.frequency.slice(0, 2))).toEqual([1, -2]);
        expect(epicycles.radius[0]).toBeCloseTo(3, 9);
        expect(epicycles.radius[1]).toBeCloseTo(1.5, 9);
    });

    it('sorts by size, biggest first', () => {
        const { radius } = sortEpicycles(analyze(squarePath(512)), 'size');

        for (let i = 1; i < radius.length; i++) {
            expect(radius[i]).toBeLessThanOrEqual(radius[i - 1]);
        }
    });

    it('sorts by frequency: +1, -1, +2, -2, ... and the Nyquist last', () => {
        const { frequency } = sortEpicycles(analyze(squarePath(16)), 'frequency');

        expect(Array.from(frequency)).toEqual([1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, -8]);
    });

    it('uses every non-zero frequency exactly once, whatever the order', () => {
        const spectrum = analyze(squarePath(64));

        for (const order of ['size', 'frequency'] as const) {
            const { frequency } = sortEpicycles(spectrum, order);
            expect(frequency.length).toBe(63);
            expect(new Set(frequency).size).toBe(63);
            expect(frequency.includes(0)).toBe(false);
        }
    });
});

describe('synthesize', () => {
    it('reproduces the original samples when every circle is used', () => {
        const path = squarePath(256);
        const epicycles = sortEpicycles(analyze(path), 'size');
        const { x, y } = synthesize(epicycles, epicycles.frequency.length);

        for (let i = 0; i < 256; i++) {
            expect(x[i]).toBeCloseTo(path.x[i], 8);
            expect(y[i]).toBeCloseTo(path.y[i], 8);
        }
    });

    it('with no circles collapses the drawing onto its centre', () => {
        const epicycles = sortEpicycles(analyze(twoCirclePath(128)), 'size');
        const { x, y } = synthesize(epicycles, 0);

        expect(Array.from(x).every((value) => Math.abs(value - 10) < 1e-9)).toBe(true);
        expect(Array.from(y).every((value) => Math.abs(value - 5) < 1e-9)).toBe(true);
    });

    it('approximates better and better as circles are added', () => {
        const path = squarePath(512);
        const epicycles = sortEpicycles(analyze(path), 'size');

        const error = (count: number) => {
            const { x, y } = synthesize(epicycles, count);
            let sum = 0;
            for (let i = 0; i < 512; i++) sum += Math.hypot(x[i] - path.x[i], y[i] - path.y[i]) ** 2;
            return Math.sqrt(sum / 512);
        };

        expect(error(5)).toBeGreaterThan(error(20));
        expect(error(20)).toBeGreaterThan(error(100));
        expect(error(100)).toBeGreaterThan(error(500));
    });
});

describe('chainAt', () => {
    it('puts the tip of the chain on the synthesized path', () => {
        const epicycles = sortEpicycles(analyze(squarePath(256)), 'size');
        const count = 60;
        const { x, y } = synthesize(epicycles, count);
        const cx = new Float64Array(count + 1);
        const cy = new Float64Array(count + 1);

        for (const index of [0, 1, 37, 128, 255]) {
            chainAt(epicycles, count, index / 256, cx, cy);
            expect(cx[count]).toBeCloseTo(x[index], 8);
            expect(cy[count]).toBeCloseTo(y[index], 8);
        }
    });

    it('starts the chain from the fixed centre', () => {
        const epicycles = sortEpicycles(analyze(twoCirclePath(64)), 'size');
        const cx = new Float64Array(3);
        const cy = new Float64Array(3);

        chainAt(epicycles, 2, 0.3, cx, cy);

        expect(cx[0]).toBeCloseTo(10, 9);
        expect(cy[0]).toBeCloseTo(5, 9);
    });
});

describe('circlesForEnergy', () => {
    it('counts the circles needed to carry a share of the energy', () => {
        const epicycles = sortEpicycles(analyze(twoCirclePath(256)), 'size');

        // Radii 3 and 1.5: energies 9 and 2.25, i.e. 80% and 20%
        expect(circlesForEnergy(epicycles, 0.5)).toBe(1);
        expect(circlesForEnergy(epicycles, 0.79)).toBe(1);
        expect(circlesForEnergy(epicycles, 0.81)).toBe(2);
        expect(circlesForEnergy(epicycles, 1)).toBeLessThanOrEqual(epicycles.radius.length);
    });
});

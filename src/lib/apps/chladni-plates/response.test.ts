import { beforeAll, describe, expect, it } from 'vitest';
import { Bend } from './field';
import { amplitudes, couplings, hertzPerOmega, overallResponse, reachableModes, shakingFactor } from './response';
import { analyzePlate, type PlateModes } from './ritz';
import { createShape } from './shapes';

let square: PlateModes;

beforeAll(() => {
    square = analyzePlate(createShape('square'));
});

describe('the pitch of the plates', () => {
    it('is about 6 hertz for a unit of the dimensionless frequency, for aluminium 1 mm thick and 20 cm wide', () => {
        expect(hertzPerOmega(20, 1)).toBeCloseTo(6.13, 1);
    });

    it('makes the first resonance of a 20 cm square plate some 80 hertz', () => {
        expect(square.omega[0] * hertzPerOmega(20, 1)).toBeCloseTo(82.6, 0);
    });

    it('goes up with the thickness and down with the size', () => {
        expect(hertzPerOmega(20, 2) / hertzPerOmega(20, 1)).toBeCloseTo(2, 12);
        expect(hertzPerOmega(10, 1) / hertzPerOmega(20, 1)).toBeCloseTo(4, 12);
    });
});

describe('the coupling of a force to the modes', () => {
    it('is the value of the modes where the force acts', () => {
        const here = couplings(square, 0.2, 0.1);
        const values = square.sample(Float64Array.from([0.2, 0.1]));

        expect(Array.from(here, (v) => Math.fround(v))).toEqual(Array.from(values));
    });

    it('is nothing for the modes that stand still at the centre of the square plate', () => {
        const centre = couplings(square, 0, 0);

        // The twist (xy) and the saddle (x^2 - y^2) have a node there: the shaker cannot excite them
        expect(Math.abs(centre[0])).toBeLessThan(1e-4);
        expect(Math.abs(centre[1])).toBeLessThan(1e-4);
        expect(Math.abs(centre[2])).toBeGreaterThan(0.5);
    });

    it('lists the modes that a shaker at the centre can excite, without the ones it cannot', () => {
        const reachable = reachableModes(square, couplings(square, 0, 0));

        expect(reachable.some((entry) => entry.mode === 0)).toBe(false);
        expect(reachable.some((entry) => entry.mode === 1)).toBe(false);
        expect(reachable.some((entry) => entry.mode === 2)).toBe(true);
    });

    it('lists more of them when the shaker is off the axes', () => {
        const centre = reachableModes(square, couplings(square, 0, 0)).length;
        const off = reachableModes(square, couplings(square, 0.31, 0.17)).length;

        expect(off).toBeGreaterThan(centre);
    });
});

describe('the response of the plate', () => {
    const coupling = () => couplings(square, 0.31, 0.17);

    it('at resonance is mostly the mode, a quarter of a period behind the force', () => {
        const c = coupling();
        const k = 4;
        const a = amplitudes(square, c, square.omega[k], 100);

        // The imaginary part is the one that is big: -coupling * quality / omega^2
        expect(a[2 * k + 1]).toBeCloseTo((-c[k] * 100) / square.omega[k] ** 2, 6);
        expect(Math.abs(a[2 * k])).toBeLessThan(1e-9);
        expect(Math.abs(a[2 * k + 1])).toBeGreaterThan(5 * Math.abs(a[2 * (k + 3)]));
    });

    it('far below the first resonance follows the force: the plate gives in as a spring does', () => {
        const c = coupling();
        const a = amplitudes(square, c, 0.01, 100);

        for (let k = 0; k < 5; k++) {
            expect(a[2 * k]).toBeCloseTo(c[k] / square.omega[k] ** 2, 6);
            expect(Math.abs(a[2 * k + 1])).toBeLessThan(1e-5);
        }
    });

    it('far above a resonance goes the other way', () => {
        const c = coupling();
        const a = amplitudes(square, c, square.omega[0] * 20, 100);

        expect(Math.sign(a[0])).toBe(-Math.sign(c[0]));
    });

    it('has a peak at every mode that the force reaches, and the peak is as narrow as the quality says', () => {
        const c = coupling();
        const k = 5;
        const sweep = (low: number, high: number, steps = 4000) => {
            let best = { omega: low, size: 0 };

            for (let i = 0; i <= steps; i++) {
                const omega = low + ((high - low) * i) / steps;
                const size = overallResponse(square, c, omega, 200);

                if (size > best.size) best = { omega, size };
            }

            return best;
        };

        const peak = sweep(square.omega[k] * 0.97, square.omega[k] * 1.03);

        expect(peak.omega / square.omega[k]).toBeCloseTo(1, 3);

        // The half-power width of a resonance is its frequency divided by the quality factor
        const half = overallResponse(square, c, square.omega[k] * (1 + 1 / 400), 200);
        expect(half / peak.size).toBeCloseTo(Math.SQRT1_2, 1);
    });

    it('bends the plate like the mode at resonance: the points follow the shape of the mode', () => {
        const c = couplings(square, 0.31, 0.17);
        const k = 7;
        const points: number[] = [];

        for (let i = 0; i < 200; i++) points.push(((i * 37) % 100) / 100 - 0.5, ((i * 61) % 100) / 100 - 0.5);

        const bend = new Bend(square, Float64Array.from(points));
        bend.combine(amplitudes(square, c, square.omega[k], 500));

        const mode = square.sample(Float64Array.from(points));
        let dot = 0;
        let a = 0;
        let b = 0;

        for (let p = 0; p < 200; p++) {
            const m = mode[p * square.count + k];

            dot += bend.im[p] * m;
            a += bend.im[p] ** 2;
            b += m * m;
        }

        // (a mode that has a twin with the same frequency would blur this: the one of the square at index 7 does not)
        expect(Math.abs(dot) / Math.sqrt(a * b)).toBeGreaterThan(0.98);
    });
});

describe('the shaking', () => {
    it('is in proportion to the power of the shaker', () => {
        expect(shakingFactor(2) / shakingFactor(1)).toBeCloseTo(2, 12);
        expect(shakingFactor(0)).toBe(0);
    });
});

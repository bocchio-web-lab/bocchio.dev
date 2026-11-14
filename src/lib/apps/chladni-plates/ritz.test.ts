import { beforeAll, describe, expect, it } from 'vitest';
import { POISSON, analyzePlate, quadrature, type PlateModes } from './ritz';
import { SHAPES, createShape, type ShapeId } from './shapes';

// ---- The exact answer for a circle, to hold the numbers against

/** The Bessel function J (sign = -1) or the modified one I (sign = +1) of integer order, from its power series. */
function bessel(order: number, x: number, sign: 1 | -1): number {
    if (order < 0) return (sign === -1 && order % 2 !== 0 ? -1 : 1) * bessel(-order, x, sign);

    let term = (x / 2) ** order;
    for (let k = 1; k <= order; k++) term /= k;

    let sum = term;
    for (let k = 1; k < 150; k++) {
        term *= (sign * (x / 2) ** 2) / (k * (k + order));
        sum += term;
        if (Math.abs(term) < 1e-18 * Math.abs(sum)) break;
    }

    return sum;
}

/** Zero when `lambda` is a frequency of the free circular plate (radius 1) with `n` nodal diameters: both edge conditions at once. */
function freeEdge(n: number, lambda: number, nu: number): number {
    const x = lambda;
    const j = bessel(n, x, -1);
    const jp = (bessel(n - 1, x, -1) - bessel(n + 1, x, -1)) / 2;
    const i = bessel(n, x, 1);
    const ip = (bessel(n - 1, x, 1) + bessel(n + 1, x, 1)) / 2;

    // The second and third derivatives follow from the differential equations of the Bessel functions
    const jpp = -jp / x - (1 - (n * n) / (x * x)) * j;
    const jppp = -jpp / x + jp / (x * x) - (1 - (n * n) / (x * x)) * jp - (2 * n * n * j) / x ** 3;
    const ipp = -ip / x + (1 + (n * n) / (x * x)) * i;
    const ippp = -ipp / x + ip / (x * x) + (1 + (n * n) / (x * x)) * ip - (2 * n * n * i) / x ** 3;

    // Bending moment and Kirchhoff shear force at the edge, for the part of the mode made with each function
    const moment = (f: number, f1: number, f2: number) => lambda * lambda * f2 + nu * (lambda * f1 - n * n * f);
    const shear = (f: number, f1: number, f2: number, f3: number) =>
        lambda ** 3 * f3 + lambda * lambda * f2 - (1 + (2 - nu) * n * n) * lambda * f1 + (3 - nu) * n * n * f;

    return moment(j, jp, jpp) * shear(i, ip, ipp, ippp) - moment(i, ip, ipp) * shear(j, jp, jpp, jppp);
}

/** The lowest frequencies of a free circular plate of area 1, as `Omega`, with the number of nodal diameters of each. */
function circleFrequencies(nu: number, count: number): { omega: number; diameters: number }[] {
    const found: { omega: number; diameters: number }[] = [];

    for (let n = 0; n <= 9; n++) {
        let previous = freeEdge(n, 0.5, nu);
        let roots = 0;

        for (let lambda = 0.51; lambda < 12 && roots < 6; lambda += 0.01) {
            const here = freeEdge(n, lambda, nu);

            if (Math.sign(here) !== Math.sign(previous)) {
                let low = lambda - 0.01;
                let high = lambda;

                for (let k = 0; k < 60; k++) {
                    const middle = (low + high) / 2;
                    if (Math.sign(freeEdge(n, middle, nu)) === Math.sign(freeEdge(n, low, nu))) low = middle;
                    else high = middle;
                }

                const root = (low + high) / 2;

                // (a plate that is only moved or tilted, without bending, has a root of zero: it is no mode)
                if (root > 1) {
                    // For a plate of area 1 the radius is 1 / sqrt(pi), and Omega = omega L^2 ... = pi lambda^2
                    found.push({ omega: Math.PI * root * root, diameters: n });
                    roots++;
                }
            }

            previous = here;
        }
    }

    return found.sort((a, b) => a.omega - b.omega).slice(0, count);
}

// ---- The plates

const modes = new Map<string, PlateModes>();

function modesOf(id: ShapeId, parameter?: number): PlateModes {
    const key = `${id}:${parameter}`;

    if (!modes.has(key)) modes.set(key, analyzePlate(createShape(id, parameter)));

    return modes.get(key)!;
}

beforeAll(() => {
    modesOf('square');
    modesOf('circle');
});

describe('the integration points', () => {
    it.each(SHAPES.map((shape) => shape.id))('add up to the area of the %s', (id) => {
        const { weight } = quadrature(createShape(id), 14);

        expect(weight.reduce((sum, w) => sum + w, 0)).toBeCloseTo(1, 7);
    });

    it('integrate x squared on the square: a side of 1 gives 1/12', () => {
        const { x, weight } = quadrature(createShape('square'), 14);
        let sum = 0;
        for (let p = 0; p < x.length; p++) sum += weight[p] * x[p] * x[p];

        expect(sum).toBeCloseTo(1 / 12, 14);
    });

    it('integrate polynomials of twice the degree exactly on the square: x to the 28th gives 0.5^28 / 29', () => {
        const { x, weight } = quadrature(createShape('square'), 14);
        let sum = 0;
        for (let p = 0; p < x.length; p++) sum += weight[p] * x[p] ** 28;

        expect(sum / (0.5 ** 28 / 29)).toBeCloseTo(1, 10);
    });

    it('integrate x squared on the circle: a radius of 1/sqrt(pi) gives 1/(4 pi)', () => {
        const { x, weight } = quadrature(createShape('circle'), 14);
        let sum = 0;
        for (let p = 0; p < x.length; p++) sum += weight[p] * x[p] * x[p];

        expect(sum).toBeCloseTo(1 / (4 * Math.PI), 10);
    });

    it('integrate x y on the triangle: the plate is symmetric about the vertical axis, so nothing is left', () => {
        const { x, y, weight } = quadrature(createShape('triangle'), 14);
        let sum = 0;
        for (let p = 0; p < x.length; p++) sum += weight[p] * x[p] * y[p];

        expect(sum).toBeCloseTo(0, 12);
    });
});

describe('the free square plate', () => {
    // Leissa, Vibration of Plates (1969): the first frequencies of a free square plate with Poisson's ratio of 0.3
    it('has the first frequencies that are written in the books', () => {
        const { omega } = modesOf('square');

        expect(omega[0]).toBeCloseTo(13.468, 1);
        expect(omega[1]).toBeCloseTo(19.596, 1);
        expect(omega[2]).toBeCloseTo(24.27, 1);
    });

    it('has two modes with the same frequency, as it must: the plate looks the same turned by a quarter', () => {
        const { omega } = modesOf('square');

        expect(omega[3]).toBeCloseTo(omega[4], 6);
        expect(omega[3]).toBeCloseTo(34.8, 1);
    });

    it('does not count the motion of the plate as a whole among the modes', () => {
        expect(modesOf('square').omega[0]).toBeGreaterThan(10);
    });

    it('has modes that go up in frequency', () => {
        const { omega } = modesOf('square');

        for (let k = 1; k < omega.length; k++) expect(omega[k]).toBeGreaterThanOrEqual(omega[k - 1]);
    });

    it('has the same frequencies when the polynomials are of a degree two higher', () => {
        const higher = analyzePlate(createShape('square'), { degree: 16, modes: 20 }).omega;
        const standard = modesOf('square').omega;

        for (let k = 0; k < 20; k++) expect(standard[k] / higher[k]).toBeCloseTo(1, 2);
    });

    it('has modes that are even or odd when the plate is turned over: the first one, a twist, is odd', () => {
        const model = modesOf('square');
        const at = (x: number, y: number) => model.sample(Float64Array.from([x, y]))[0];

        expect(at(0.3, 0.2)).toBeCloseTo(-at(-0.3, 0.2), 4);
        expect(at(0.3, 0.2)).toBeCloseTo(-at(0.3, -0.2), 4);
        expect(at(0, 0)).toBeCloseTo(0, 4);
    });

    it('has a third mode that is even in both directions, with a ring of nodes', () => {
        const model = modesOf('square');
        const at = (x: number, y: number) => model.sample(Float64Array.from([x, y]))[2];

        expect(at(0.3, 0.2)).toBeCloseTo(at(-0.3, 0.2), 4);
        expect(at(0.3, 0.2)).toBeCloseTo(at(0.3, -0.2), 4);
        expect(at(0.3, 0.2)).toBeCloseTo(at(0.2, 0.3), 4);

        // The centre and the corners are on opposite sides of the nodal line
        expect(Math.sign(at(0, 0))).toBe(-Math.sign(at(0.49, 0.49)));
    });
});

describe('the free circular plate', () => {
    const exact = circleFrequencies(POISSON, 14);

    it('has the frequencies that Bessel functions give', () => {
        const { omega } = modesOf('circle');

        // Every frequency with one or more nodal diameters comes twice (the pattern can be turned), the rings only once
        const found: number[] = [];
        for (const { omega: value, diameters } of exact) {
            found.push(value);
            if (diameters > 0) found.push(value);
        }
        found.sort((a, b) => a - b);

        for (let k = 0; k < 12; k++) expect(omega[k] / found[k]).toBeCloseTo(1, 4);
    });

    it('starts with the mode that has two nodal diameters', () => {
        // lambda^2 = 5.358 on a plate of radius 1, which is Omega = 16.83 on a plate of area 1
        expect(modesOf('circle').omega[0]).toBeCloseTo(16.834, 2);
        expect(modesOf('circle').omega[1]).toBeCloseTo(16.834, 2);
    });

    it('has the ring mode third', () => {
        expect(modesOf('circle').omega[2]).toBeCloseTo(28.284, 2);
    });
});

describe('the modes', () => {
    it('are orthonormal: they have a mean square of 1 and none leaks into another', () => {
        const model = modesOf('hexagon');
        const { x, y, weight } = quadrature(model.shape, 14);
        const points = new Float64Array(2 * x.length);

        for (let p = 0; p < x.length; p++) {
            points[2 * p] = x[p];
            points[2 * p + 1] = y[p];
        }

        const values = model.sample(points);
        const checked = 10;

        for (let a = 0; a < checked; a++) {
            for (let b = a; b < checked; b++) {
                let integral = 0;
                for (let p = 0; p < x.length; p++) integral += weight[p] * values[p * model.count + a] * values[p * model.count + b];

                expect(integral).toBeCloseTo(a === b ? 1 : 0, 3);
            }
        }
    });

    it('have the degenerate pair of the triangle, which looks the same turned by a third', () => {
        const { omega } = modesOf('triangle');

        expect(omega[1]).toBeCloseTo(omega[2], 4);
    });

    it('have a lowest frequency that is lower for a long plate than for a square one', () => {
        expect(modesOf('rectangle', 2).omega[0]).toBeLessThan(modesOf('square').omega[0]);
    });

    it('give as many modes as asked, if the basis is big enough', () => {
        expect(analyzePlate(createShape('circle'), { modes: 10 }).count).toBe(10);
        expect(modesOf('circle').count).toBe(36);
    });

    it('are the same every time: no randomness is involved', () => {
        const shape = createShape('hexagon');
        const first = analyzePlate(shape, { degree: 10, modes: 8 }).omega;

        expect(Array.from(analyzePlate(shape, { degree: 10, modes: 8 }).omega)).toEqual(Array.from(first));
    });

    it('can be sampled anywhere, also outside the plate (where they go on as polynomials)', () => {
        const values = modesOf('square').sample(Float64Array.from([0.1, 0.1, 0.9, 0.9]));

        expect(values).toHaveLength(2 * modesOf('square').count);
        expect(Number.isFinite(values[values.length - 1])).toBe(true);
    });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { Grid } from './field';
import { amplitudes, couplings, shakingFactor } from './response';
import { Sand } from './sand';
import { SHAPES, createShape } from './shapes';
import { analyzePlate, type PlateModes } from './ritz';

/** The same numbers every time: a small linear congruential generator. */
function random(seed: number) {
    let state = seed;
    return () => {
        state = (state * 16807) % 2147483647;
        return state / 2147483647;
    };
}

let square: PlateModes;
let grid: Grid;

/** How hard the plate shakes the grains at a place: the quantity that they are sent away by. */
function shaking(gain: number, x: number, y: number): number {
    return gain * Math.abs(grid.standingAt(x, y));
}

beforeAll(() => {
    square = analyzePlate(createShape('square'));
    grid = new Grid(square, 96);
});

describe('the sand', () => {
    it.each(SHAPES.map((shape) => shape.id))('is on the %s at the start', (id) => {
        const shape = createShape(id);
        const sand = new Sand(500, shape);

        for (let i = 0; i < sand.count; i++) expect(shape.contains(sand.x[i], sand.y[i])).toBe(true);
    });

    it('is spread evenly: as many grains on one half of the square as on the other', () => {
        const sand = new Sand(20_000, createShape('square'), );
        sand.scatter(random(3));

        let right = 0;
        for (let i = 0; i < sand.count; i++) if (sand.x[i] > 0) right++;

        expect(right / sand.count).toBeCloseTo(0.5, 1);
    });

    it('knows where the plate ends as well as the plate does', () => {
        for (const id of ['triangle', 'hexagon', 'flower', 'rectangle'] as const) {
            const shape = createShape(id);
            const sand = new Sand(10, shape);
            const next = random(9);
            let wrong = 0;

            for (let i = 0; i < 5000; i++) {
                const x = (2 * next() - 1) * shape.half.x * 1.2;
                const y = (2 * next() - 1) * shape.half.y * 1.2;

                if (sand.inside(x, y) !== shape.contains(x, y)) wrong++;
            }

            // (only the points that are almost on the edge can be wrong)
            expect(wrong).toBeLessThan(10);
        }
    });

    it('stays where it is when the plate does not move', () => {
        const still = new Grid(square, 32);
        const sand = new Sand(200, createShape('square'));
        const before = Float32Array.from(sand.x);

        for (let n = 0; n < 20; n++) sand.shake(still, 1000, random(n + 1));

        expect(Array.from(sand.x)).toEqual(Array.from(before));
    });

    it('moves when the plate shakes hard enough, and stays inside the plate', () => {
        const c = couplings(square, 0, 0);
        grid.bend.combine(amplitudes(square, c, square.omega[2], 80));

        const gain = shakingFactor(2) * square.omega[2] ** 2;
        const shape = createShape('square');
        const sand = new Sand(2000, shape);
        sand.scatter(random(4));

        const before = Float32Array.from(sand.x);
        const next = random(5);

        for (let n = 0; n < 50; n++) sand.shake(grid, gain, next);

        expect(Array.from(sand.x)).not.toEqual(Array.from(before));
        for (let i = 0; i < sand.count; i++) expect(shape.contains(sand.x[i], sand.y[i])).toBe(true);
    });

    it('gathers where the plate stands still: on the nodal lines', () => {
        // The plate shaken at the frequency of a mode, which has a ring of nodal lines
        const c = couplings(square, 0, 0);
        grid.bend.combine(amplitudes(square, c, square.omega[2], 80));

        const gain = shakingFactor(2) * square.omega[2] ** 2;
        const sand = new Sand(3000, createShape('square'));
        const next = random(6);
        sand.scatter(next);

        const average = () => {
            let sum = 0;
            for (let i = 0; i < sand.count; i++) sum += shaking(gain, sand.x[i], sand.y[i]);
            return sum / sand.count;
        };

        const before = average();

        for (let n = 0; n < 600; n++) sand.shake(grid, gain, next);

        // At the start the grains are anywhere; at the end they are where the plate hardly moves
        expect(average()).toBeLessThan(0.25 * before);
    });

    it('tells how many grains have moved', () => {
        const still = new Grid(square, 32);
        const sand = new Sand(300, createShape('square'));

        expect(sand.shake(still, 3, random(1))).toBe(0);

        // A bend that shakes everything, enough to lift the grains and not to throw them off the plate
        still.bend.standing.fill(1);
        still.bend.version++;

        const moved = sand.shake(still, 3, random(2));

        expect(moved).toBeGreaterThan(200);
        expect(moved).toBeLessThanOrEqual(300);
    });

    it('looks again at the grains that were at rest when the bend changes', () => {
        const bend = new Grid(square, 32);
        const sand = new Sand(100, createShape('square'));

        // At rest: nothing shakes them, and they are not looked at again
        for (let n = 0; n < 3; n++) expect(sand.shake(bend, 1000, random(n + 1))).toBe(0);

        // The bend is changed behind their back: the version tells
        bend.bend.standing.fill(1);
        expect(sand.shake(bend, 1000, random(9))).toBe(0);

        bend.bend.version++;
        expect(sand.shake(bend, 1000, random(10))).toBeGreaterThan(50);
    });

    it('looks again at the grains when the shaker gets stronger, even if the bend is the same', () => {
        const bend = new Grid(square, 32);
        const sand = new Sand(100, createShape('square'));

        bend.bend.standing.fill(1);
        bend.bend.version++;

        // Too weak to lift a grain: they all go to rest
        expect(sand.shake(bend, 0.5, random(1))).toBe(0);
        expect(sand.shake(bend, 2, random(2))).toBeGreaterThan(50);
    });

    it('does not move at all when the plate is too weak to lift a grain anywhere', () => {
        const weak = new Grid(square, 32);
        const sand = new Sand(200, createShape('square'));

        weak.bend.standing.fill(1);
        weak.bend.version++;

        // The biggest shaking is just below what it takes to lift a grain; a little more and the sand moves
        expect(sand.shake(weak, 0.99, random(1))).toBe(0);
        expect(sand.shake(weak, 1.2, random(2))).toBeGreaterThan(100);
    });

    it('stays on the line where the plate stands still, while it moves elsewhere', () => {
        const bend = new Grid(square, 32);
        const sand = new Sand(2, createShape('square'));

        // A bend that is zero on the line x = 0 and grows on both sides
        for (let j = 0; j < 32; j++) {
            for (let i = 0; i < 32; i++) bend.bend.standing[j * 32 + i] = bend.coordinate(i) * 8;
        }
        bend.bend.version++;

        sand.x[0] = 0.0001;
        sand.y[0] = 0.1;
        sand.x[1] = 0.3;
        sand.y[1] = 0.1;

        const onTheLine = sand.x[0];
        const away = sand.x[1];

        for (let n = 0; n < 20; n++) sand.shake(bend, 40, random(n + 1));

        expect(sand.x[0]).toBe(onTheLine);
        expect(sand.x[1]).not.toBe(away);
    });

    it('does not move at all if the shaker is turned off', () => {
        const c = couplings(square, 0, 0);
        grid.bend.combine(amplitudes(square, c, square.omega[2], 80));

        const sand = new Sand(500, createShape('square'));
        const before = Float32Array.from(sand.x);

        for (let n = 0; n < 10; n++) sand.shake(grid, shakingFactor(0) * square.omega[2] ** 2, random(n + 1));

        expect(Array.from(sand.x)).toEqual(Array.from(before));
    });
});

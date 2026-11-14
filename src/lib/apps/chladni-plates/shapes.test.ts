import { describe, expect, it } from 'vitest';
import { gaussLegendre } from './linalg';
import { SHAPES, createShape, defaultParameter, type ShapeId } from './shapes';

const TAU = 2 * Math.PI;
const IDS = SHAPES.map((shape) => shape.id);

/** The area by brute force: the midpoint rule in a fine fan of directions. */
function area(id: ShapeId, parameter?: number): number {
    const shape = createShape(id, parameter);
    const n = 200_000;
    let sum = 0;

    for (let i = 0; i < n; i++) sum += 0.5 * shape.radius(((i + 0.5) * TAU) / n) ** 2 * (TAU / n);

    return sum;
}

/** The corners of a plate with straight sides: where each side starts. */
function corners(id: ShapeId, parameter?: number): [number, number][] {
    return createShape(id, parameter).pieces.map((piece) => piece.point(0));
}

describe('every plate', () => {
    it.each(IDS)('%s has an area of 1', (id) => {
        expect(area(id)).toBeCloseTo(1, 5);
    });

    it.each(IDS)('%s has pieces that give the same area', (id) => {
        const { nodes, weights } = gaussLegendre(40);
        let total = 0;

        for (const piece of createShape(id).pieces) {
            for (let i = 0; i < 40; i++) total += 0.5 * piece.cross((nodes[i] + 1) / 2) * (weights[i] / 2);
        }

        expect(total).toBeCloseTo(1, 6);
    });

    it.each(IDS)('%s is contained in the box that is said to hold it', (id) => {
        const shape = createShape(id);

        for (let i = 0; i < 360; i++) {
            const theta = (i * TAU) / 360;
            const x = shape.radius(theta) * Math.cos(theta);
            const y = shape.radius(theta) * Math.sin(theta);

            expect(Math.abs(x)).toBeLessThanOrEqual(shape.half.x + 1e-6);
            expect(Math.abs(y)).toBeLessThanOrEqual(shape.half.y + 1e-6);
        }
    });

    it.each(IDS)('%s holds its centre and leaves out what is far away', (id) => {
        const shape = createShape(id);

        expect(shape.contains(0, 0)).toBe(true);
        expect(shape.contains(3, 0)).toBe(false);
        expect(shape.contains(0, -3)).toBe(false);
    });

    it.each(IDS)('%s has pieces that follow one another all around the outline', (id) => {
        const { pieces } = createShape(id);

        pieces.forEach((piece, i) => {
            const [x, y] = piece.point(1);
            const [nextX, nextY] = pieces[(i + 1) % pieces.length].point(0);

            expect(x).toBeCloseTo(nextX, 10);
            expect(y).toBeCloseTo(nextY, 10);
        });
    });

    it.each(IDS)('%s has pieces that go counterclockwise', (id) => {
        for (const piece of createShape(id).pieces) {
            for (const s of [0, 0.25, 0.5, 0.75, 1]) expect(piece.cross(s)).toBeGreaterThan(0);
        }
    });

    it.each(IDS)('%s has pieces that are on the outline', (id) => {
        const shape = createShape(id);

        for (const piece of shape.pieces) {
            for (const s of [0, 0.3, 0.7, 1]) {
                const [x, y] = piece.point(s);

                expect(Math.hypot(x, y)).toBeCloseTo(shape.radius(Math.atan2(y, x)), 10);
            }
        }
    });

    it.each(IDS)('%s has an outline that goes once around', (id) => {
        const outline = createShape(id).outline(120);

        expect(outline.length % 2).toBe(0);

        // Going round the outline counterclockwise, the angle only grows (from the first point on)
        let turned = 0;
        const count = outline.length / 2;

        for (let i = 0; i < count; i++) {
            const next = (i + 1) % count;
            const before = Math.atan2(outline[2 * i + 1], outline[2 * i]);
            const after = Math.atan2(outline[2 * next + 1], outline[2 * next]);
            const step = ((after - before + 3 * Math.PI) % TAU) - Math.PI;

            expect(step).toBeGreaterThan(0);
            turned += step;
        }

        expect(turned).toBeCloseTo(TAU, 6);
    });
});

describe('the square', () => {
    const square = createShape('square');

    it('has a side of 1', () => {
        expect(square.half.x).toBeCloseTo(0.5, 12);
        expect(square.half.y).toBeCloseTo(0.5, 12);
        expect(square.radius(0)).toBeCloseTo(0.5, 12);
        expect(square.radius(Math.PI / 4)).toBeCloseTo(Math.SQRT1_2, 12);
    });

    it('has four straight sides, with the corners on the diagonals', () => {
        const found = corners('square');

        expect(found).toHaveLength(4);
        for (const [x, y] of found) {
            expect(Math.abs(x)).toBeCloseTo(0.5, 12);
            expect(Math.abs(y)).toBeCloseTo(0.5, 12);
        }
        expect(square.pieces.every((piece) => !piece.curved)).toBe(true);
    });

    it('holds the points inside and leaves out the points outside', () => {
        expect(square.contains(0.49, 0.49)).toBe(true);
        expect(square.contains(0.51, 0)).toBe(false);
        expect(square.contains(0.4, -0.51)).toBe(false);
    });
});

describe('the circle', () => {
    it('has a radius of 1 / sqrt(pi)', () => {
        const circle = createShape('circle');

        expect(circle.radius(1.234)).toBeCloseTo(1 / Math.sqrt(Math.PI), 12);
        expect(circle.half.x).toBeCloseTo(1 / Math.sqrt(Math.PI), 6);
        expect(circle.pieces.every((piece) => piece.curved)).toBe(true);
    });
});

describe('the ellipse and the rectangle', () => {
    it('are longer than they are wide by the ratio that was asked for', () => {
        for (const id of ['ellipse', 'rectangle'] as const) {
            const shape = createShape(id, 2);

            expect(shape.half.x / shape.half.y).toBeCloseTo(2, 3);
        }
    });

    it('the rectangle has its corners at the ends of the diagonals', () => {
        const found = corners('rectangle', 2);

        expect(found).toHaveLength(4);
        for (const [x, y] of found) expect(Math.abs(x) / Math.abs(y)).toBeCloseTo(2, 12);
    });

    it('the rectangle with ratio 1 would be the square', () => {
        expect(createShape('rectangle', 1.0000001).half.x).toBeCloseTo(createShape('square').half.x, 5);
    });
});

describe('the polygons', () => {
    it.each([
        ['triangle', 3],
        ['pentagon', 5],
        ['hexagon', 6],
    ] as const)('the %s has %i corners at the same distance', (id, sides) => {
        const found = corners(id);

        expect(found).toHaveLength(sides);

        const distances = found.map(([x, y]) => Math.hypot(x, y));
        for (const distance of distances) expect(distance).toBeCloseTo(distances[0], 12);
    });

    it('the triangle has the area of an equilateral triangle for that distance', () => {
        const [x, y] = corners('triangle')[0];

        expect((3 * Math.sqrt(3) * (x * x + y * y)) / 4).toBeCloseTo(1, 12);
    });

    it('the triangle points up and the hexagon lies flat', () => {
        const triangle = createShape('triangle');
        const hexagon = createShape('hexagon');

        expect(triangle.radius(Math.PI / 2)).toBeGreaterThan(triangle.radius(-Math.PI / 2));
        expect(hexagon.radius(Math.PI / 2)).toBeLessThan(hexagon.radius(0));
    });
});

describe('the parameters', () => {
    it('are the ones of the list for every shape that has one', () => {
        for (const { id, parameter } of SHAPES) expect(defaultParameter(id)).toBe(parameter?.value ?? 0);
    });

    it('make the rounded square go from the circle to the square', () => {
        const round = createShape('squircle', 2.5);
        const square = createShape('squircle', 8);

        expect(square.radius(Math.PI / 4) / square.radius(0)).toBeGreaterThan(round.radius(Math.PI / 4) / round.radius(0));
    });

    it('make the flower have as many petals as asked', () => {
        const flower = createShape('flower', 6);
        let maxima = 0;
        const n = 720;

        for (let i = 0; i < n; i++) {
            const here = flower.radius((i * TAU) / n);
            const before = flower.radius(((i - 1 + n) % n) * (TAU / n));
            const after = flower.radius(((i + 1) % n) * (TAU / n));

            if (here > before && here >= after) maxima++;
        }

        expect(maxima).toBe(6);
    });
});

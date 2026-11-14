import { describe, expect, it } from 'vitest';
import { DEFAULT_CAMERA, createMesh, drawingOrder, lighting, project } from './view3d';
import { SHAPES, createShape } from './shapes';

describe('the mesh', () => {
    it.each(SHAPES.map((shape) => shape.id))('of the %s has as many quads as the rings and segments say', (id) => {
        const mesh = createMesh(createShape(id), 10, 48);

        expect(mesh.quads.length).toBe(mesh.rings * mesh.segments * 4);
        expect(mesh.points.length).toBe((mesh.rings + 1) * mesh.segments * 2);
        expect(mesh.segments).toBeGreaterThanOrEqual(40);
    });

    it('starts at the centre and ends on the outline', () => {
        const shape = createShape('hexagon');
        const mesh = createMesh(shape, 8, 48);

        for (let j = 0; j < mesh.segments; j++) {
            expect(mesh.points[2 * j]).toBeCloseTo(0, 12);
            expect(mesh.points[2 * j + 1]).toBeCloseTo(0, 12);
        }

        const last = mesh.rings * mesh.segments;

        for (let j = 0; j < mesh.segments; j++) {
            const x = mesh.points[2 * (last + j)];
            const y = mesh.points[2 * (last + j) + 1];

            expect(Math.hypot(x, y)).toBeCloseTo(shape.radius(Math.atan2(y, x)), 10);
        }
    });

    it('has the corners of a polygon among its vertices', () => {
        const shape = createShape('triangle');
        const mesh = createMesh(shape, 4, 48);
        const last = mesh.rings * mesh.segments;
        const outline = Array.from({ length: mesh.segments }, (_, j) => [mesh.points[2 * (last + j)], mesh.points[2 * (last + j) + 1]]);

        for (const piece of shape.pieces) {
            const [x, y] = piece.point(0);
            expect(outline.some(([u, v]) => Math.hypot(u - x, v - y) < 1e-12)).toBe(true);
        }
    });

    it('is made of quads that cover the area of the plate', () => {
        const mesh = createMesh(createShape('square'), 12, 96);
        let area = 0;

        for (let q = 0; q < mesh.quads.length; q += 4) {
            const corner = (i: number) => [mesh.points[2 * mesh.quads[q + i]], mesh.points[2 * mesh.quads[q + i] + 1]];
            const [a, b, c, d] = [0, 1, 2, 3].map(corner);

            // The shoelace formula
            area += 0.5 * Math.abs(a[0] * b[1] - b[0] * a[1] + b[0] * c[1] - c[0] * b[1] + c[0] * d[1] - d[0] * c[1] + d[0] * a[1] - a[0] * d[1]);
        }

        expect(area).toBeCloseTo(1, 6);
    });
});

describe('the camera', () => {
    const flat = (...xy: number[]) => Float64Array.from(xy.flatMap((v, i) => (i % 2 === 0 ? [v] : [v, 0])));

    it('puts the centre of the plate in the middle of the screen', () => {
        const [x, y] = project(DEFAULT_CAMERA, Float64Array.from([0, 0, 0]), 800, 600);

        expect(x).toBeCloseTo(400, 9);
        expect(y).toBeCloseTo(300, 9);
    });

    it('looking straight down shows the plate as it is: x to the right and y up', () => {
        const camera = { yaw: 0, pitch: Math.PI / 2, zoom: 1 };
        const [ox, oy, , rx, ry, , ux, uy] = project(camera, flat(0, 0, 1, 0, 0, 1), 800, 800);

        expect(rx).toBeGreaterThan(ox);
        expect(ry).toBeCloseTo(oy, 6);
        expect(uy).toBeLessThan(oy);
        expect(ux).toBeCloseTo(ox, 6);
    });

    it('shows what is higher higher on the screen, and what is nearer bigger', () => {
        const camera = { yaw: 0, pitch: 0.8, zoom: 1 };
        const out = project(camera, Float64Array.from([0, 0, 0, 0, 0, 0.3, 0.5, -0.5, 0, 0.5, 0.5, 0]), 800, 800);

        expect(out[4]).toBeLessThan(out[1]); // a point that is raised
        expect(out[8]).toBeLessThan(out[2]); // the same x, farther from the eye: its depth is bigger...

        const near = Math.abs(out[6] - 400);
        const far = Math.abs(out[9] - 400);
        expect(near).toBeGreaterThan(far); // ... and it is smaller
    });

    it('turns the plate round with the yaw', () => {
        const front = project({ yaw: 0, pitch: Math.PI / 2, zoom: 1 }, Float64Array.from([1, 0, 0]), 800, 800);
        const side = project({ yaw: Math.PI / 2, pitch: Math.PI / 2, zoom: 1 }, Float64Array.from([1, 0, 0]), 800, 800);

        expect(front[0]).toBeGreaterThan(400);
        expect(side[0]).toBeCloseTo(400, 6);
        expect(side[1]).not.toBeCloseTo(400, 0);
    });

    it('makes everything bigger when it zooms in', () => {
        const small = project({ ...DEFAULT_CAMERA, zoom: 1 }, Float64Array.from([0.5, 0.2, 0]), 800, 800);
        const big = project({ ...DEFAULT_CAMERA, zoom: 2 }, Float64Array.from([0.5, 0.2, 0]), 800, 800);

        expect(Math.abs(big[0] - 400)).toBeCloseTo(2 * Math.abs(small[0] - 400), 9);
    });
});

describe('the drawing order', () => {
    it('puts the quads that are farthest away first', () => {
        // Three quads, made from the same four vertices indices at different depths
        const quads = Uint32Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        const screen = new Float64Array(12 * 3);

        // depths of the vertices of the quads: 2, 5 and 3
        for (let v = 0; v < 12; v++) screen[3 * v + 2] = [2, 2, 2, 2, 5, 5, 5, 5, 3, 3, 3, 3][v];

        expect(Array.from(drawingOrder(quads, screen))).toEqual([1, 2, 0]);
    });
});

describe('the lighting', () => {
    // A quad on the plane z = 0, and one that is steep
    const flat = Float64Array.from([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
    const steep = Float64Array.from([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1]);

    it('is bigger for a surface that faces the light than for one that is edge on', () => {
        expect(lighting([0, 1, 2, 3], flat)).toBeGreaterThan(0.7);
        expect(lighting([0, 1, 2, 3], steep)).toBeLessThan(lighting([0, 1, 2, 3], flat));
    });

    it('does not depend on which side the quad is seen from', () => {
        expect(lighting([0, 3, 2, 1], flat)).toBeCloseTo(lighting([0, 1, 2, 3], flat), 12);
    });

    it('is full for a quad that has collapsed to nothing', () => {
        expect(lighting([0, 0, 0, 0], flat)).toBe(1);
    });

    it('is between 0 and 1', () => {
        for (const space of [flat, steep]) {
            const value = lighting([0, 1, 2, 3], space);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
        }
    });
});

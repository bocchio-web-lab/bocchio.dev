import { describe, expect, it } from 'vitest';
import { toLatLon, toVector } from './earth';
import { frameOf, fromScreen, toScreen, turn, zoom } from './view';
import { cross, dot, length } from './vec';

describe('the frame of the screen', () => {
    it.each([
        [0, 0],
        [0.7, 0.3],
        [-2, 1.2],
        [3, -0.9],
    ])('is made of three directions at right angles, of length one (yaw %s, pitch %s)', (yaw, pitch) => {
        const { right, up, toward } = frameOf({ yaw, pitch, zoom: 1 });

        for (const direction of [right, up, toward]) expect(length(direction)).toBeCloseTo(1, 12);

        expect(dot(right, up)).toBeCloseTo(0, 12);
        expect(dot(right, toward)).toBeCloseTo(0, 12);
        expect(dot(up, toward)).toBeCloseTo(0, 12);

        // Right, up and towards the viewer, in this order, make a right-handed set
        const third = cross(right, up);
        expect(third[0]).toBeCloseTo(toward[0], 12);
        expect(third[1]).toBeCloseTo(toward[1], 12);
        expect(third[2]).toBeCloseTo(toward[2], 12);
    });

    it('has the viewer towards the place that is in the middle of the globe, with north at the top and east at the right', () => {
        const centre = { lat: 41.9, lon: 12.5 };
        const frame = frameOf({ yaw: (centre.lon * Math.PI) / 180, pitch: (centre.lat * Math.PI) / 180, zoom: 1 });

        // The place in the middle is the one that is nearest
        const [x, y, depth] = toScreen(frame, toVector(centre));
        expect(x).toBeCloseTo(0, 12);
        expect(y).toBeCloseTo(0, 12);
        expect(depth).toBeCloseTo(1, 12);

        // A place to the north is above it, a place to the east is at its right
        expect(toScreen(frame, toVector({ lat: 50, lon: 12.5 }))[1]).toBeGreaterThan(0);
        expect(toScreen(frame, toVector({ lat: 41.9, lon: 20 }))[0]).toBeGreaterThan(0);
        expect(toScreen(frame, toVector({ lat: 41.9, lon: 5 }))[0]).toBeLessThan(0);
    });

    it('gives the same place back when what is on the screen is put back where it was', () => {
        const frame = frameOf({ yaw: 0.4, pitch: -0.3, zoom: 1 });
        const result = toLatLon(fromScreen(frame, toScreen(frame, toVector({ lat: -20, lon: 100 }))));

        expect(result.lat).toBeCloseTo(-20, 9);
        expect(result.lon).toBeCloseTo(100, 9);
    });
});

describe('turning the view', () => {
    const view = { yaw: 0, pitch: 0.5, zoom: 2 };

    it('follows the pointer: dragging to the right turns the thing to the right', () => {
        // The place at the middle moves to the right, so the view moves to the west of it
        expect(turn(view, 50, 0, 200).yaw).toBeCloseTo(-0.25, 12);
        expect(turn(view, -50, 0, 200).yaw).toBeCloseTo(0.25, 12);
        expect(turn(view, 0, 50, 200).pitch).toBeCloseTo(0.75, 12);
    });

    it('does not go over the poles', () => {
        expect(turn(view, 0, 10_000, 100).pitch).toBeLessThan(Math.PI / 2);
        expect(turn(view, 0, -10_000, 100).pitch).toBeGreaterThan(-Math.PI / 2);
    });

    it('does not change the zoom', () => {
        expect(turn(view, 10, 10, 100).zoom).toBe(2);
    });
});

describe('zooming the view', () => {
    const view = { yaw: 0.1, pitch: 0.2, zoom: 2 };

    it('multiplies the zoom, and keeps the angles', () => {
        expect(zoom(view, 1.5, [0.5, 10])).toEqual({ yaw: 0.1, pitch: 0.2, zoom: 3 });
    });

    it('stops at the limits', () => {
        expect(zoom(view, 100, [0.5, 10]).zoom).toBe(10);
        expect(zoom(view, 0.001, [0.5, 10]).zoom).toBe(0.5);
    });
});

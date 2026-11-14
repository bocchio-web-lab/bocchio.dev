import { describe, expect, it } from 'vitest';
import { BODIES, type Body } from './catalog';
import { RINGS, chooseLabels, fitZoom, mapPoint, mapRadius, pickSpace, type SpaceScene } from './space-map';
import { KM_PER_AU, KM_PER_LIGHT_YEAR } from './units';
import { cross, length, type Vec3 } from './vec';

describe('the radius of the map', () => {
    it('is nothing at the Sun, and grows with the distance', () => {
        expect(mapRadius(0)).toBe(0);
        expect(mapRadius(KM_PER_AU)).toBeGreaterThan(mapRadius(0.5 * KM_PER_AU));
        expect(mapRadius(KM_PER_LIGHT_YEAR)).toBeGreaterThan(mapRadius(KM_PER_AU));
    });

    it('is one more for every ten times the distance, which makes it logarithmic', () => {
        for (const km of [KM_PER_AU, 30 * KM_PER_AU, KM_PER_LIGHT_YEAR, 2.5e6 * KM_PER_LIGHT_YEAR]) {
            expect(mapRadius(10 * km) - mapRadius(km)).toBeCloseTo(1, 1);
        }
    });

    it('has the rings one after the other, and all of them in the picture', () => {
        for (let i = 1; i < RINGS.length; i++) expect(RINGS[i].km).toBeGreaterThan(RINGS[i - 1].km);

        expect(mapRadius(RINGS[RINGS.length - 1].km)).toBeLessThan(15);
        expect(mapRadius(320e6 * KM_PER_LIGHT_YEAR)).toBeLessThan(15);
    });
});

describe('a point of the map', () => {
    it('is in the direction that the place is in, at the radius of the map', () => {
        const position: Vec3 = [3e8, -2e8, 1e8];
        const point = mapPoint(position);

        // Parallel to the position, and with the length that the map gives to the distance
        expect(length(cross(point, position)) / (length(point) * length(position))).toBeCloseTo(0, 12);
        expect(length(point)).toBeCloseTo(mapRadius(length(position)), 12);
        expect(Math.sign(point[0])).toBe(1);
        expect(Math.sign(point[1])).toBe(-1);
    });

    it('is in the middle for the Sun', () => {
        expect(mapPoint([0, 0, 0])).toEqual([0, 0, 0]);
    });
});

describe('the names on the map', () => {
    const box = (x: number, y: number) => ({ x, y, width: 50, height: 14 });

    it('are all shown when they do not cover each other', () => {
        expect(chooseLabels([box(0, 0), box(60, 0), box(0, 20)], 0)).toEqual([true, true, true]);
    });

    it('are left out when they would cover one that is more important, which is the one that is before', () => {
        expect(chooseLabels([box(0, 0), box(30, 5), box(100, 0)], 0)).toEqual([true, false, true]);
        expect(chooseLabels([box(30, 5), box(0, 0)], 0)).toEqual([true, false]);
    });

    it('are shown anyway for the first ones, if they are important', () => {
        expect(chooseLabels([box(0, 0), box(30, 5)], 2)).toEqual([true, true]);
    });

    it('keep away from the boxes that are taken already, like the names of the rings', () => {
        expect(chooseLabels([box(0, 0), box(100, 0)], 0, [box(30, 5)])).toEqual([false, true]);
        expect(chooseLabels([box(0, 0)], 1, [box(30, 5)])).toEqual([true]);
    });

    it('do not count the ones that were left out', () => {
        // The third touches the second, which is not shown, and not the first
        expect(chooseLabels([box(0, 0), box(40, 0), box(80, 0)], 0)).toEqual([true, false, true]);
    });
});

describe('what is at a point of the map', () => {
    // Looking from the north along the axis of the ecliptic would not do: a view from the side puts the bodies on a line
    const view = { yaw: 0, pitch: 0, zoom: 1 };
    const body = (id: string): Body => ({ id, name: id, group: 'Stars', color: '#ffffff', positionAt: () => [0, 0, 0] });

    const scene = (...positions: Vec3[]): SpaceScene => ({
        view,
        bodies: positions.map((_, i) => body(`body-${i}`)),
        positions,
        route: [],
        hovered: null,
    });

    // At a yaw of 0 the viewer is on the x axis: y goes to the right and z up. A body at 1 AU is 1.32 units from the middle,
    // which is 1.32 * 0.47 * 600 / 15 = 24.8 pixels in a picture of 600 by 600
    const OFFSET = (Math.log10(21) * 0.47 * 600) / 15;

    it('is the body that is there', () => {
        const picture = scene([0, KM_PER_AU, 0], [0, -KM_PER_AU, 0], [0, 0, KM_PER_AU]);

        expect(pickSpace(picture, 600, 600, 300 + OFFSET, 300)).toBe(0);
        expect(pickSpace(picture, 600, 600, 300 - OFFSET + 3, 300 + 2)).toBe(1);
        expect(pickSpace(picture, 600, 600, 300, 300 - OFFSET)).toBe(2);
    });

    it('is nothing when the pointer is far from all of them', () => {
        expect(pickSpace(scene([0, KM_PER_AU, 0]), 600, 600, 100, 100)).toBeNull();
        expect(pickSpace(scene([0, KM_PER_AU, 0]), 600, 600, 300 + OFFSET + 30, 300)).toBeNull();
    });

    it('is the first one of the list when two are on top of each other, like the Earth and the Moon', () => {
        const earthAndMoon = scene([0, KM_PER_AU, 0], [0, KM_PER_AU + 384_400, 0]);

        expect(pickSpace(earthAndMoon, 600, 600, 300 + OFFSET, 300)).toBe(0);
    });

    it('is not a body that is too far from the Sun for the picture, which is only there because it is in the line of sight', () => {
        // Zoomed in on the planets, and looking at them from above: a galaxy straight above would be drawn in the middle of them
        const zoomed = { ...scene([0, KM_PER_AU, 0], [0, 0, 1e6 * KM_PER_LIGHT_YEAR]), view: { yaw: 0, pitch: Math.PI / 2, zoom: 8 } };

        expect(pickSpace(zoomed, 600, 600, 300, 300)).toBeNull();
        expect(pickSpace({ ...zoomed, route: [1] }, 600, 600, 300, 300)).toBe(1);
    });

    it('is a real body for the catalog, in any view', () => {
        const positions = BODIES.map((entry) => entry.positionAt(new Date('2024-06-01T12:00:00Z')));
        const picture: SpaceScene = { view: { yaw: -0.8, pitch: 1, zoom: 1 }, bodies: BODIES, positions, route: [], hovered: null };

        expect(pickSpace(picture, 600, 600, 5, 5)).toBeNull();
    });
});

describe('the zoom that shows a route', () => {
    const at = (id: string): Vec3 => BODIES.find((body) => body.id === id)!.positionAt(new Date('2024-06-01T12:00:00Z'));

    it('is a lot for the planets, which are close to the Sun, and nothing for the galaxies', () => {
        expect(fitZoom([at('earth'), at('mars')])).toBeGreaterThan(5);
        expect(fitZoom([at('earth'), at('neptune')])).toBeGreaterThan(3);
        expect(fitZoom([at('earth'), at('neptune')])).toBeLessThan(fitZoom([at('earth'), at('mars')]));
        expect(fitZoom([at('earth'), at('andromeda')])).toBeCloseTo(1, 0);
        expect(fitZoom([at('earth'), at('coma')])).toBeLessThan(1);
    });

    it('is less when a body that is farther is added', () => {
        expect(fitZoom([at('earth'), at('mars'), at('proxima')])).toBeLessThan(fitZoom([at('earth'), at('mars')]));
    });

    it('does not zoom without end on bodies that are in the middle', () => {
        expect(fitZoom([at('sun')])).toBeCloseTo(8.5, 9);
        expect(fitZoom([at('earth'), at('moon')])).toBeCloseTo(8.5, 9);
    });
});

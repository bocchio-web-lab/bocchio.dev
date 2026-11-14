import { describe, expect, it } from 'vitest';
import { CITIES } from './cities';
import { toVector } from './earth';
import { fitGlobe, globeRadius, pickGlobe } from './globe';
import { frameOf, toScreen, type View } from './view';

const WIDTH = 600;
const HEIGHT = 450;

/** The view with a place in the middle of the globe. */
const centredOn = (lat: number, lon: number, zoom = 1): View => ({ yaw: (lon * Math.PI) / 180, pitch: (lat * Math.PI) / 180, zoom });

describe('the globe', () => {
    it('is as big as the canvas allows, and bigger with the zoom', () => {
        const view = centredOn(0, 0);

        expect(globeRadius(view, WIDTH, HEIGHT)).toBeCloseTo(0.46 * HEIGHT, 9);
        expect(globeRadius({ ...view, zoom: 2 }, WIDTH, HEIGHT)).toBeCloseTo(0.92 * HEIGHT, 9);
    });

    it('has in its middle the place that the view is centred on', () => {
        const place = pickGlobe(centredOn(41.9, 12.5), WIDTH, HEIGHT, WIDTH / 2, HEIGHT / 2)!;

        expect(place.lat).toBeCloseTo(41.9, 9);
        expect(place.lon).toBeCloseTo(12.5, 9);
    });

    it('is not there beside it', () => {
        const radius = globeRadius(centredOn(0, 0), WIDTH, HEIGHT);

        expect(pickGlobe(centredOn(0, 0), WIDTH, HEIGHT, WIDTH / 2 + radius * 1.01, HEIGHT / 2)).toBeNull();
        expect(pickGlobe(centredOn(0, 0), WIDTH, HEIGHT, 0, 0)).toBeNull();
        expect(pickGlobe(centredOn(0, 0), WIDTH, HEIGHT, WIDTH / 2 + radius * 0.99, HEIGHT / 2)).not.toBeNull();
    });

    it('gives back the place that was drawn at a point, for any place on the near side', () => {
        const view: View = { yaw: 0.9, pitch: -0.4, zoom: 1.7 };
        const frame = frameOf(view);
        const radius = globeRadius(view, WIDTH, HEIGHT);

        for (const [lat, lon] of [
            [10, 60],
            [-30, 40],
            [-10, 70],
            [5, 35],
        ]) {
            const [right, up, depth] = toScreen(frame, toVector({ lat, lon }));
            expect(depth).toBeGreaterThan(0);

            const place = pickGlobe(view, WIDTH, HEIGHT, WIDTH / 2 + radius * right, HEIGHT / 2 - radius * up)!;

            expect(place.lat).toBeCloseTo(lat, 6);
            expect(place.lon).toBeCloseTo(lon, 6);
        }
    });

    it('has north at the top and east at the right', () => {
        const view = centredOn(20, 30);
        const radius = globeRadius(view, WIDTH, HEIGHT);

        expect(pickGlobe(view, WIDTH, HEIGHT, WIDTH / 2, HEIGHT / 2 - radius / 2)!.lat).toBeGreaterThan(20);
        expect(pickGlobe(view, WIDTH, HEIGHT, WIDTH / 2 + radius / 2, HEIGHT / 2)!.lon).toBeGreaterThan(30);
    });
});

describe('the globe that shows a route', () => {
    const find = (name: string) => CITIES.find((city) => city.name === name)!;

    /** How far from the centre of the picture a place is, as a part of half of the smallest side, and whether it is on the near side. */
    function placeInPicture(view: View, place: { lat: number; lon: number }): { far: number; near: boolean } {
        const [right, up, depth] = toScreen(frameOf(view), toVector(place));

        return { far: (globeRadius(view, WIDTH, HEIGHT) * Math.hypot(right, up)) / (0.5 * Math.min(WIDTH, HEIGHT)), near: depth > 0 };
    }

    it('is turned to the place, if there is only one', () => {
        const view = fitGlobe([find('Rome')]);

        expect((view.yaw * 180) / Math.PI).toBeCloseTo(12.5, 9);
        expect((view.pitch * 180) / Math.PI).toBeCloseTo(41.9, 9);
        expect(view.zoom).toBe(3);
    });

    it('has all the places in the picture, and fills it with them', () => {
        for (const names of [['Paris', 'London'], ['Rome', 'Tokyo'], ['Rome', 'Cairo', 'Nairobi'], ['Sydney', 'Auckland', 'Perth']]) {
            const places = names.map(find);
            const view = fitGlobe(places);

            for (const place of places) {
                const { far, near } = placeInPicture(view, place);

                expect(near, names.join()).toBe(true);
                expect(far, names.join()).toBeLessThan(0.95);
            }

            // The farthest of them is near the edge of the picture, unless the globe cannot be any smaller
            const farthest = Math.max(...places.map((place) => placeInPicture(view, place).far));
            expect(farthest > 0.7 || view.zoom === 1, names.join()).toBe(true);
        }
    });

    it('is more zoomed in for a route that is shorter', () => {
        expect(fitGlobe([find('Paris'), find('London')]).zoom).toBeGreaterThan(fitGlobe([find('Rome'), find('Tokyo')]).zoom);
        expect(fitGlobe([find('Rome'), find('Tokyo')]).zoom).toBeGreaterThan(1);
    });

    it('shows the whole globe for places that are far from each other, even on opposite sides', () => {
        expect(fitGlobe([find('Rome'), find('Sydney')]).zoom).toBe(1);
        expect(fitGlobe([find('North Pole'), find('South Pole')]).zoom).toBe(1);
    });
});

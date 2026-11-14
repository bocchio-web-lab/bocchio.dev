import { describe, expect, it } from 'vitest';
import { BODIES, bodyById } from './catalog';
import { CITIES } from './cities';
import { EARTH_RADIUS } from './earth';
import { DistanceExplorer, FIRST_DAY, LAST_DAY } from './explorer.svelte';
import { MAX_STOPS } from './route';

const city = (name: string) => ({ ...CITIES.find((place) => place.name === name)! });
const body = (id: string) => bodyById(id)!;

describe('the explorer', () => {
    it('starts on the Earth, with nothing on the route', () => {
        const explorer = new DistanceExplorer();

        expect(explorer.scale).toBe('earth');
        expect(explorer.summary.stops).toEqual([]);
        expect(explorer.full).toBe(false);
    });

    it('keeps a route for the Earth and another one for space, and tells about the one that is shown', () => {
        const explorer = new DistanceExplorer();

        explorer.addPlace(city('Rome'));
        explorer.addPlace(city('Tokyo'));
        explorer.setScale('space');
        explorer.addBody(body('earth'));

        expect(explorer.summary.stops.map((stop) => stop.title)).toEqual(['Earth']);

        explorer.setScale('earth');

        expect(explorer.summary.stops.map((stop) => stop.title)).toEqual(['Rome', 'Tokyo']);
    });

    it('keeps a view for the Earth and another one for space', () => {
        const explorer = new DistanceExplorer();

        explorer.setView({ yaw: 1, pitch: 0.1, zoom: 2 });
        explorer.setScale('space');

        expect(explorer.view).not.toEqual({ yaw: 1, pitch: 0.1, zoom: 2 });

        explorer.setScale('earth');

        expect(explorer.view).toEqual({ yaw: 1, pitch: 0.1, zoom: 2 });
    });
});

describe('the route on the Earth', () => {
    it('grows with the places that are added, and shrinks when one is taken away, or all', () => {
        const explorer = new DistanceExplorer();

        for (const name of ['Rome', 'Tokyo', 'Sydney']) explorer.addPlace(city(name));
        expect(explorer.summary.legs).toHaveLength(2);

        explorer.remove(1);
        expect(explorer.summary.stops.map((stop) => stop.title)).toEqual(['Rome', 'Sydney']);
        expect(explorer.summary.legs).toHaveLength(1);

        explorer.clear();
        expect(explorer.summary.stops).toEqual([]);
    });

    it('turns the globe to a place that is added from the list, and leaves it where it is for one that is clicked', () => {
        const explorer = new DistanceExplorer();
        const before = explorer.view;

        explorer.addPlace(city('Sydney'));
        expect(explorer.view).toEqual(before);

        explorer.addPlace(city('Sydney'), true);
        expect((explorer.view.yaw * 180) / Math.PI).toBeCloseTo(151.21, 6);
        expect((explorer.view.pitch * 180) / Math.PI).toBeCloseTo(-33.87, 6);
        expect(explorer.view.zoom).toBe(before.zoom);
    });

    it('can go to the other side of the Earth: the tunnel to it is a diameter', () => {
        const explorer = new DistanceExplorer();

        explorer.addAntipode();
        expect(explorer.summary.stops).toEqual([]);

        explorer.addPlace(city('Rome'));
        explorer.addAntipode();

        expect(explorer.summary.stops[1].title).toBe('Antipode of Rome');
        expect(explorer.summary.legs[0][1].value).toContain(Math.round(2 * EARTH_RADIUS).toLocaleString('en-US'));

        // The opposite point of one that has no name
        explorer.clear();
        explorer.addPlace({ lat: 10, lon: 20 });
        explorer.addAntipode();
        expect(explorer.summary.stops[1]).toEqual({ title: 'Antipode', detail: '10.00° S, 160.00° W' });
    });

    it('has no more points than there are letters', () => {
        const explorer = new DistanceExplorer();

        for (let i = 0; i < MAX_STOPS + 5; i++) explorer.addPlace({ lat: i, lon: i });

        expect(explorer.summary.stops).toHaveLength(MAX_STOPS);
        expect(explorer.full).toBe(true);

        explorer.addAntipode();
        expect(explorer.summary.stops).toHaveLength(MAX_STOPS);
    });

    it('is shown whole by fitting the view: the globe goes to it and zooms in if the places are near', () => {
        const explorer = new DistanceExplorer();

        explorer.fit();
        expect(explorer.view.zoom).toBe(1);

        explorer.addPlace(city('Paris'));
        explorer.addPlace(city('London'));
        explorer.fit();

        expect(explorer.view.zoom).toBeGreaterThan(5);
        expect((explorer.view.pitch * 180) / Math.PI).toBeCloseTo(50.2, 0);
    });
});

describe('the route in space', () => {
    it('leaves the zoom alone for a single body, and shows the planets close up as soon as they are the ones that are measured', () => {
        const explorer = new DistanceExplorer();
        explorer.setScale('space');

        explorer.addBody(body('earth'));
        expect(explorer.view.zoom).toBe(1);

        explorer.addBody(body('mars'));
        expect(explorer.view.zoom).toBeGreaterThan(5);

        // A galaxy zooms it out so that it is in the picture too
        explorer.addBody(body('andromeda'));
        expect(explorer.view.zoom).toBeLessThan(1.2);

        explorer.remove(2);
        expect(explorer.view.zoom).toBeGreaterThan(5);

        explorer.clear();
        expect(explorer.view.zoom).toBe(1);
    });

    it('has the bodies as places in the list of all of them, for the picture', () => {
        const explorer = new DistanceExplorer();
        explorer.setScale('space');
        explorer.addBody(body('mars'));
        explorer.addBody(body('sun'));

        expect(explorer.routeIndices).toEqual([BODIES.indexOf(body('mars')), BODIES.indexOf(body('sun'))]);
        expect(explorer.positions).toHaveLength(BODIES.length);
        expect(explorer.summary.stops.map((stop) => stop.title)).toEqual(['Mars', 'Sun']);
    });

    it('depends on the day: Mars is not at the same distance in two years that are one and a half apart', () => {
        const explorer = new DistanceExplorer();
        explorer.setScale('space');
        explorer.addBody(body('earth'));
        explorer.addBody(body('mars'));

        explorer.setDay('2018-07-31');
        const near = explorer.summary.legs[0][0].value;

        explorer.setDay('2019-12-31');

        expect(near).toBe('0.385 AU');
        expect(explorer.summary.legs[0][0].value).not.toBe(near);
    });

    it('only takes days that the planets are known for', () => {
        const explorer = new DistanceExplorer();
        const day = explorer.day;

        for (const wrong of ['', 'yesterday', '2024-13-45x', '1799-12-31', '2051-01-01', '24/10/2026']) {
            explorer.setDay(wrong);
            expect(explorer.day, wrong).toBe(day);
        }

        for (const right of [FIRST_DAY, LAST_DAY, '2000-01-01']) {
            explorer.setDay(right);
            expect(explorer.day, right).toBe(right);
        }

        explorer.setToday();
        expect(explorer.day).toBe(new Date().toISOString().slice(0, 10));
    });
});

describe('the zoom', () => {
    it('stops at the limits of each picture', () => {
        const explorer = new DistanceExplorer();

        explorer.zoomBy(1000);
        expect(explorer.view.zoom).toBe(8);

        explorer.zoomBy(0.0001);
        expect(explorer.view.zoom).toBe(0.8);

        explorer.setScale('space');
        explorer.zoomBy(1000);
        expect(explorer.view.zoom).toBe(40);
    });
});

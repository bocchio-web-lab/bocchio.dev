import { describe, expect, it } from 'vitest';
import { bodyById } from './catalog';
import { CITIES } from './cities';
import { earthLeg } from './earth';
import { describeEarthRoute, describeSpaceRoute, type Place } from './route';
import { formatEarth } from './units';

const city = (name: string): Place => CITIES.find((place) => place.name === name)!;
const bodies = (...ids: string[]) => ids.map((id) => bodyById(id)!);

describe('a route on the Earth', () => {
    it('is empty when it has no points', () => {
        expect(describeEarthRoute([])).toEqual({ stops: [], legs: [], totals: [], note: null });
    });

    it('has no leg and no note with a single point', () => {
        const summary = describeEarthRoute([city('Rome')]);

        expect(summary.stops).toHaveLength(1);
        expect(summary.legs).toEqual([]);
        expect(summary.note).toBeNull();
    });

    it('lists a city by its name and a point by its coordinates, and tells if it is on land or at sea', () => {
        const { stops } = describeEarthRoute([city('Rome'), { lat: -20, lon: -140 }, { lat: 23, lon: 12 }]);

        expect(stops[0]).toEqual({ title: 'Rome', detail: '41.90° N, 12.50° E' });
        expect(stops[1]).toEqual({ title: '20.00° S, 140.00° W', detail: 'At sea' });
        expect(stops[2]).toEqual({ title: '23.00° N, 12.00° E', detail: 'On land' });
    });

    it('has a leg for each two points, with the way on the surface, the tunnel and the heading', () => {
        const summary = describeEarthRoute([city('Rome'), city('Tokyo')]);
        const leg = earthLeg(city('Rome'), city('Tokyo'));

        expect(summary.legs).toHaveLength(1);
        expect(summary.legs[0].map((row) => row.label)).toEqual(['Surface', 'Tunnel', 'Heading']);
        expect(summary.legs[0][0].value).toBe(formatEarth(leg.surface));
        expect(summary.legs[0][1].value).toBe(formatEarth(leg.tunnel));
        expect(summary.legs[0][1].note).toMatch(/km down at the deepest/);
        expect(summary.legs[0][2].value).toMatch(/^\d+° (N|NE|E|SE|S|SW|W|NW)$/);
    });

    it('says how long it takes to fall through a tunnel, which is the same for all of them', () => {
        expect(describeEarthRoute([city('Rome'), city('Tokyo')]).note).toMatch(/42 minutes/);
    });

    it('adds up only when there is more than one leg', () => {
        expect(describeEarthRoute([city('Rome'), city('Tokyo')]).totals).toEqual([]);

        const places = [city('Rome'), city('Tokyo'), city('Sydney')];
        const first = earthLeg(places[0], places[1]);
        const second = earthLeg(places[1], places[2]);
        const { totals } = describeEarthRoute(places);

        expect(totals.map((row) => row.label)).toEqual(['Surface', 'Tunnels']);
        expect(totals[0].value).toBe(formatEarth(first.surface + second.surface));
        expect(totals[1].value).toBe(formatEarth(first.tunnel + second.tunnel));
    });

    it('has a tunnel as long as the diameter between the two poles', () => {
        const { legs } = describeEarthRoute([city('North Pole'), city('South Pole')]);

        expect(legs[0][0].value).toBe('20,015 km · 12,437 mi');
        expect(legs[0][1].value).toBe('12,742 km · 7,918 mi');
    });
});

describe('a route in space', () => {
    const day = new Date('2024-04-05T12:00:00Z');

    it('is empty when it has no points', () => {
        expect(describeSpaceRoute([], day)).toEqual({ stops: [], legs: [], totals: [], note: null });
    });

    it('lists the bodies with the group they are in', () => {
        const { stops } = describeSpaceRoute(bodies('earth', 'andromeda', 'sirius'), day);

        expect(stops).toEqual([
            { title: 'Earth', detail: 'Solar System' },
            { title: 'Andromeda Galaxy', detail: 'Galaxies' },
            { title: 'Sirius', detail: 'Stars' },
        ]);
    });

    it('tells the distance from the Earth to the Sun and the time that the light takes', () => {
        const { legs } = describeSpaceRoute(bodies('earth', 'sun'), day);

        expect(legs[0][0].label).toBe('Distance');
        expect(legs[0][0].value).toBe('1.00 AU');
        expect(legs[0][0].note).toMatch(/million km$/);
        expect(legs[0][1].label).toBe('Light takes');
        expect(legs[0][1].value).toMatch(/^8 min \d+ s$/);
    });

    it('does not repeat a short distance in kilometres', () => {
        const { legs } = describeSpaceRoute(bodies('earth', 'moon'), day);

        expect(legs[0][0]).toEqual({ label: 'Distance', value: '384,400 km', note: undefined });
        expect(legs[0][1].value).toBe('1.3 s');
    });

    it('uses light-years for the galaxies, and years for the light', () => {
        const { legs } = describeSpaceRoute(bodies('earth', 'andromeda'), day);

        expect(legs[0][0].value).toBe('2.54 million ly');
        expect(legs[0][1].value).toBe('2.54 million years');
    });

    it('changes with the day for the planets', () => {
        const near = describeSpaceRoute(bodies('earth', 'mars'), new Date('2018-07-31T12:00:00Z')).legs[0][0].value;
        const far = describeSpaceRoute(bodies('earth', 'mars'), new Date('2019-09-01T12:00:00Z')).legs[0][0].value;

        expect(near).toBe('0.385 AU');
        expect(far).not.toBe(near);
    });

    it('adds up the legs when there are more than one', () => {
        expect(describeSpaceRoute(bodies('earth', 'sun'), day).totals).toEqual([]);

        const { totals, legs } = describeSpaceRoute(bodies('earth', 'sun', 'earth'), day);

        // The way to the Sun and back is twice as long
        expect(legs[0][0].value).toBe(legs[1][0].value);
        expect(totals.map((row) => row.label)).toEqual(['Distance', 'Light takes']);
        expect(totals[0].value).toBe('2.00 AU');
    });
});

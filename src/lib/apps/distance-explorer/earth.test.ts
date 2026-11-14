import { describe, expect, it } from 'vitest';
import { EARTH_RADIUS, FREE_FALL_MINUTES, antipode, bearing, centralAngle, compass, earthLeg, pointAlong, toLatLon, toVector } from './earth';
import { dot, length } from './vec';

const LONDON = { lat: 51.5074, lon: -0.1278 };
const PARIS = { lat: 48.8566, lon: 2.3522 };
const NEW_YORK = { lat: 40.7128, lon: -74.006 };
const LOS_ANGELES = { lat: 34.0522, lon: -118.2437 };

describe('places and vectors', () => {
    it('are the same thing seen in two ways', () => {
        for (const place of [LONDON, NEW_YORK, { lat: -33.9, lon: 151.2 }, { lat: 0, lon: 180 }, { lat: 89.9, lon: -45 }]) {
            const back = toLatLon(toVector(place));

            expect(back.lat).toBeCloseTo(place.lat, 9);
            // (the longitude of the date line can be told as 180 or as -180)
            expect(Math.abs(Math.abs(back.lon) - Math.abs(place.lon))).toBeLessThan(1e-9);
        }
    });

    it('put the axes where they are said to be', () => {
        expect(toVector({ lat: 0, lon: 0 })).toEqual([1, 0, 0]);
        expect(toVector({ lat: 90, lon: 0 })[2]).toBeCloseTo(1, 12);

        const east = toVector({ lat: 0, lon: 90 });
        expect(east[0]).toBeCloseTo(0, 12);
        expect(east[1]).toBeCloseTo(1, 12);
    });

    it('have a length of one', () => {
        expect(length(toVector(NEW_YORK))).toBeCloseTo(1, 12);
    });
});

describe('the distance on the surface', () => {
    it('is the length of an arc of a circle as big as the Earth', () => {
        // A quarter of a meridian, and a degree
        expect(EARTH_RADIUS * centralAngle({ lat: 0, lon: 0 }, { lat: 90, lon: 0 })).toBeCloseTo((Math.PI / 2) * EARTH_RADIUS, 6);
        expect(earthLeg({ lat: 10, lon: 20 }, { lat: 11, lon: 20 }).surface).toBeCloseTo(111.195, 2);
    });

    it('agrees with the distances that are well known', () => {
        expect(earthLeg(PARIS, LONDON).surface).toBeCloseTo(344, -1);
        expect(earthLeg(NEW_YORK, LOS_ANGELES).surface).toBeGreaterThan(3925);
        expect(earthLeg(NEW_YORK, LOS_ANGELES).surface).toBeLessThan(3945);
        expect(earthLeg(LONDON, NEW_YORK).surface).toBeGreaterThan(5555);
        expect(earthLeg(LONDON, NEW_YORK).surface).toBeLessThan(5585);
    });

    it('is the same in both directions, and zero from a place to itself', () => {
        expect(earthLeg(LONDON, NEW_YORK).surface).toBeCloseTo(earthLeg(NEW_YORK, LONDON).surface, 9);
        expect(earthLeg(LONDON, LONDON).surface).toBe(0);
    });

    it('is exact for places that are very near, and for places that are opposite', () => {
        const near = earthLeg({ lat: 45, lon: 7 }, { lat: 45, lon: 7.00001 }).surface;
        expect(near).toBeGreaterThan(0.0007);
        expect(near).toBeLessThan(0.0008);

        expect(earthLeg({ lat: 12, lon: 30 }, antipode({ lat: 12, lon: 30 })).surface).toBeCloseTo(Math.PI * EARTH_RADIUS, 6);
    });
});

describe('the tunnel', () => {
    it('goes through the centre of the Earth only for places that are opposite', () => {
        const leg = earthLeg({ lat: 41.9, lon: 12.5 }, antipode({ lat: 41.9, lon: 12.5 }));

        expect(leg.tunnel).toBeCloseTo(2 * EARTH_RADIUS, 6);
        expect(leg.depth).toBeCloseTo(EARTH_RADIUS, 6);
    });

    it('is a chord: shorter than the way on the surface, and not very much for places that are near', () => {
        const quarter = earthLeg({ lat: 0, lon: 0 }, { lat: 0, lon: 90 });

        expect(quarter.tunnel).toBeCloseTo(EARTH_RADIUS * Math.SQRT2, 6);
        expect(quarter.depth).toBeCloseTo(EARTH_RADIUS * (1 - Math.SQRT1_2), 6);
        expect(quarter.tunnel).toBeLessThan(quarter.surface);

        const near = earthLeg(PARIS, LONDON);
        expect(near.surface - near.tunnel).toBeLessThan(0.5);
        // A tunnel of 344 km only goes down 2 km and a bit, in the middle
        expect(near.depth).toBeGreaterThan(2.2);
        expect(near.depth).toBeLessThan(2.4);
    });

    it('takes the same time to fall through, whatever the length: about 42 minutes', () => {
        expect(FREE_FALL_MINUTES).toBeGreaterThan(42);
        expect(FREE_FALL_MINUTES).toBeLessThan(42.5);
    });
});

describe('the direction to go in', () => {
    it('is measured clockwise from the north', () => {
        expect(bearing({ lat: 0, lon: 0 }, { lat: 10, lon: 0 })).toBeCloseTo(0, 9);
        expect(bearing({ lat: 0, lon: 0 }, { lat: 0, lon: 10 })).toBeCloseTo(90, 9);
        expect(bearing({ lat: 0, lon: 0 }, { lat: -10, lon: 0 })).toBeCloseTo(180, 9);
        expect(bearing({ lat: 0, lon: 0 }, { lat: 0, lon: -10 })).toBeCloseTo(270, 9);
    });

    it('is not the same on the way back, and it bends the way that the sailors know', () => {
        // From London the shortest way to New York starts a little north of west
        expect(bearing(LONDON, NEW_YORK)).toBeGreaterThan(285);
        expect(bearing(LONDON, NEW_YORK)).toBeLessThan(291);
        expect(bearing(NEW_YORK, LONDON)).toBeGreaterThan(48);
        expect(bearing(NEW_YORK, LONDON)).toBeLessThan(54);
    });

    it('has a name on the compass', () => {
        expect(compass(0)).toBe('N');
        expect(compass(44)).toBe('NE');
        expect(compass(90)).toBe('E');
        expect(compass(200)).toBe('S');
        expect(compass(288)).toBe('W');
        expect(compass(350)).toBe('N');
    });
});

describe('the other side of the Earth', () => {
    it('is the place with the opposite latitude and the longitude on the other side', () => {
        expect(antipode({ lat: 45, lon: 10 })).toEqual({ lat: -45, lon: -170 });
        expect(antipode({ lat: -10, lon: -30 })).toEqual({ lat: 10, lon: 150 });
        expect(antipode({ lat: 0, lon: 0 })).toEqual({ lat: -0, lon: 180 });
    });

    it('is as far as it can be', () => {
        for (const place of [LONDON, NEW_YORK, { lat: -33.9, lon: 151.2 }]) {
            expect(centralAngle(place, antipode(place))).toBeCloseTo(Math.PI, 9);
        }
    });
});

describe('the path along the surface', () => {
    const a = toVector(PARIS);
    const b = toVector(LOS_ANGELES);

    it('starts at the first place and ends at the second', () => {
        for (const [t, end] of [
            [0, a],
            [1, b],
        ] as const) {
            const point = pointAlong(a, b, t);

            expect(point[0]).toBeCloseTo(end[0], 9);
            expect(point[1]).toBeCloseTo(end[1], 9);
            expect(point[2]).toBeCloseTo(end[2], 9);
        }
    });

    it('stays on the surface, and the middle is as far from both ends', () => {
        const middle = pointAlong(a, b, 0.5);

        expect(length(middle)).toBeCloseTo(1, 12);
        expect(Math.acos(dot(middle, a))).toBeCloseTo(Math.acos(dot(middle, b)), 9);
        expect(Math.acos(dot(middle, a))).toBeCloseTo(centralAngle(PARIS, LOS_ANGELES) / 2, 9);
    });

    it('has a way even between places that are opposite, which are at a right angle from both', () => {
        const north = toVector({ lat: 20, lon: 40 });
        const south = toVector(antipode({ lat: 20, lon: 40 }));
        const middle = pointAlong(north, south, 0.5);

        expect(length(middle)).toBeCloseTo(1, 12);
        expect(dot(middle, north)).toBeCloseTo(0, 9);
        expect(dot(middle, south)).toBeCloseTo(0, 9);
    });

    it('is the same path from a pole', () => {
        const point = pointAlong([0, 0, 1], toVector({ lat: 0, lon: 30 }), 0.5);

        expect(toLatLon(point).lat).toBeCloseTo(45, 9);
        expect(toLatLon(point).lon).toBeCloseTo(30, 9);
    });
});

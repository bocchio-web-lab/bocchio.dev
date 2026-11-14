import { describe, expect, it } from 'vitest';
import {
    KM_PER_AU,
    KM_PER_LIGHT_YEAR,
    LIGHT_SPEED,
    formatCoordinates,
    formatDistance,
    formatDuration,
    formatEarth,
    formatKilometres,
} from './units';

const YEAR = 365.25 * 86_400;

describe('the constants', () => {
    it('are the ones of the astronomers', () => {
        // A light-year is the distance of a year of light
        expect(KM_PER_LIGHT_YEAR / LIGHT_SPEED / YEAR).toBeCloseTo(1, 6);
        // The light of the Sun takes a little more than 8 minutes
        expect(KM_PER_AU / LIGHT_SPEED).toBeCloseTo(499.0, 1);
    });
});

describe('a distance on the Earth', () => {
    it('is in kilometres and in miles', () => {
        expect(formatEarth(8636.4)).toBe('8,636 km · 5,366 mi');
        expect(formatEarth(20015.1)).toBe('20,015 km · 12,437 mi');
        expect(formatEarth(344)).toBe('344 km · 214 mi');
    });

    it('has a decimal if it is very short', () => {
        expect(formatEarth(5.25)).toBe('5.3 km · 3.3 mi');
        expect(formatEarth(0)).toBe('0.0 km · 0.0 mi');
    });
});

describe('a distance in space', () => {
    it('is in kilometres as far as the Moon', () => {
        expect(formatDistance(384_400)).toBe('384,400 km');
        expect(formatDistance(0)).toBe('0 km');
    });

    it('is in astronomical units in the Solar System', () => {
        expect(formatDistance(KM_PER_AU)).toBe('1.00 AU');
        expect(formatDistance(30.07 * KM_PER_AU)).toBe('30.1 AU');
        expect(formatDistance(0.3727 * KM_PER_AU)).toBe('0.373 AU');
    });

    it('is in light-years among the stars and the galaxies', () => {
        expect(formatDistance(4.2465 * KM_PER_LIGHT_YEAR)).toBe('4.25 ly');
        expect(formatDistance(26_670 * KM_PER_LIGHT_YEAR)).toBe('26,700 ly');
        expect(formatDistance(2.537e6 * KM_PER_LIGHT_YEAR)).toBe('2.54 million ly');
        expect(formatDistance(320e6 * KM_PER_LIGHT_YEAR)).toBe('320 million ly');
    });

    it('does not show a digit too many when it rounds up to the next ten', () => {
        expect(formatDistance(9.996 * KM_PER_AU)).toBe('10.0 AU');
    });

    it('is also told in kilometres, with words and then powers of ten', () => {
        expect(formatKilometres(149_597_870.7)).toBe('149.6 million km');
        expect(formatKilometres(4.5e9)).toBe('4.50 billion km');
        expect(formatKilometres(4.02e13)).toBe('40.2 trillion km');
        expect(formatKilometres(2.4e19)).toBe('2.4 × 10¹⁹ km');
        expect(formatKilometres(3.04e21)).toBe('3.0 × 10²¹ km');
    });
});

describe('a time', () => {
    it('is in seconds, minutes and seconds, hours and minutes', () => {
        expect(formatDuration(1.28)).toBe('1.3 s');
        expect(formatDuration(KM_PER_AU / LIGHT_SPEED)).toBe('8 min 19 s');
        expect(formatDuration(4800)).toBe('1 h 20 min');
        expect(formatDuration(59.7)).toBe('1 min 0 s');
    });

    it('is in days when it is more than a day', () => {
        expect(formatDuration(90_000)).toBe('1.04 days');
    });

    it('is in years for the light of the stars and the galaxies', () => {
        expect(formatDuration(4.2465 * YEAR)).toBe('4.25 years');
        expect(formatDuration(26_670 * YEAR)).toBe('26,700 years');
        expect(formatDuration(2.54e6 * YEAR)).toBe('2.54 million years');
    });
});

describe('the coordinates of a place', () => {
    it('have the letters of the hemispheres', () => {
        expect(formatCoordinates({ lat: 41.9, lon: 12.5 })).toBe('41.90° N, 12.50° E');
        expect(formatCoordinates({ lat: -33.87, lon: -151.2 })).toBe('33.87° S, 151.20° W');
    });
});

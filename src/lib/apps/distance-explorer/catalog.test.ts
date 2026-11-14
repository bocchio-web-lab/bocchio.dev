import { describe, expect, it } from 'vitest';
import { BODIES, GROUPS, bodyById } from './catalog';
import { MOON_DISTANCE } from './solar-system';
import { KM_PER_AU, KM_PER_LIGHT_YEAR } from './units';
import { distance } from './vec';

const DAY = new Date('2024-06-01T12:00:00Z');

function between(a: string, b: string, date: Date = DAY): number {
    return distance(bodyById(a)!.positionAt(date), bodyById(b)!.positionAt(date));
}

describe('the places in space', () => {
    it('have a name that nobody else has', () => {
        expect(new Set(BODIES.map((body) => body.id)).size).toBe(BODIES.length);
        expect(new Set(BODIES.map((body) => body.name)).size).toBe(BODIES.length);
    });

    it('are in the groups that they are listed in, none of which is empty', () => {
        for (const group of GROUPS) expect(BODIES.some((body) => body.group === group), group).toBe(true);
        for (const body of BODIES) expect(GROUPS).toContain(body.group);
    });

    it('are in a place that is a number, on every day', () => {
        for (const date of [new Date('1850-01-01T00:00:00Z'), DAY, new Date('2049-12-31T00:00:00Z')]) {
            for (const body of BODIES) {
                expect(body.positionAt(date).every(Number.isFinite), body.name).toBe(true);
            }
        }
    });

    it('are found by their id', () => {
        expect(bodyById('earth')?.name).toBe('Earth');
        expect(bodyById('nowhere')).toBeUndefined();
    });
});

describe('the distances that people ask for', () => {
    it('from the Earth to the Sun is an astronomical unit, to the Moon 384,400 km', () => {
        expect(between('earth', 'sun') / KM_PER_AU).toBeGreaterThan(0.98);
        expect(between('earth', 'sun') / KM_PER_AU).toBeLessThan(1.02);
        expect(between('earth', 'moon')).toBeCloseTo(MOON_DISTANCE, 4);
    });

    it('from the Earth to Mars changes with the day, between 0.37 and 2.7 astronomical units', () => {
        const distances = [2003, 2005, 2007, 2010, 2014, 2018, 2020, 2022].map((year) => between('earth', 'mars', new Date(Date.UTC(year, 5, 1))) / KM_PER_AU);

        expect(Math.min(...distances)).toBeGreaterThan(0.37);
        expect(Math.max(...distances)).toBeLessThan(2.7);
        expect(Math.max(...distances) - Math.min(...distances)).toBeGreaterThan(0.5);
    });

    it('from Mars to the Sun is a bit more than one and a half astronomical units', () => {
        expect(between('mars', 'sun') / KM_PER_AU).toBeGreaterThan(1.38);
        expect(between('mars', 'sun') / KM_PER_AU).toBeLessThan(1.67);
    });

    it('from the Earth to the stars and the galaxies is the same, to the astronomical unit, as from the Sun', () => {
        expect(between('earth', 'proxima') / KM_PER_LIGHT_YEAR).toBeCloseTo(4.2465, 3);
        expect(between('earth', 'andromeda') / KM_PER_LIGHT_YEAR).toBeCloseTo(2_540_000, -2);
        expect(between('earth', 'milky-way') / KM_PER_LIGHT_YEAR).toBeCloseTo(26_670, 1);
    });
});

describe('the planets and the stars', () => {
    it('are the ones that move: the planets, and not the stars', () => {
        const later = new Date('2024-09-01T12:00:00Z');

        for (const id of ['mercury', 'earth', 'mars', 'neptune']) {
            expect(bodyById(id)!.positionAt(DAY)).not.toEqual(bodyById(id)!.positionAt(later));
        }

        for (const id of ['sun', 'sirius', 'andromeda']) {
            expect(bodyById(id)!.positionAt(DAY)).toEqual(bodyById(id)!.positionAt(later));
        }
    });
});

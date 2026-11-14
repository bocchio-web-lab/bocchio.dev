import { describe, expect, it } from 'vitest';
import { MOON_DISTANCE, planetPosition, solveKepler, moonPosition, type Planet } from './solar-system';
import { KM_PER_AU } from './units';
import { distance, length } from './vec';

/** The distance between two planets on a day, in astronomical units. */
function between(a: Planet, b: Planet, moment: string): number {
    const date = new Date(moment);

    return distance(planetPosition(a, date), planetPosition(b, date)) / KM_PER_AU;
}

/** The distance of a planet from the Sun on a day, in astronomical units. */
function fromTheSun(planet: Planet, moment: string): number {
    return length(planetPosition(planet, new Date(moment))) / KM_PER_AU;
}

describe('the Kepler equation', () => {
    it('is solved: the angle that is found fits the equation', () => {
        for (const eccentricity of [0, 0.0167, 0.0934, 0.2056, 0.2488]) {
            for (const meanAnomaly of [-3, -1.2, 0, 0.4, 1.5, 3.1, 6]) {
                const anomaly = solveKepler(meanAnomaly, eccentricity);

                expect(anomaly - eccentricity * Math.sin(anomaly)).toBeCloseTo(meanAnomaly, 10);
            }
        }
    });

    it('is a circle when the eccentricity is zero', () => {
        expect(solveKepler(1.234, 0)).toBeCloseTo(1.234, 12);
    });
});

describe('the Earth', () => {
    it('is nearest to the Sun in the first days of January and farthest in the first days of July', () => {
        expect(fromTheSun('earth', '2021-01-02T13:50:00Z')).toBeCloseTo(0.9833, 3);
        expect(fromTheSun('earth', '2021-07-05T22:27:00Z')).toBeCloseTo(1.0167, 3);
    });

    it('is where the Sun says it is at the start of the year 2000: at a longitude of 100.5 degrees', () => {
        const [x, y, z] = planetPosition('earth', new Date('2000-01-01T12:00:00Z'));

        expect((Math.atan2(y, x) * 180) / Math.PI).toBeCloseTo(100.5, 0);
        expect(Math.abs(z) / KM_PER_AU).toBeLessThan(1e-4);
    });

    it('is as far from the Sun as the average distance, on average over a year', () => {
        let total = 0;

        for (let day = 0; day < 365; day++) total += fromTheSun('earth', new Date(Date.UTC(2023, 0, 1 + day)).toISOString());

        expect(total / 365).toBeCloseTo(1, 2);
    });
});

describe('Mars', () => {
    it('came as near as 56 million kilometres in 2003, and nearer than it has for 60,000 years', () => {
        expect(between('earth', 'mars', '2003-08-27T09:51:00Z')).toBeCloseTo(0.3727, 2);
    });

    it('was at 57.6 million kilometres in 2018 and at 62.1 in 2020', () => {
        expect(between('earth', 'mars', '2018-07-31T05:50:00Z')).toBeCloseTo(0.385, 2);
        expect(between('earth', 'mars', '2020-10-06T11:18:00Z')).toBeCloseTo(0.4149, 2);
    });

    it('is on the other side of the Sun, six months after it was nearest', () => {
        expect(between('earth', 'mars', '2021-09-01T00:00:00Z')).toBeGreaterThan(2.5);
        expect(between('earth', 'mars', '2021-09-01T00:00:00Z')).toBeLessThan(2.7);
    });
});

describe('the other planets', () => {
    it('stay between the nearest and the farthest points of their orbits', () => {
        const orbits: [Planet, number, number][] = [
            ['mercury', 0.3075, 0.4667],
            ['venus', 0.7184, 0.7282],
            ['mars', 1.3814, 1.6660],
            ['jupiter', 4.95, 5.46],
            ['saturn', 9.02, 10.07],
            ['uranus', 18.2, 20.2],
            ['neptune', 29.8, 30.3],
            ['pluto', 29.6, 49.4],
        ];

        for (const [planet, nearest, farthest] of orbits) {
            for (const year of [1850, 1900, 1950, 2000, 2025, 2049]) {
                const distanceFromTheSun = fromTheSun(planet, `${year}-03-15T00:00:00Z`);

                expect(distanceFromTheSun, `${planet} in ${year}`).toBeGreaterThan(nearest - 0.01);
                expect(distanceFromTheSun, `${planet} in ${year}`).toBeLessThan(farthest + 0.01);
            }
        }
    });

    it('are where they should be: at their nearest to the Earth when they are on the same side of the Sun', () => {
        // Venus is between the Earth and the Sun on August 13 2023 (0.29 au), the others are in opposition
        expect(between('earth', 'venus', '2023-08-13T00:00:00Z')).toBeGreaterThan(0.28);
        expect(between('earth', 'venus', '2023-08-13T00:00:00Z')).toBeLessThan(0.3);

        expect(between('earth', 'jupiter', '2023-11-03T00:00:00Z')).toBeGreaterThan(3.9);
        expect(between('earth', 'jupiter', '2023-11-03T00:00:00Z')).toBeLessThan(4.05);

        expect(between('earth', 'saturn', '2023-08-27T00:00:00Z')).toBeGreaterThan(8.4);
        expect(between('earth', 'saturn', '2023-08-27T00:00:00Z')).toBeLessThan(8.9);

        expect(between('earth', 'uranus', '2023-11-13T00:00:00Z')).toBeGreaterThan(18);
        expect(between('earth', 'uranus', '2023-11-13T00:00:00Z')).toBeLessThan(19);

        expect(between('earth', 'neptune', '2023-09-19T00:00:00Z')).toBeGreaterThan(28.5);
        expect(between('earth', 'neptune', '2023-09-19T00:00:00Z')).toBeLessThan(29.5);

        expect(between('earth', 'pluto', '2023-07-22T00:00:00Z')).toBeGreaterThan(32.5);
        expect(between('earth', 'pluto', '2023-07-22T00:00:00Z')).toBeLessThan(34.5);
    });

    it('stay close to the plane of the Earth, except Pluto which is tilted', () => {
        for (const planet of ['venus', 'mars', 'jupiter', 'saturn', 'neptune'] as const) {
            const [x, y, z] = planetPosition(planet, new Date('2024-06-01T00:00:00Z'));

            expect(Math.abs(z) / Math.hypot(x, y), planet).toBeLessThan(0.07);
        }
    });
});

describe('the Moon', () => {
    it('is always at the same distance from the Earth', () => {
        for (const moment of ['2000-01-01T12:00:00Z', '2024-03-10T08:00:00Z', '2049-12-31T23:00:00Z']) {
            const date = new Date(moment);

            expect(distance(moonPosition(date), planetPosition('earth', date))).toBeCloseTo(MOON_DISTANCE, 6);
        }
    });

    it('goes round the Earth in a month: 13 degrees a day', () => {
        const angle = (moment: string) => {
            const date = new Date(moment);
            const [mx, my] = moonPosition(date);
            const [ex, ey] = planetPosition('earth', date);

            return (Math.atan2(my - ey, mx - ex) * 180) / Math.PI;
        };

        const step = (angle('2024-03-11T00:00:00Z') - angle('2024-03-10T00:00:00Z') + 360) % 360;

        expect(step).toBeCloseTo(13.18, 1);
    });
});

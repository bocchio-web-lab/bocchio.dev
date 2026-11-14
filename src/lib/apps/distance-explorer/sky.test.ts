import { describe, expect, it } from 'vitest';
import { SKY, dms, hms, skyPosition } from './sky';
import { KM_PER_LIGHT_YEAR } from './units';
import { distance, length, type Vec3 } from './vec';

/** The longitude and the latitude of a position along the axes of the ecliptic, in degrees. */
function ecliptic([x, y, z]: Vec3): [number, number] {
    return [((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI];
}

function position(id: string): Vec3 {
    const { rightAscension, declination, lightYears } = SKY.find((object) => object.id === id)!;

    return skyPosition(rightAscension, declination, lightYears);
}

describe('the angles of the astronomers', () => {
    it('are in hours, minutes and seconds for the right ascension: 24 hours is the whole circle', () => {
        expect(hms(6, 0, 0)).toBe(90);
        expect(hms(12, 0, 0)).toBe(180);
        expect(hms(1, 30, 36)).toBeCloseTo(22.65, 9);
    });

    it('are in degrees, minutes and seconds of arc for the declination, with the sign of the degrees', () => {
        expect(dms(12, 30, 0)).toBe(12.5);
        expect(dms(-62, 40, 46.1)).toBeCloseTo(-62.6795, 4);
        expect(dms(-29, 0, 28.1)).toBeCloseTo(-29.0078, 4);
    });
});

describe('a place in the sky', () => {
    it('is as far as it is said to be', () => {
        expect(length(skyPosition(123, -45, 7))).toBeCloseTo(7 * KM_PER_LIGHT_YEAR, -3);
    });

    it('is on the x axis at the start of the right ascension: the point of the sky where the Sun is in spring', () => {
        const [x, y, z] = skyPosition(0, 0, 1);

        expect(x).toBeCloseTo(KM_PER_LIGHT_YEAR, -3);
        expect(y).toBeCloseTo(0, 3);
        expect(z).toBeCloseTo(0, 3);
    });

    it('is turned by the tilt of the Earth: the pole of the sky is 23.4 degrees from the pole of the orbit', () => {
        const [, latitude] = ecliptic(skyPosition(0, 90, 1));
        expect(latitude).toBeCloseTo(90 - 23.4392911, 6);

        // And the middle of the sky six hours later is as far below the plane as the Earth is tilted
        expect(ecliptic(skyPosition(90, 0, 1))[1]).toBeCloseTo(-23.4392911, 6);
        expect(ecliptic(skyPosition(270, 0, 1))[1]).toBeCloseTo(23.4392911, 6);
    });

    it.each([
        ['sirius', 104.2, -39.6],
        ['vega', 285.4, 61.8],
        ['milky-way', 267.0, -5.6],
    ])('is where the books say %s is, with an ecliptic longitude of %s and a latitude of %s', (id, longitude, latitude) => {
        const [lambda, beta] = ecliptic(position(id));

        expect(lambda).toBeGreaterThan(longitude - 0.4);
        expect(lambda).toBeLessThan(longitude + 0.4);
        expect(beta).toBeGreaterThan(latitude - 0.3);
        expect(beta).toBeLessThan(latitude + 0.3);
    });
});

describe('the stars and the galaxies', () => {
    it('are apart from each other as far as they are known to be', () => {
        // The two big neighbours of the Milky Way are three quarters of a million light-years apart
        const andromedaToTriangulum = distance(position('andromeda'), position('triangulum')) / KM_PER_LIGHT_YEAR;
        expect(andromedaToTriangulum).toBeGreaterThan(700_000);
        expect(andromedaToTriangulum).toBeLessThan(850_000);

        // And the two Magellanic Clouds, 75,000
        const clouds = distance(position('lmc'), position('smc')) / KM_PER_LIGHT_YEAR;
        expect(clouds).toBeGreaterThan(65_000);
        expect(clouds).toBeLessThan(85_000);

        // Proxima and Alpha Centauri are one and the same stellar system, almost: a fifth of a light-year
        const centauri = distance(position('proxima'), position('alpha-centauri')) / KM_PER_LIGHT_YEAR;
        expect(centauri).toBeGreaterThan(0.1);
        expect(centauri).toBeLessThan(0.3);
    });

    it('have a name and a distance of their own', () => {
        expect(new Set(SKY.map((object) => object.id)).size).toBe(SKY.length);

        for (const { name, lightYears } of SKY) {
            expect(name.length).toBeGreaterThan(2);
            expect(lightYears).toBeGreaterThan(4);
        }
    });
});

import { KM_PER_LIGHT_YEAR } from './units';
import type { Vec3 } from './vec';

const RADIANS = Math.PI / 180;

/** The tilt of the axis of the Earth from the perpendicular to the plane of its orbit, in the year 2000. */
const OBLIQUITY = 23.4392911 * RADIANS;

/** An angle of right ascension, which astronomers give in hours, minutes and seconds, in degrees. */
export const hms = (hours: number, minutes: number, seconds: number): number => (hours + minutes / 60 + seconds / 3600) * 15;

/** An angle of declination, in degrees, minutes and seconds of arc, as degrees: the sign is the one of the degrees. */
export const dms = (degrees: number, minutes: number, seconds: number): number => Math.sign(degrees) * (Math.abs(degrees) + minutes / 60 + seconds / 3600);

/**
 * Where something is in the sky and how far, in kilometres from the Sun, along the axes of the ecliptic (the plane of the
 * orbit of the Earth), like the planets: the direction is given as the astronomers do, with the right ascension and the
 * declination, which are the longitude and the latitude of the sky, in degrees.
 */
export function skyPosition(rightAscension: number, declination: number, lightYears: number): Vec3 {
    const [alpha, delta] = [rightAscension * RADIANS, declination * RADIANS];
    const distance = lightYears * KM_PER_LIGHT_YEAR;

    // In the axes of the equator of the Earth...
    const x = Math.cos(delta) * Math.cos(alpha);
    const y = Math.cos(delta) * Math.sin(alpha);
    const z = Math.sin(delta);

    // ... and turned about the x axis to the ones of the orbit
    return [distance * x, distance * (y * Math.cos(OBLIQUITY) + z * Math.sin(OBLIQUITY)), distance * (z * Math.cos(OBLIQUITY) - y * Math.sin(OBLIQUITY))];
}

export interface SkyObject {
    id: string;
    name: string;
    group: 'Stars' | 'Galaxies';
    rightAscension: number;
    declination: number;
    lightYears: number;
}

/**
 * Stars and galaxies, with the distances that are best known today (the stars from the parallax measured by Hipparcos and
 * Gaia, the galaxies from the brightness of their stars and of their supernovae). Those of the galaxies are known to a few
 * per cent, and the one of Betelgeuse to about 15 %. Farther away than a few hundred million light-years the distance of a
 * galaxy depends on what is meant by it, because the universe grows while the light is on its way: they are not here.
 */
export const SKY: SkyObject[] = [
    { id: 'proxima', name: 'Proxima Centauri', group: 'Stars', rightAscension: hms(14, 29, 42.95), declination: dms(-62, 40, 46.1), lightYears: 4.2465 },
    { id: 'alpha-centauri', name: 'Alpha Centauri', group: 'Stars', rightAscension: hms(14, 39, 36.5), declination: dms(-60, 50, 2), lightYears: 4.365 },
    { id: 'barnard', name: "Barnard's Star", group: 'Stars', rightAscension: hms(17, 57, 48.5), declination: dms(4, 41, 36), lightYears: 5.963 },
    { id: 'sirius', name: 'Sirius', group: 'Stars', rightAscension: hms(6, 45, 8.9), declination: dms(-16, 42, 58), lightYears: 8.6 },
    { id: 'vega', name: 'Vega', group: 'Stars', rightAscension: hms(18, 36, 56.3), declination: dms(38, 47, 1), lightYears: 25.04 },
    { id: 'betelgeuse', name: 'Betelgeuse', group: 'Stars', rightAscension: hms(5, 55, 10.3), declination: dms(7, 24, 25), lightYears: 550 },

    { id: 'milky-way', name: 'Milky Way centre', group: 'Galaxies', rightAscension: hms(17, 45, 40.04), declination: dms(-29, 0, 28.1), lightYears: 26_670 },
    { id: 'lmc', name: 'Large Magellanic Cloud', group: 'Galaxies', rightAscension: hms(5, 23, 34.5), declination: dms(-69, 45, 22), lightYears: 163_000 },
    { id: 'smc', name: 'Small Magellanic Cloud', group: 'Galaxies', rightAscension: hms(0, 52, 44.8), declination: dms(-72, 49, 43), lightYears: 200_000 },
    { id: 'andromeda', name: 'Andromeda Galaxy', group: 'Galaxies', rightAscension: hms(0, 42, 44.3), declination: dms(41, 16, 9), lightYears: 2_540_000 },
    { id: 'triangulum', name: 'Triangulum Galaxy', group: 'Galaxies', rightAscension: hms(1, 33, 50.9), declination: dms(30, 39, 37), lightYears: 2_730_000 },
    { id: 'centaurus-a', name: 'Centaurus A', group: 'Galaxies', rightAscension: hms(13, 25, 27.6), declination: dms(-43, 1, 9), lightYears: 12_000_000 },
    { id: 'sombrero', name: 'Sombrero Galaxy', group: 'Galaxies', rightAscension: hms(12, 39, 59.4), declination: dms(-11, 37, 23), lightYears: 29_300_000 },
    { id: 'virgo', name: 'Virgo Cluster (M87)', group: 'Galaxies', rightAscension: hms(12, 30, 49.4), declination: dms(12, 23, 28), lightYears: 53_500_000 },
    { id: 'fornax', name: 'Fornax Cluster', group: 'Galaxies', rightAscension: hms(3, 38, 29.1), declination: dms(-35, 27, 3), lightYears: 62_000_000 },
    { id: 'coma', name: 'Coma Cluster', group: 'Galaxies', rightAscension: hms(12, 59, 35.7), declination: dms(27, 57, 33), lightYears: 320_000_000 },
];

import { KM_PER_AU } from './units';
import { scale, type Vec3 } from './vec';

export type Planet = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

/** Six numbers that tell the orbit of a planet: its size (au), its shape, its tilt, and three angles (degrees). */
type Orbit = [semiMajorAxis: number, eccentricity: number, inclination: number, meanLongitude: number, perihelionLongitude: number, nodeLongitude: number];

/**
 * The orbits of the planets at the year 2000, and how much each number changes in a century, from the table of NASA's Jet
 * Propulsion Laboratory "Keplerian elements for approximate positions of the major planets", which holds for the years 1800 to
 * 2050. The orbit of the Earth is the one of the centre of the Earth and the Moon.
 */
const ORBITS: Record<Planet, { at2000: Orbit; perCentury: Orbit }> = {
    mercury: {
        at2000: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
        perCentury: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
    },
    venus: {
        at2000: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
        perCentury: [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
    },
    earth: {
        at2000: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
        perCentury: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0],
    },
    mars: {
        at2000: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
        perCentury: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
    },
    jupiter: {
        at2000: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
        perCentury: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
    },
    saturn: {
        at2000: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
        perCentury: [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
    },
    uranus: {
        at2000: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
        perCentury: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
    },
    neptune: {
        at2000: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
        perCentury: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
    },
    pluto: {
        at2000: [39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684],
        perCentury: [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482],
    },
};

const RADIANS = Math.PI / 180;

/** The Julian date, in days, of a moment. */
const julianDate = (date: Date): number => date.getTime() / 86_400_000 + 2_440_587.5;

/** The angle E of a planet in its orbit from `M + e sin E = E`: the Kepler equation, which is solved by successive approximations. */
export function solveKepler(meanAnomaly: number, eccentricity: number): number {
    let anomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly);

    for (let i = 0; i < 20; i++) {
        const step = (anomaly - eccentricity * Math.sin(anomaly) - meanAnomaly) / (1 - eccentricity * Math.cos(anomaly));
        anomaly -= step;

        if (Math.abs(step) < 1e-12) break;
    }

    return anomaly;
}

/** Where a planet is on a day, in kilometres from the Sun, along the axes of the ecliptic (the plane of the orbit of the Earth). */
export function planetPosition(planet: Planet, date: Date): Vec3 {
    const { at2000, perCentury } = ORBITS[planet];
    const centuries = (julianDate(date) - 2_451_545) / 36_525;

    const [a, e, inclination, longitude, perihelion, node] = at2000.map((value, i) => value + perCentury[i] * centuries);

    // Where the planet is in its orbit, with the Sun at the origin and x towards the perihelion
    const anomaly = solveKepler((((longitude - perihelion) % 360) * RADIANS), e);
    const x = a * (Math.cos(anomaly) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(anomaly);

    // And in the plane of the Earth: turned by the angle of the perihelion from the node, tilted, and turned by the node
    const argument = (perihelion - node) * RADIANS;
    const [cosArgument, sinArgument] = [Math.cos(argument), Math.sin(argument)];
    const [cosNode, sinNode] = [Math.cos(node * RADIANS), Math.sin(node * RADIANS)];
    const [cosTilt, sinTilt] = [Math.cos(inclination * RADIANS), Math.sin(inclination * RADIANS)];

    return scale(
        [
            (cosArgument * cosNode - sinArgument * sinNode * cosTilt) * x + (-sinArgument * cosNode - cosArgument * sinNode * cosTilt) * y,
            (cosArgument * sinNode + sinArgument * cosNode * cosTilt) * x + (-sinArgument * sinNode + cosArgument * cosNode * cosTilt) * y,
            sinArgument * sinTilt * x + cosArgument * sinTilt * y,
        ],
        KM_PER_AU,
    );
}

/** The distance of the Moon from the Earth, in kilometres: the average, as it goes from 357,000 to 406,000 on its way round. */
export const MOON_DISTANCE = 384_400;

/** Where the Moon is on a day, in kilometres from the Sun, on a circle round the Earth. */
export function moonPosition(date: Date): Vec3 {
    const [x, y, z] = planetPosition('earth', date);

    // The Moon goes round in 27.3 days: 13.18 degrees a day
    const longitude = (218.316 + 13.176396 * (julianDate(date) - 2_451_545)) * RADIANS;

    return [x + MOON_DISTANCE * Math.cos(longitude), y + MOON_DISTANCE * Math.sin(longitude), z];
}

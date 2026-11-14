import { add, cross, dot, length, normalize, scale, subtract, type Vec3 } from './vec';

/** The mean radius of the Earth, in kilometres: the Earth is taken as a sphere. */
export const EARTH_RADIUS = 6371.0088;

/** Gravity at the surface, in metres per second squared. */
const GRAVITY = 9.80665;

/**
 * How long it takes to fall through a straight tunnel from one end to the other, with no air and no friction, in an Earth
 * of the same density everywhere. It is the same for every tunnel, long or short: half a swing of a weight on a spring.
 */
export const FREE_FALL_MINUTES = (Math.PI * Math.sqrt((EARTH_RADIUS * 1000) / GRAVITY)) / 60;

/** A place on the Earth, in degrees: north and east are positive. */
export interface LatLon {
    lat: number;
    lon: number;
}

const RADIANS = Math.PI / 180;

/** The unit vector of a place, with x through (0°, 0°), y through (0°, 90° E) and z through the North Pole. */
export function toVector({ lat, lon }: LatLon): Vec3 {
    const phi = lat * RADIANS;
    const lambda = lon * RADIANS;

    return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

export function toLatLon([x, y, z]: Vec3): LatLon {
    return { lat: Math.atan2(z, Math.hypot(x, y)) / RADIANS, lon: Math.atan2(y, x) / RADIANS };
}

/** The place on the other side of the Earth. */
export function antipode({ lat, lon }: LatLon): LatLon {
    return { lat: -lat, lon: lon > 0 ? lon - 180 : lon + 180 };
}

/** The angle at the centre of the Earth between two places, in radians (from 0 to pi). */
export function centralAngle(a: LatLon, b: LatLon): number {
    const [from, to] = [toVector(a), toVector(b)];

    // The arc tangent of the sine and the cosine is exact for places that are very near, and for those that are opposite
    return Math.atan2(length(cross(from, to)), dot(from, to));
}

/** The direction to start in to go from `a` to `b` by the shortest way, in degrees from the north, clockwise. */
export function bearing(a: LatLon, b: LatLon): number {
    const [phi1, phi2] = [a.lat * RADIANS, b.lat * RADIANS];
    const delta = (b.lon - a.lon) * RADIANS;

    const east = Math.sin(delta) * Math.cos(phi2);
    const north = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(delta);

    return ((Math.atan2(east, north) / RADIANS) + 360) % 360;
}

/** The name of the direction on the compass that a bearing is nearest to. */
export function compass(degrees: number): string {
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8];
}

/**
 * The point that is a part `t` (from 0 to 1) of the way along the shortest path on the surface from `a` to `b`, which are
 * unit vectors. If they are opposite there are many shortest paths, and this one goes over the North Pole.
 */
export function pointAlong(a: Vec3, b: Vec3, t: number): Vec3 {
    const cosine = dot(a, b);

    // The direction at `a` that points to `b`, along the surface
    let direction = subtract(b, scale(a, cosine));

    if (length(direction) < 1e-9) direction = subtract([0, 0, 1], scale(a, a[2]));
    if (length(direction) < 1e-9) direction = [1, 0, 0];

    const angle = Math.atan2(length(cross(a, b)), cosine) * t;

    return add(scale(a, Math.cos(angle)), scale(normalize(direction), Math.sin(angle)));
}

/** What there is between two places on the Earth. All the lengths are in kilometres. */
export interface EarthLeg {
    /** The shortest way along the surface. */
    surface: number;
    /** The length of the straight tunnel from one place to the other. */
    tunnel: number;
    /** How deep the tunnel is under the surface, at its deepest, in the middle. */
    depth: number;
    /** The direction to start in on the surface, in degrees from the north. */
    bearing: number;
}

export function earthLeg(a: LatLon, b: LatLon): EarthLeg {
    const angle = centralAngle(a, b);

    return {
        surface: EARTH_RADIUS * angle,
        // The tunnel is the chord of the angle, and it only goes through the centre if the places are opposite
        tunnel: 2 * EARTH_RADIUS * Math.sin(angle / 2),
        depth: EARTH_RADIUS * (1 - Math.cos(angle / 2)),
        bearing: bearing(a, b),
    };
}

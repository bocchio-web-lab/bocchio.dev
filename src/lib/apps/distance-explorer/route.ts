import type { Body } from './catalog';
import { FREE_FALL_MINUTES, compass, earthLeg, type LatLon } from './earth';
import { landAt } from './land-mask';
import { LIGHT_SPEED, formatCoordinates, formatDistance, formatDuration, formatEarth, formatKilometres, kilometres } from './units';
import { distance } from './vec';

/** A place on the Earth that is on a route: a city, or a point that was clicked, which has no name. */
export interface Place extends LatLon {
    name?: string;
}

/** A point of the route, as it is listed. */
export interface Stop {
    title: string;
    detail: string;
}

/** A line of the list of what there is between two points. */
export interface Row {
    label: string;
    value: string;
    note?: string;
}

/** A route in words: where it goes, what there is between each two points, and what it all comes to. */
export interface Summary {
    stops: Stop[];
    legs: Row[][];
    totals: Row[];
    note: string | null;
}

/** The most points that a route can have: each is given a letter. */
export const MAX_STOPS = 26;

/** The letter of the point of a route that has an index: A, B, C... */
export const letter = (index: number): string => String.fromCharCode(65 + (index % MAX_STOPS));

const total = (values: number[]): number => values.reduce((sum, value) => sum + value, 0);

export function describeEarthRoute(places: Place[]): Summary {
    const legs = places.slice(1).map((place, i) => earthLeg(places[i], place));

    return {
        stops: places.map((place) => ({
            title: place.name ?? formatCoordinates(place),
            detail: place.name ? formatCoordinates(place) : landAt(place.lat, place.lon) > 0.5 ? 'On land' : 'At sea',
        })),
        legs: legs.map((leg) => [
            { label: 'Surface', value: formatEarth(leg.surface) },
            { label: 'Tunnel', value: formatEarth(leg.tunnel), note: `${kilometres(leg.depth)} km down at the deepest` },
            { label: 'Heading', value: `${Math.round(leg.bearing) % 360}° ${compass(leg.bearing)}` },
        ]),
        totals:
            legs.length > 1
                ? [
                      { label: 'Surface', value: formatEarth(total(legs.map((leg) => leg.surface))) },
                      { label: 'Tunnels', value: formatEarth(total(legs.map((leg) => leg.tunnel))) },
                  ]
                : [],
        note: legs.length ? `Falling through a tunnel takes about ${Math.round(FREE_FALL_MINUTES)} minutes, whatever its length (with no air, no friction, and the same density everywhere in the Earth).` : null,
    };
}

/** The lines for a distance in space: how far, and how long the light takes. */
function spaceRows(km: number): Row[] {
    return [
        { label: 'Distance', value: formatDistance(km), note: km >= 1e7 ? formatKilometres(km) : undefined },
        { label: 'Light takes', value: formatDuration(km / LIGHT_SPEED) },
    ];
}

export function describeSpaceRoute(bodies: Body[], date: Date): Summary {
    const positions = bodies.map((body) => body.positionAt(date));
    const distances = positions.slice(1).map((position, i) => distance(positions[i], position));

    return {
        stops: bodies.map((body) => ({ title: body.name, detail: body.group })),
        legs: distances.map(spaceRows),
        totals: distances.length > 1 ? spaceRows(total(distances)) : [],
        note: null,
    };
}

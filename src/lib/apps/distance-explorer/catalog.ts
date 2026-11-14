import { SKY, skyPosition } from './sky';
import { moonPosition, planetPosition, type Planet } from './solar-system';
import type { Vec3 } from './vec';

export type Group = 'Solar System' | 'Stars' | 'Galaxies';

/** Something to measure a distance to, in space. */
export interface Body {
    id: string;
    name: string;
    group: Group;
    color: string;
    /** Where it is on a day, in kilometres from the Sun, along the axes of the ecliptic. Only the planets move. */
    positionAt: (date: Date) => Vec3;
}

const PLANETS: { planet: Planet; name: string; color: string }[] = [
    { planet: 'mercury', name: 'Mercury', color: '#a8a29e' },
    { planet: 'venus', name: 'Venus', color: '#fde68a' },
    { planet: 'earth', name: 'Earth', color: '#3b82f6' },
    { planet: 'mars', name: 'Mars', color: '#ef4444' },
    { planet: 'jupiter', name: 'Jupiter', color: '#fb923c' },
    { planet: 'saturn', name: 'Saturn', color: '#d4b96a' },
    { planet: 'uranus', name: 'Uranus', color: '#67e8f9' },
    { planet: 'neptune', name: 'Neptune', color: '#818cf8' },
    { planet: 'pluto', name: 'Pluto', color: '#c4a484' },
];

export const BODIES: Body[] = [
    { id: 'sun', name: 'Sun', group: 'Solar System', color: '#fbbf24', positionAt: () => [0, 0, 0] },

    ...PLANETS.flatMap(({ planet, name, color }): Body[] => {
        const body: Body = { id: planet, name, group: 'Solar System', color, positionAt: (date) => planetPosition(planet, date) };

        // The Moon is put next to the Earth
        return planet === 'earth' ? [body, { id: 'moon', name: 'Moon', group: 'Solar System', color: '#d1d5db', positionAt: moonPosition }] : [body];
    }),

    ...SKY.map(({ id, name, group, rightAscension, declination, lightYears }): Body => {
        const position = skyPosition(rightAscension, declination, lightYears);

        return { id, name, group, color: group === 'Stars' ? '#f8fafc' : '#c084fc', positionAt: () => position };
    }),
];

export const GROUPS: Group[] = ['Solar System', 'Stars', 'Galaxies'];

export const bodyById = (id: string): Body | undefined => BODIES.find((body) => body.id === id);

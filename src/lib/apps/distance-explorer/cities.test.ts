import { describe, expect, it } from 'vitest';
import { CITIES } from './cities';
import { earthLeg } from './earth';
import { landAt } from './land-mask';

/** Whether there is land within half a degree: the coast of the map is not the coast of the cities. */
function nearLand(lat: number, lon: number): boolean {
    for (const dLat of [-0.5, 0, 0.5]) {
        for (const dLon of [-0.5, 0, 0.5]) if (landAt(lat + dLat, lon + dLon) > 0.5) return true;
    }

    return false;
}

describe('the cities', () => {
    it('have a name that nobody else has', () => {
        expect(new Set(CITIES.map((city) => city.name)).size).toBe(CITIES.length);
    });

    it('are in order, for the list they are chosen from', () => {
        const names = CITIES.map((city) => city.name);

        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    it('are on the Earth', () => {
        for (const { name, lat, lon } of CITIES) {
            expect(Math.abs(lat), name).toBeLessThanOrEqual(90);
            expect(Math.abs(lon), name).toBeLessThanOrEqual(180);
        }
    });

    it('are on the land, or next to it (which tells that the sign of no number is wrong)', () => {
        for (const { name, lat, lon } of CITIES) {
            // The North Pole is ice on the sea
            if (name === 'North Pole') continue;

            expect(nearLand(lat, lon), name).toBe(true);
        }
    });

    it('are as far from each other as they are known to be', () => {
        const find = (name: string) => CITIES.find((city) => city.name === name)!;

        // Rome to Tokyo, Sydney to Buenos Aires, and the poles
        expect(earthLeg(find('Rome'), find('Tokyo')).surface).toBeGreaterThan(9800);
        expect(earthLeg(find('Rome'), find('Tokyo')).surface).toBeLessThan(9900);
        expect(earthLeg(find('Sydney'), find('Buenos Aires')).surface).toBeGreaterThan(11750);
        expect(earthLeg(find('Sydney'), find('Buenos Aires')).surface).toBeLessThan(11850);
        expect(earthLeg(find('North Pole'), find('South Pole')).tunnel).toBeCloseTo(12742, 0);
    });
});

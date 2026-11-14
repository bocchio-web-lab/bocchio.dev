import { describe, expect, it } from 'vitest';
import { landAt } from './land-mask';

describe('the land', () => {
    it.each([
        ['Rome', 41.9, 12.5],
        ['the Sahara', 23, 12],
        ['Siberia', 62, 100],
        ['the Amazon', -5, -60],
        ['the middle of Australia', -25, 135],
        ['Greenland', 72, -40],
        ['Antarctica', -80, 0],
        ['the South Pole', -90, 0],
    ])('is there at %s', (_, lat, lon) => {
        expect(landAt(lat, lon)).toBeGreaterThan(0.99);
    });

    it.each([
        ['the middle of the Pacific', 0, -140],
        ['the middle of the Atlantic', 30, -40],
        ['the Indian Ocean', -20, 80],
        ['the Mediterranean', 35, 18],
        ['the Drake Passage', -58, -65],
        ['the Arctic Ocean', 89, 0],
        ['the date line, in the sea', -30, 180],
    ])('is not there at %s', (_, lat, lon) => {
        expect(landAt(lat, lon)).toBeLessThan(0.01);
    });

    it('is a little less than a third of the surface of the Earth', () => {
        let land = 0;
        let total = 0;

        for (let lat = -89.5; lat < 90; lat += 1) {
            for (let lon = -179.5; lon < 180; lon += 1) {
                const weight = Math.cos((lat * Math.PI) / 180);

                land += weight * (landAt(lat, lon) > 0.5 ? 1 : 0);
                total += weight;
            }
        }

        expect(land / total).toBeGreaterThan(0.27);
        expect(land / total).toBeLessThan(0.31);
    });

    it('changes smoothly from the sea to the land, and stays between 0 and 1', () => {
        // Along the equator, across the coast of Ecuador (the Pacific is at the west)
        let previous = landAt(0, -83);
        let biggestStep = 0;

        for (let lon = -83; lon <= -75; lon += 0.01) {
            const value = landAt(0, lon);

            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);

            biggestStep = Math.max(biggestStep, Math.abs(value - previous));
            previous = value;
        }

        expect(landAt(0, -83)).toBe(0);
        expect(landAt(0, -75)).toBe(1);
        expect(biggestStep).toBeLessThan(0.05);
    });

    it('goes round the Earth and stops at the poles', () => {
        for (const lat of [-60, -20, 10, 45, 70]) {
            expect(landAt(lat, 179.999)).toBeCloseTo(landAt(lat, -179.999), 2);
        }

        for (const [lat, lon] of [
            [90, 0],
            [-90, 180],
            [90, -180],
        ]) {
            expect(Number.isFinite(landAt(lat, lon))).toBe(true);
        }
    });
});

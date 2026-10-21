import { describe, expect, it } from 'vitest';
import { createCountScale } from './count-scale';

describe('createCountScale', () => {
    it.each([2, 8, 24, 200, 201, 610, 8383, 16383])('covers 1 to %i circles from end to end', (maximum) => {
        const scale = createCountScale(maximum);

        expect(scale.count(0)).toBe(1);
        expect(scale.count(scale.steps)).toBe(maximum);
    });

    it.each([8, 24, 200, 201, 610, 8383])('never repeats a number of circles at the start (max %i)', (maximum) => {
        const scale = createCountScale(maximum);

        // Every one of the first positions must give a different, increasing number of circles
        for (let position = 1; position <= Math.min(scale.steps, 25); position++) {
            expect(scale.count(position)).toBeGreaterThan(scale.count(position - 1));
        }
    });

    it.each([8, 24, 610, 8383])('always grows with the position (max %i)', (maximum) => {
        const scale = createCountScale(maximum);

        for (let position = 1; position <= scale.steps; position++) {
            expect(scale.count(position)).toBeGreaterThanOrEqual(scale.count(position - 1));
        }
    });

    it('is linear when there are few circles', () => {
        const scale = createCountScale(24);

        expect(scale.steps).toBe(23);
        expect(Array.from({ length: 24 }, (_, position) => scale.count(position))).toEqual(
            Array.from({ length: 24 }, (_, i) => i + 1),
        );
    });

    it('goes back from the number of circles to the same position', () => {
        const scale = createCountScale(8383);

        for (let position = 0; position <= scale.steps; position++) {
            expect(scale.position(scale.count(position))).toBe(position);
        }
    });

    it('speeds up: the last steps add many more circles than the first ones', () => {
        const scale = createCountScale(8383);

        const first = scale.count(1) - scale.count(0);
        const last = scale.count(scale.steps) - scale.count(scale.steps - 1);

        expect(first).toBe(1);
        expect(last).toBeGreaterThan(100);
    });

    it('copes with drawings that have a single circle, or none', () => {
        expect(createCountScale(1)).toMatchObject({ steps: 0 });
        expect(createCountScale(1).count(0)).toBe(1);
        expect(createCountScale(0).count(0)).toBe(0);
    });
});

import { describe, expect, it } from 'vitest';
import { boundsOf } from './path';
import { PRESETS, getPreset } from './presets';
import { analyze, sortEpicycles } from './spectrum';

describe('presets', () => {
    it.each(PRESETS.map((preset) => [preset.id, preset] as const))('%s is a closed, centred drawing', (_id, preset) => {
        const path = preset.build();
        const bounds = boundsOf(path.x, path.y);

        expect(path.x.length & (path.x.length - 1)).toBe(0);
        expect(path.pen.every((value) => value === 1)).toBe(true);

        // Fits the 640px canvas, and fills most of it
        expect(bounds.minX).toBeGreaterThanOrEqual(0);
        expect(bounds.minY).toBeGreaterThanOrEqual(0);
        expect(bounds.maxX).toBeLessThanOrEqual(640);
        expect(bounds.maxY).toBeLessThanOrEqual(640);
        expect(Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)).toBeGreaterThan(500);

        // The last sample is a small step away from the first one: the path closes on itself
        const last = path.x.length - 1;
        const step = Math.hypot(path.x[0] - path.x[last], path.y[0] - path.y[last]);
        expect(step).toBeLessThan(5);
    });

    it('draws the heart exactly with eight circles', () => {
        const epicycles = sortEpicycles(analyze(getPreset('heart').build()), 'size');
        expect(epicycles.useful).toBeLessThanOrEqual(8);
    });

    it('needs many circles for the star, whose corners are sharp', () => {
        const epicycles = sortEpicycles(analyze(getPreset('star').build()), 'size');
        expect(epicycles.useful).toBeGreaterThan(100);
    });

    it('falls back to the first preset for an unknown id', () => {
        expect(getPreset('nope' as never).id).toBe(PRESETS[0].id);
    });
});

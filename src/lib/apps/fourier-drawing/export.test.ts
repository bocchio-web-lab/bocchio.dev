import { describe, expect, it } from 'vitest';
import { buildSvg, slugify, videoExtension } from './export';

const colors = { stroke: '#f97316', background: '#ffffff' };
const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 50 };

function square(pen: number[]) {
    return { x: Float64Array.from([0, 100, 100, 0]), y: Float64Array.from([0, 0, 50, 50]), pen: Uint8Array.from(pen) };
}

describe('buildSvg', () => {
    it('draws every sample as one connected path and closes it', () => {
        const { x, y, pen } = square([1, 1, 1, 1]);
        const svg = buildSvg({ x, y }, pen, bounds, colors);

        expect(svg).toContain('d="M0 0L100 0L100 50L0 50L0 0"');
    });

    it('lifts the pen where the path says so', () => {
        const { x, y, pen } = square([1, 0, 1, 0]);
        const svg = buildSvg({ x, y }, pen, bounds, colors);

        // The segment after sample 1 is a jump: a new subpath starts, and the last stretch is not closed
        expect(svg).toContain('d="M0 0L100 0M100 50L0 50"');
    });

    it('draws the jumps too when no pen flags are given', () => {
        const { x, y } = square([1, 0, 1, 0]);

        expect(buildSvg({ x, y }, null, bounds, colors)).toContain('d="M0 0L100 0L100 50L0 50L0 0"');
    });

    it('frames the drawing with a margin, on the given colours', () => {
        const { x, y, pen } = square([1, 1, 1, 1]);
        const svg = buildSvg({ x, y }, pen, bounds, colors);

        expect(svg).toContain('viewBox="-5 -5 110 60"');
        expect(svg).toContain('fill="#ffffff"');
        expect(svg).toContain('stroke="#f97316"');
    });

    it('rounds coordinates to keep the file small', () => {
        const svg = buildSvg(
            { x: Float64Array.from([0.123456, 10.98765]), y: Float64Array.from([5.55555, 7.000001]) },
            null,
            bounds,
            colors,
        );

        expect(svg).toContain('M0.1 5.6L11 7L0.1 5.6');
    });
});

describe('slugify', () => {
    it('makes names safe for files', () => {
        expect(slugify('My Photo (1).JPG')).toBe('my-photo-1');
        expect(slugify('Butterfly')).toBe('butterfly');
        expect(slugify('  --  ')).toBe('drawing');
    });
});

describe('videoExtension', () => {
    it('follows the container', () => {
        expect(videoExtension('video/mp4')).toBe('mp4');
        expect(videoExtension('video/webm;codecs=vp9')).toBe('webm');
    });
});

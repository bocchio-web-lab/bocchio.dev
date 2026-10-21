import { buildPath } from './path';
import type { Point, SampledPath } from './types';

export type PresetId = 'butterfly' | 'heart' | 'star' | 'infinity';

export interface Preset {
    id: PresetId;
    label: string;
    /** Builds the closed path of the drawing. */
    build: () => SampledPath;
}

/** Presets live in a square canvas of this size, like the images do. */
const CANVAS = 640;
const DRAWING = 560;

/**
 * Samples `curve` at `samples` evenly spaced values of its parameter, which runs from 0 to 1.
 * The curve is scaled and centred to fill the canvas. It is given with the y axis pointing up, as in maths books.
 */
function parametric(samples: number, curve: (t: number) => [number, number]): SampledPath {
    const x = new Float64Array(samples);
    const y = new Float64Array(samples);

    for (let i = 0; i < samples; i++) {
        [x[i], y[i]] = curve(i / samples);
        y[i] = -y[i];
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < samples; i++) {
        minX = Math.min(minX, x[i]);
        maxX = Math.max(maxX, x[i]);
        minY = Math.min(minY, y[i]);
        maxY = Math.max(maxY, y[i]);
    }

    const scale = DRAWING / Math.max(maxX - minX, maxY - minY);

    for (let i = 0; i < samples; i++) {
        x[i] = (x[i] - (minX + maxX) / 2) * scale + CANVAS / 2;
        y[i] = (y[i] - (minY + maxY) / 2) * scale + CANVAS / 2;
    }

    return { x, y, pen: new Uint8Array(samples).fill(1) };
}

/** A five-pointed star drawn in one go: every vertex is joined to the second one after it. */
function star(): SampledPath {
    const radius = DRAWING / 2 / Math.cos(Math.PI / 10);
    const vertices: Point[] = [];

    for (let k = 0; k <= 5; k++) {
        const angle = -Math.PI / 2 + (4 * Math.PI * k) / 5;
        vertices.push({ x: CANVAS / 2 + radius * Math.cos(angle), y: CANVAS / 2 + radius * Math.sin(angle) });
    }

    return buildPath([vertices]);
}

export const PRESETS: Preset[] = [
    {
        id: 'butterfly',
        label: 'Butterfly',
        // Temple Fay's butterfly curve, which takes twelve turns to close
        build: () =>
            parametric(4096, (t) => {
                const a = 12 * Math.PI * t;
                const r = Math.exp(Math.cos(a)) - 2 * Math.cos(4 * a) - Math.sin(a / 12) ** 5;
                return [Math.sin(a) * r, Math.cos(a) * r];
            }),
    },
    {
        id: 'heart',
        label: 'Heart',
        // Made of just four rotations: eight circles, one clockwise and one anticlockwise for each, draw it exactly
        build: () =>
            parametric(1024, (t) => {
                const a = 2 * Math.PI * t;
                return [
                    16 * Math.sin(a) ** 3,
                    13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a),
                ];
            }),
    },
    {
        id: 'star',
        label: 'Star',
        build: star,
    },
    {
        id: 'infinity',
        label: 'Infinity',
        // Lemniscate of Bernoulli
        build: () =>
            parametric(1024, (t) => {
                const a = 2 * Math.PI * t;
                const d = 1 + Math.sin(a) ** 2;
                return [Math.cos(a) / d, (Math.sin(a) * Math.cos(a)) / d];
            }),
    },
];

export function getPreset(id: PresetId): Preset {
    return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
}

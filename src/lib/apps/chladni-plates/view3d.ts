import type { PlateShape } from './shapes';

/** A mesh over the plate: rings around the centre, cut in segments. */
export interface Mesh {
    /** `x, y` of every vertex. The first ring is the centre, repeated once for each segment. */
    points: Float64Array;
    /** The four vertices of every quad. */
    quads: Uint32Array;
    rings: number;
    segments: number;
}

/**
 * Cuts the plate in quads: the outline is split in `segments` parts, as many rings are drawn from the centre to it,
 * and each ring is a copy of the outline, smaller. The corners of the outline are vertices, so they are not cut off.
 */
export function createMesh(shape: PlateShape, rings = 22, segments = 96): Mesh {
    const around = Math.max(2, Math.round(segments / shape.pieces.length));
    const outline: number[] = [];

    for (const piece of shape.pieces) {
        for (let i = 0; i < around; i++) outline.push(...piece.point(i / around));
    }

    const count = outline.length / 2;
    const points = new Float64Array((rings + 1) * count * 2);

    for (let ring = 0; ring <= rings; ring++) {
        const t = ring / rings;

        for (let j = 0; j < count; j++) {
            points[2 * (ring * count + j)] = t * outline[2 * j];
            points[2 * (ring * count + j) + 1] = t * outline[2 * j + 1];
        }
    }

    const quads = new Uint32Array(rings * count * 4);
    let q = 0;

    for (let ring = 0; ring < rings; ring++) {
        for (let j = 0; j < count; j++) {
            const next = (j + 1) % count;

            quads[q++] = ring * count + j;
            quads[q++] = ring * count + next;
            quads[q++] = (ring + 1) * count + next;
            quads[q++] = (ring + 1) * count + j;
        }
    }

    return { points, quads, rings, segments: count };
}

/** Where the plate is looked at from: all the angles are in radians. */
export interface Camera {
    /** The direction to look from, going round the plate. */
    yaw: number;
    /** How high above the plate: 0 is level with it, a quarter of a turn is looking straight down. */
    pitch: number;
    zoom: number;
}

export const DEFAULT_CAMERA: Camera = { yaw: -0.5, pitch: 0.95, zoom: 1 };

/** How far the eye is from the centre of the plate, in sizes of the plate. */
const DISTANCE = 3;

/**
 * Where points of space are on the screen, in perspective.
 *
 * @param points `x, y, z` after `x, y, z`: the plate lies on the plane `z = 0`, with `z` going up
 * @returns `x, y, depth` for each point: the position on the screen in pixels, and how far from the eye it is
 */
export function project(camera: Camera, points: Float64Array, width: number, height: number): Float64Array {
    const count = points.length / 3;
    const out = new Float64Array(count * 3);

    const cosYaw = Math.cos(camera.yaw);
    const sinYaw = Math.sin(camera.yaw);
    const cosPitch = Math.cos(camera.pitch);
    const sinPitch = Math.sin(camera.pitch);

    // The size on the screen of something of the size of the plate that is at the distance of its centre
    const focal = 2 * Math.min(width, height) * camera.zoom;

    for (let i = 0; i < count; i++) {
        const x = points[3 * i];
        const y = points[3 * i + 1];
        const z = points[3 * i + 2];

        // Turn the plate round, then see it from above at the angle of the pitch
        const right = x * cosYaw - y * sinYaw;
        const away = x * sinYaw + y * cosYaw;
        const depth = DISTANCE + away * cosPitch - z * sinPitch;
        const up = away * sinPitch + z * cosPitch;

        out[3 * i] = width / 2 + (focal * right) / depth;
        out[3 * i + 1] = height / 2 - (focal * up) / depth;
        out[3 * i + 2] = depth;
    }

    return out;
}

/** The order to draw the quads in: the ones that are farthest from the eye first. */
export function drawingOrder(quads: Uint32Array, screen: Float64Array): Uint32Array {
    const count = quads.length / 4;
    const depth = new Float64Array(count);

    for (let q = 0; q < count; q++) {
        depth[q] = screen[3 * quads[4 * q] + 2] + screen[3 * quads[4 * q + 1] + 2] + screen[3 * quads[4 * q + 2] + 2] + screen[3 * quads[4 * q + 3] + 2];
    }

    return Uint32Array.from({ length: count }, (_, q) => q).sort((a, b) => depth[b] - depth[a]);
}

/** Where the light comes from, as a direction of length 1. */
const LIGHT = [-0.35, -0.45, 0.82];

/**
 * How lit a quad is, from 0 to 1, from the way its two diagonals point (the plate's surface is lit from both sides).
 *
 * @param space `x, y, z` of the vertices, before the projection
 */
export function lighting(quad: ArrayLike<number>, space: Float64Array): number {
    const [a, b, c, d] = [0, 1, 2, 3].map((i) => quad[i] * 3);

    // The cross product of the diagonals is perpendicular to the quad
    const ux = space[c] - space[a];
    const uy = space[c + 1] - space[a + 1];
    const uz = space[c + 2] - space[a + 2];
    const vx = space[d] - space[b];
    const vy = space[d + 1] - space[b + 1];
    const vz = space[d + 2] - space[b + 2];

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz);

    if (length === 0) return 1;

    return Math.abs(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / length;
}

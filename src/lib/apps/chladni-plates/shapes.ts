import { gaussLegendre } from './linalg';

export type ShapeId = 'square' | 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'pentagon' | 'hexagon' | 'squircle' | 'flower';

export interface ShapeOption {
    id: ShapeId;
    label: string;
    /** What a slider can change in the shape, for the shapes that have something to change. */
    parameter?: { label: string; min: number; max: number; step: number; value: number };
}

export const SHAPES: ShapeOption[] = [
    { id: 'square', label: 'Square' },
    { id: 'rectangle', label: 'Rectangle', parameter: { label: 'Length compared to width', min: 1.1, max: 2.5, step: 0.05, value: 1.5 } },
    { id: 'circle', label: 'Circle' },
    { id: 'ellipse', label: 'Ellipse', parameter: { label: 'Length compared to width', min: 1.1, max: 2.5, step: 0.05, value: 1.5 } },
    { id: 'triangle', label: 'Triangle' },
    { id: 'pentagon', label: 'Pentagon' },
    { id: 'hexagon', label: 'Hexagon' },
    { id: 'squircle', label: 'Rounded square', parameter: { label: 'Squareness', min: 2.5, max: 8, step: 0.5, value: 4 } },
    { id: 'flower', label: 'Flower', parameter: { label: 'Petals', min: 2, max: 8, step: 1, value: 5 } },
];

/** The value of the parameter of a shape when nobody has changed it (zero for the shapes that have none). */
export function defaultParameter(id: ShapeId): number {
    return SHAPES.find((shape) => shape.id === id)?.parameter?.value ?? 0;
}

/**
 * A piece of the outline, and with it the piece of the plate that goes from the centre to it: a straight side or a
 * curved arc. Seen from the centre, a point of the piece is `t c(s)`, where `c(s)` is a point of the outline,
 * `s` goes from 0 to 1 along the piece and `t` from 0 (the centre) to 1 (the outline).
 */
export interface Piece {
    /** The point of the outline at `s`. */
    point(s: number): [number, number];
    /** `x y' - y x'` at `s`, with the derivatives with respect to `s`: an area element of the plate is `t cross(s) dt ds`. */
    cross(s: number): number;
    /** A curved piece needs many points to be integrated well; for a straight one a few are enough, and exact. */
    curved: boolean;
}

/**
 * The outline of a plate. Every plate has an area of 1, whatever its shape: sheets of the same metal and the same
 * thickness cut into different shapes then have the same number of modes in the same frequency range, which
 * makes them easy to compare. The centre of the plate is the point that the pieces are seen from.
 */
export interface PlateShape {
    readonly id: ShapeId;
    readonly parameter: number;
    /** The outline, one piece after the other, counterclockwise. */
    readonly pieces: Piece[];
    /** Distance from the centre to the edge, in the direction `theta` (in radians). */
    radius(theta: number): number;
    /** Half the width and half the height of the box around the plate. */
    readonly half: { x: number; y: number };
    contains(x: number, y: number): boolean;
    /** The outline as a closed polygon, `x, y` after `x, y`. */
    outline(count?: number): Float64Array;
}

interface RawShape {
    pieces: Piece[];
    radius: (theta: number) => number;
}

const TAU = 2 * Math.PI;

/** A straight side from one corner to the next. */
function side([x0, y0]: [number, number], [x1, y1]: [number, number]): Piece {
    return {
        point: (s) => [x0 + s * (x1 - x0), y0 + s * (y1 - y0)],
        cross: () => x0 * y1 - y0 * x1,
        curved: false,
    };
}

/** A piece of the outline that is smooth, between two directions, given the distance to the edge in each direction. */
function arc(radius: (theta: number) => number, from: number, to: number): Piece {
    const angle = (s: number) => from + s * (to - from);

    return {
        point: (s) => [radius(angle(s)) * Math.cos(angle(s)), radius(angle(s)) * Math.sin(angle(s))],
        cross: (s) => radius(angle(s)) ** 2 * (to - from),
        curved: true,
    };
}

/** The outline made of arcs between the given directions, in ascending order, going once around. */
function arcs(radius: (theta: number) => number, directions: number[]): Piece[] {
    return directions.map((from, i) => arc(radius, from, i + 1 < directions.length ? directions[i + 1] : directions[0] + TAU));
}

function polygon(sides: number): RawShape {
    // A vertex points up when there is an odd number of them; with an even number a side lies at the bottom
    const first = sides % 2 === 1 ? Math.PI / 2 : Math.PI / 2 + Math.PI / sides;
    const step = TAU / sides;

    // Counterclockwise, starting from the vertex that is first when going round from the direction 0
    const corners: [number, number][] = Array.from({ length: sides }, (_, i) => first + i * step)
        .map((angle) => ((angle % TAU) + TAU) % TAU)
        .sort((a, b) => a - b)
        .map((angle) => [Math.cos(angle), Math.sin(angle)]);

    return {
        pieces: corners.map((corner, i) => side(corner, corners[(i + 1) % sides])),
        radius: (theta) => {
            // How far the direction is from the middle of the nearest side
            const away = ((((theta - first) % step) + step) % step) - step / 2;
            return Math.cos(Math.PI / sides) / Math.cos(away);
        },
    };
}

function rawShape(id: ShapeId, parameter: number): RawShape {
    switch (id) {
        case 'circle': {
            const radius = () => 1;
            return { radius, pieces: arcs(radius, [0, 1, 2, 3].map((i) => (i * TAU) / 4)) };
        }

        case 'ellipse': {
            const radius = (theta: number) => parameter / Math.hypot(Math.cos(theta), parameter * Math.sin(theta));
            return { radius, pieces: arcs(radius, [0, 1, 2, 3].map((i) => (i * TAU) / 4)) };
        }

        case 'square':
            return polygon(4);

        case 'rectangle': {
            // Half the length is `parameter`, half the width is 1
            const a = parameter;

            return {
                radius: (theta) => Math.min(a / Math.abs(Math.cos(theta)), 1 / Math.abs(Math.sin(theta))),
                pieces: [side([a, -1], [a, 1]), side([a, 1], [-a, 1]), side([-a, 1], [-a, -1]), side([-a, -1], [a, -1])],
            };
        }

        case 'triangle':
            return polygon(3);

        case 'pentagon':
            return polygon(5);

        case 'hexagon':
            return polygon(6);

        case 'squircle': {
            const radius = (theta: number) => (Math.abs(Math.cos(theta)) ** parameter + Math.abs(Math.sin(theta)) ** parameter) ** (-1 / parameter);

            // The rounded corners are on the diagonals: there, at the ends of the arcs, the points are the closest together
            return { radius, pieces: arcs(radius, [0, 1, 2, 3].map((i) => Math.PI / 4 + (i * TAU) / 4 - TAU / 4)) };
        }

        case 'flower': {
            const petals = Math.round(parameter);
            const radius = (theta: number) => 1 + 0.25 * Math.cos(petals * theta);

            // An arc for every half petal: the distance goes from the tip to the dip or back
            return { radius, pieces: arcs(radius, Array.from({ length: 2 * petals }, (_, i) => (i * TAU) / (2 * petals))) };
        }
    }
}

/** The number of points of an integral along an arc: with them, the plates with a curved outline are right to better than one part in a thousand. */
export const ARC_NODES = 16;

/** The area of the pieces together: `t` goes from 0 to 1, which leaves half of `cross`. */
function areaOf(pieces: Piece[]): number {
    const { nodes, weights } = gaussLegendre(ARC_NODES);
    let area = 0;

    for (const piece of pieces) {
        for (let i = 0; i < ARC_NODES; i++) area += 0.5 * piece.cross((nodes[i] + 1) / 2) * (weights[i] / 2);
    }

    return area;
}

export function createShape(id: ShapeId, parameter = defaultParameter(id)): PlateShape {
    const raw = rawShape(id, parameter);
    const scale = 1 / Math.sqrt(areaOf(raw.pieces));

    // The same pieces, `scale` times bigger in each direction
    const pieces: Piece[] = raw.pieces.map((piece) => ({
        point: (s) => {
            const [x, y] = piece.point(s);
            return [scale * x, scale * y];
        },
        cross: (s) => scale * scale * piece.cross(s),
        curved: piece.curved,
    }));

    const radius = (theta: number) => scale * raw.radius(theta);

    // The box: the corners, and the arcs sampled finely
    let halfX = 0;
    let halfY = 0;

    for (const piece of pieces) {
        const steps = piece.curved ? 400 : 1;

        for (let i = 0; i <= steps; i++) {
            const [x, y] = piece.point(i / steps);

            halfX = Math.max(halfX, Math.abs(x));
            halfY = Math.max(halfY, Math.abs(y));
        }
    }

    return {
        id,
        parameter,
        pieces,
        radius,
        half: { x: halfX, y: halfY },

        contains: (x, y) => Math.hypot(x, y) <= radius(Math.atan2(y, x)),

        outline(count = 240) {
            const points: number[] = [];

            for (const piece of pieces) {
                // A straight side is given by its first corner: the next piece starts where it ends
                const steps = piece.curved ? Math.max(2, Math.round(count / pieces.length)) : 1;

                for (let i = 0; i < steps; i++) points.push(...piece.point(i / steps));
            }

            return Float64Array.from(points);
        },
    };
}

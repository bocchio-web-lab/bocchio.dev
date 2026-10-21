import type { Point } from '../types';

export interface TracedStroke {
    points: Point[];
    /** Average gradient strength along the stroke: how prominent the line is in the image. */
    strength: number;
}

// The eight neighbours, clockwise starting from the east (y grows downwards)
const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];

/** How many 45° steps separate two directions. */
function turn(a: number, b: number): number {
    const difference = Math.abs(a - b);
    return Math.min(difference, 8 - difference);
}

export function polylineLength(points: Point[]): number {
    let length = 0;

    for (let i = 1; i < points.length; i++) {
        length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }

    return length;
}

/** A pixel with at least this many neighbours is a junction, where several lines meet. */
const JUNCTION_DEGREE = 3;

/**
 * Splits a one-pixel-wide edge mask into strokes: chains of neighbouring pixels the pen can follow without lifting.
 *
 * Every pixel is used by one stroke, except the junctions, which strokes may share. Where lines cross, the chain
 * keeps going straight whenever it can, so a long edge is not chopped up just because a smaller one touches it.
 */
export function traceStrokes(
    mask: Uint8Array,
    width: number,
    height: number,
    magnitude?: Float32Array,
): TracedStroke[] {
    const visited = new Uint8Array(mask.length);

    // Which walk last went through each pixel, so that no stroke ever walks over itself
    const stamp = new Int32Array(mask.length);
    let walk = 0;

    // Chains are started from their loose ends, when they have any, so they are followed from one end to the other
    const degree = new Uint8Array(mask.length);
    const starts: number[] = [];

    for (let i = 0; i < mask.length; i++) {
        if (!mask[i]) continue;

        const x = i % width;
        const y = (i - x) / width;

        for (let d = 0; d < 8; d++) {
            const nx = x + DX[d];
            const ny = y + DY[d];

            if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ny * width + nx]) degree[i]++;
        }
    }

    for (let i = 0; i < mask.length; i++) if (mask[i] && degree[i] === 1) starts.push(i);
    for (let i = 0; i < mask.length; i++) if (mask[i] && degree[i] !== 1) starts.push(i);

    /** Walks away from `from`, always onto the unvisited neighbour that bends the least, and returns what it met. */
    const follow = (from: number, heading: number): number[] => {
        const chain: number[] = [];
        let current = from;

        for (;;) {
            const x = current % width;
            const y = (current - x) / width;

            let next = -1;
            let nextHeading = -1;
            let bestCost = Infinity;

            for (let d = 0; d < 8; d++) {
                const nx = x + DX[d];
                const ny = y + DY[d];

                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                const candidate = ny * width + nx;
                if (!mask[candidate] || stamp[candidate] === walk) continue;

                // Pixels already drawn are off limits, but the pen may cross a junction that another stroke went through
                if (visited[candidate] && degree[candidate] < JUNCTION_DEGREE) continue;

                // Straight on beats any turn; between equals, a side step beats a diagonal one
                const cost = (heading < 0 ? 0 : turn(heading, d)) * 2 + (d & 1);

                if (cost < bestCost) {
                    next = candidate;
                    nextHeading = d;
                    bestCost = cost;
                }
            }

            if (next < 0) return chain;

            visited[next] = 1;
            stamp[next] = walk;
            chain.push(next);
            current = next;
            heading = nextHeading;
        }
    };

    /** Offset, in pixels, going from one pixel to another. */
    const offset = (from: number, to: number) => ({
        dx: (to % width) - (from % width),
        dy: Math.floor(to / width) - Math.floor(from / width),
    });

    /** Direction of the step between two neighbouring pixels. */
    const headingBetween = (from: number, to: number): number => {
        const { dx, dy } = offset(from, to);
        return DX.findIndex((value, d) => value === dx && DY[d] === dy);
    };

    const strokes: TracedStroke[] = [];

    for (const start of starts) {
        if (visited[start]) continue;

        walk++;
        visited[start] = 1;
        stamp[start] = walk;

        const forward = follow(start, -1);
        if (forward.length === 0) continue;

        // The start may be in the middle of a line: continue on the opposite side too
        const backward = follow(start, (headingBetween(start, forward[0]) + 4) % 8);

        const pixels = [...backward.reverse(), start, ...forward];

        // A line that comes back to where it began is a loop: close it, so the contour has no gap
        const { dx, dy } = offset(pixels[0], pixels[pixels.length - 1]);
        if (pixels.length > 8 && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) pixels.push(pixels[0]);

        let strength = 0;

        const points = pixels.map((pixel) => {
            if (magnitude) strength += magnitude[pixel];

            // +0.5 puts the point at the centre of the pixel, which is where the image is drawn
            return { x: (pixel % width) + 0.5, y: Math.floor(pixel / width) + 0.5 };
        });

        strokes.push({ points, strength: magnitude ? strength / pixels.length : 1 });
    }

    return strokes;
}

/**
 * Moving average along the stroke, which irons out the one-pixel staircase left by the grid.
 * The window shrinks near the two ends so they stay exactly where they are.
 */
export function smoothStroke(points: Point[], radius: number): Point[] {
    const last = points.length - 1;

    return points.map((point, i) => {
        const reach = Math.min(radius, i, last - i);
        if (reach === 0) return point;

        let x = 0;
        let y = 0;

        for (let k = i - reach; k <= i + reach; k++) {
            x += points[k].x;
            y += points[k].y;
        }

        const size = reach * 2 + 1;
        return { x: x / size, y: y / size };
    });
}

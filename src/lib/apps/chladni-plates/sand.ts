import type { Grid } from './field';
import type { PlateShape } from './shapes';

/** The length of a hop of a grain that is shaken as hard as it takes to lift it, as a part of the size of the plate. */
const HOP = 0.012;

/** Beyond this, shaking harder does not make the hops longer: otherwise the grains jump over the thin lines they look for. */
const MOST_SHAKING = 20;

/** A grain that is shaken by less than this, as a part of what it takes to lift it, does not move at all: it is on a nodal line. */
const AT_REST = 0.05;

/** Directions in the table of the distances to the edge. */
const EDGE_DIRECTIONS = 1440;

/**
 * Grains of sand on the plate.
 *
 * Where the plate moves, the grains hop in random directions, and the harder it shakes the longer the hops (as its square
 * root). A grain that lands on a quiet place hops only a little, one that lands on a busy place is thrown away again, so the
 * grains spend their time on the quiet places. A grain on a place that hardly moves stays: in the end the sand is all
 * along the nodal lines.
 *
 * A plate that is not shaken hard enough to lift a grain anywhere does not move any of them.
 */
export class Sand {
    readonly x: Float32Array;
    readonly y: Float32Array;

    private readonly edge = new Float32Array(EDGE_DIRECTIONS + 1);

    /** The distance to the edge in the direction where it is closest: inside the circle of that radius is always the plate. */
    private inner = 0;

    // A grain that the plate does not shake stays where it is for as long as the bend does not change: there is no need to
    // look at it again. These tell which ones are at rest, and what they were at rest for.
    private readonly resting: Uint8Array;
    private restingFor = { version: -1, gain: -1 };

    /** The shaking at the place where the plate bends the most, for the bend and the strength that the grains are resting for. */
    private strongest = 0;

    constructor(
        readonly count: number,
        private shape: PlateShape,
    ) {
        this.x = new Float32Array(count);
        this.y = new Float32Array(count);
        this.resting = new Uint8Array(count);

        this.useShape(shape);
    }

    /** Learns the outline of a plate, and puts the grains on it. */
    useShape(shape: PlateShape, random: () => number = Math.random): void {
        this.shape = shape;

        for (let i = 0; i <= EDGE_DIRECTIONS; i++) this.edge[i] = shape.radius((2 * Math.PI * i) / EDGE_DIRECTIONS);

        this.inner = Math.min(...this.edge);

        this.scatter(random);
    }

    /** Spreads the grains evenly over the plate. */
    scatter(random: () => number = Math.random): void {
        const { half } = this.shape;

        for (let i = 0; i < this.count; i++) {
            let x: number;
            let y: number;

            do {
                x = (2 * random() - 1) * half.x;
                y = (2 * random() - 1) * half.y;
            } while (!this.inside(x, y));

            this.x[i] = x;
            this.y[i] = y;
        }

        this.resting.fill(0);
    }

    /** Whether the point is on the plate, from the table of the distances to the edge: quicker than asking the shape. */
    inside(x: number, y: number): boolean {
        if (x * x + y * y <= this.inner * this.inner) return true;

        let turns = Math.atan2(y, x) / (2 * Math.PI);
        if (turns < 0) turns += 1;

        const position = turns * EDGE_DIRECTIONS;
        const index = Math.min(EDGE_DIRECTIONS - 1, Math.floor(position));
        const fraction = position - index;
        const distance = this.edge[index] * (1 - fraction) + this.edge[index + 1] * fraction;

        return x * x + y * y <= distance * distance;
    }

    /**
     * Lets the plate shake the grains once.
     *
     * @param grid the way the plate is bent
     * @param gain how many times the bend of the plate, as a number, shakes a grain more than it takes to lift it
     * @returns how many grains have moved
     */
    shake(grid: Grid, gain: number, random: () => number = Math.random): number {
        const { x, y, resting } = this;

        // The bend has changed, or the strength: every grain has to be looked at again
        if (this.restingFor.version !== grid.bend.version || this.restingFor.gain !== gain) {
            resting.fill(0);
            this.restingFor = { version: grid.bend.version, gain };

            let biggest = 0;
            for (let i = 0; i < grid.bend.standing.length; i++) biggest = Math.max(biggest, Math.abs(grid.bend.standing[i]));

            this.strongest = gain * biggest;
        }

        // Nowhere is the plate lifting a grain: nothing happens
        if (this.strongest <= 1) return 0;

        let moved = 0;

        for (let i = 0; i < this.count; i++) {
            if (resting[i]) continue;

            const shaking = gain * Math.abs(grid.standingAt(x[i], y[i]));

            if (shaking < AT_REST) {
                resting[i] = 1;
                continue;
            }

            const hop = HOP * Math.sqrt(Math.min(shaking, MOST_SHAKING));
            const nextX = x[i] + hop * (2 * random() - 1);
            const nextY = y[i] + hop * (2 * random() - 1);

            // The edge of the plate holds the grains back
            if (this.inside(nextX, nextY)) {
                x[i] = nextX;
                y[i] = nextY;
                moved++;
            }
        }

        return moved;
    }
}

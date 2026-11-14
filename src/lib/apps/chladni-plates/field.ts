import type { PlateModes } from './ritz';

/**
 * How the plate is bent, over a set of points: the values of the modes there, which are worked out once, and the
 * bend itself at each moment, which is a sum of the modes that is quick to redo whenever the frequency changes.
 *
 * The plate moves as `w(x, t) = Re[ W(x) e^{i omega t} ]`, with `W` complex: its real and imaginary part are kept apart.
 *
 * Where the plate is in a single mode, `W` is a real shape times one complex number: all the points are up and down
 * together, and the nodal lines stand still. Other modes add a little that is a quarter of a period behind, which is not
 * zero on the lines. `standing` is `W` as seen from the angle where it is biggest, without that part: it is zero on the nodal lines.
 */
export class Bend {
    readonly count: number;
    private readonly modeValues: Float32Array;
    private readonly modes: number;

    /** The real and the imaginary part of `W` at each point. */
    readonly re: Float32Array;
    readonly im: Float32Array;

    /** The part of `W` that moves in step, at each point. */
    readonly standing: Float32Array;

    /** Goes up every time the bend changes, so that whoever uses it can tell whether what it knows is out of date. */
    version = 0;

    constructor(plate: PlateModes, points: Float64Array) {
        this.count = points.length / 2;
        this.modes = plate.count;
        this.modeValues = plate.sample(points);
        this.re = new Float32Array(this.count);
        this.im = new Float32Array(this.count);
        this.standing = new Float32Array(this.count);
    }

    /** Sets `W` to the sum of the modes, each as large as `amplitudes` says (real and imaginary part, one after the other). */
    combine(amplitudes: Float64Array): void {
        const { modes, modeValues } = this;

        // The angle at which `W` is the biggest. The modes are orthonormal, so the sums over the plate of the squares
        // of the real and imaginary part, and of their product, are the same sums over the modes
        let real = 0;
        let imaginary = 0;
        let product = 0;

        for (let k = 0; k < modes; k++) {
            real += amplitudes[2 * k] ** 2;
            imaginary += amplitudes[2 * k + 1] ** 2;
            product += amplitudes[2 * k] * amplitudes[2 * k + 1];
        }

        const angle = 0.5 * Math.atan2(2 * product, real - imaginary);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const inStep = new Float64Array(modes);
        for (let k = 0; k < modes; k++) inStep[k] = amplitudes[2 * k] * cos + amplitudes[2 * k + 1] * sin;

        for (let p = 0; p < this.count; p++) {
            let re = 0;
            let im = 0;
            let standing = 0;

            for (let k = 0; k < modes; k++) {
                const value = modeValues[p * modes + k];

                re += amplitudes[2 * k] * value;
                im += amplitudes[2 * k + 1] * value;
                standing += inStep[k] * value;
            }

            this.re[p] = re;
            this.im[p] = im;
            this.standing[p] = standing;
        }

        this.version++;
    }
}

/**
 * The bend over a square grid that covers the plate, which is what the sand reads: how hard the plate
 * shakes at any place, between the points of the grid. Only the points near the plate are worked out.
 */
export class Grid {
    /** Number of cells along each side. */
    readonly size: number;
    /** Half the side of the square that the grid covers. */
    readonly half: number;
    readonly bend: Bend;

    constructor(
        plate: PlateModes,
        size: number,
        margin = 1.04,
    ) {
        this.size = size;
        this.half = Math.max(plate.shape.half.x, plate.shape.half.y) * margin;

        const points: number[] = [];
        const cell = (2 * this.half) / size;

        // A few cells around the outline are included, so that what is read near the edge is right too
        for (let j = 0; j < size; j++) {
            for (let i = 0; i < size; i++) {
                const x = this.coordinate(i);
                const y = this.coordinate(j);
                const near = Math.hypot(x, y) <= plate.shape.radius(Math.atan2(y, x)) + 2.5 * cell;

                points.push(near ? x : 0, near ? y : 0);
            }
        }

        this.bend = new Bend(plate, Float64Array.from(points));
    }

    /** The coordinate of the centre of the cell with the given index. */
    coordinate(index: number): number {
        return -this.half + ((index + 0.5) * 2 * this.half) / this.size;
    }

    // Where (x, y) is in the grid: the cell to the lower left of it, and how far across and up the cell it is
    private cell = 0;
    private across = 0;
    private up = 0;

    private locate(x: number, y: number): void {
        const { size } = this;

        // Position in cells, with the first cell centre at 0
        const u = ((x + this.half) / (2 * this.half)) * size - 0.5;
        const v = ((y + this.half) / (2 * this.half)) * size - 0.5;
        const i = Math.max(0, Math.min(size - 2, Math.floor(u)));
        const j = Math.max(0, Math.min(size - 2, Math.floor(v)));

        this.cell = j * size + i;
        this.across = Math.max(0, Math.min(1, u - i));
        this.up = Math.max(0, Math.min(1, v - j));
    }

    /** The real and the imaginary part at (x, y), by linear interpolation: written into `out`. */
    read(x: number, y: number, out: Float64Array): void {
        this.locate(x, y);

        const { bend, size, cell: a, across: fu, up: fv } = this;
        const b = a + 1;
        const c = a + size;
        const d = c + 1;

        out[0] = (1 - fv) * ((1 - fu) * bend.re[a] + fu * bend.re[b]) + fv * ((1 - fu) * bend.re[c] + fu * bend.re[d]);
        out[1] = (1 - fv) * ((1 - fu) * bend.im[a] + fu * bend.im[b]) + fv * ((1 - fu) * bend.im[c] + fu * bend.im[d]);
    }

    /** The part that moves in step at (x, y), by linear interpolation. */
    standingAt(x: number, y: number): number {
        this.locate(x, y);

        const { bend, size, cell: a, across: fu, up: fv } = this;
        const s = bend.standing;

        return (1 - fv) * ((1 - fu) * s[a] + fu * s[a + 1]) + fv * ((1 - fu) * s[a + size] + fu * s[a + size + 1]);
    }
}

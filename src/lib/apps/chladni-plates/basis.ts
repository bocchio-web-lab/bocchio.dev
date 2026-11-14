/**
 * The functions that the modes of a plate are built from: products of Legendre polynomials, `P_i(x) P_j(y)`, of every
 * degree `i + j` up to a limit, with the coordinates scaled so that the box around the plate goes from -1 to 1.
 *
 * Legendre polynomials, unlike plain powers of `x`, stay well behaved at high degrees.
 */
export class PolynomialBasis {
    /** How many functions there are. */
    readonly size: number;
    /** The degree in x and the degree in y of every function. */
    readonly degrees: [number, number][] = [];

    // Values and derivatives of the polynomials in x and in y at the last point
    private readonly px: Float64Array;
    private readonly dpx: Float64Array;
    private readonly ddpx: Float64Array;
    private readonly py: Float64Array;
    private readonly dpy: Float64Array;
    private readonly ddpy: Float64Array;

    constructor(
        readonly maxDegree: number,
        /** Half the width and half the height of the box around the plate. */
        private readonly half: { x: number; y: number },
    ) {
        for (let i = 0; i <= maxDegree; i++) {
            for (let j = 0; i + j <= maxDegree; j++) this.degrees.push([i, j]);
        }

        this.size = this.degrees.length;

        const n = maxDegree + 1;
        this.px = new Float64Array(n);
        this.dpx = new Float64Array(n);
        this.ddpx = new Float64Array(n);
        this.py = new Float64Array(n);
        this.dpy = new Float64Array(n);
        this.ddpy = new Float64Array(n);
    }

    /** Writes the value of every function at the point into `out`. */
    values(x: number, y: number, out: Float64Array): void {
        this.legendre(x / this.half.x, this.px, this.dpx, this.ddpx);
        this.legendre(y / this.half.y, this.py, this.dpy, this.ddpy);

        for (let b = 0; b < this.size; b++) {
            const [i, j] = this.degrees[b];
            out[b] = this.px[i] * this.py[j];
        }
    }

    /** Writes the second derivatives of every function at the point: `xx`, `yy` and `xy`. */
    curvatures(x: number, y: number, xx: Float64Array, yy: Float64Array, xy: Float64Array): void {
        this.legendre(x / this.half.x, this.px, this.dpx, this.ddpx);
        this.legendre(y / this.half.y, this.py, this.dpy, this.ddpy);

        const { x: hx, y: hy } = this.half;

        for (let b = 0; b < this.size; b++) {
            const [i, j] = this.degrees[b];

            xx[b] = (this.ddpx[i] * this.py[j]) / (hx * hx);
            yy[b] = (this.px[i] * this.ddpy[j]) / (hy * hy);
            xy[b] = (this.dpx[i] * this.dpy[j]) / (hx * hy);
        }
    }

    /** The Legendre polynomials up to the maximum degree, and their first and second derivatives, at `t`. */
    private legendre(t: number, value: Float64Array, first: Float64Array, second: Float64Array): void {
        value[0] = 1;
        first[0] = 0;
        second[0] = 0;

        if (this.maxDegree >= 1) {
            value[1] = t;
            first[1] = 1;
            second[1] = 0;
        }

        for (let n = 1; n < this.maxDegree; n++) {
            value[n + 1] = ((2 * n + 1) * t * value[n] - n * value[n - 1]) / (n + 1);
            first[n + 1] = first[n - 1] + (2 * n + 1) * value[n];
            second[n + 1] = second[n - 1] + (2 * n + 1) * first[n];
        }
    }
}

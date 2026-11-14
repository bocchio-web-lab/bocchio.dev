import { PolynomialBasis } from './basis';
import { gaussLegendre, symmetricEigen } from './linalg';
import { ARC_NODES, type PlateShape } from './shapes';

/** Poisson's ratio of the plate: a typical metal. */
export const POISSON = 0.3;

/** The degree of the polynomials that the modes are made of: 14 gives well over thirty modes that are right to 1%. */
const DEGREE = 14;

/** How many modes are kept. */
const MODES = 36;

/**
 * The natural ways in which a plate with free edges can vibrate.
 *
 * A plate bends like `w(x, y) cos(ω t)`, and the shapes `w` that can do it for ever, without being pushed, are the
 * modes. Each one has its own frequency, and its own nodal lines: the lines where `w` is zero and the plate stands still.
 * The sand of a Chladni figure gathers on them.
 */
export interface PlateModes {
    readonly shape: PlateShape;
    readonly count: number;
    /**
     * The frequency of every mode, the lowest first. It is `Ω = ω L² sqrt(ρh / D)`, which does not depend on the material,
     * the thickness or the size of the plate (`L²` is its area): it only depends on the shape.
     */
    readonly omega: Float64Array;
    /** The value of every mode at every point of the plate: mode `k` at point `p` is `result[p * count + k]`. */
    sample(points: Float64Array): Float32Array;
}

export interface Quadrature {
    x: Float64Array;
    y: Float64Array;
    /** What each point counts for in an integral over the plate. */
    weight: Float64Array;
}

/**
 * Points and weights to integrate over the plate, for functions that are polynomials of the given degree in x and y.
 *
 * The plate is cut in pieces, one for every side or arc of the outline, and the Gauss-Legendre rule is used along the
 * outline and from the centre to it. Along a straight side the points of the plate are a linear function of
 * the two coordinates, so a polynomial stays a polynomial and a few points give the exact integral: there is no
 * error at all for the plates with straight sides.
 */
export function quadrature(shape: PlateShape, degree: number): Quadrature {
    const radial = gaussLegendre(degree + 1);

    const x: number[] = [];
    const y: number[] = [];
    const weight: number[] = [];

    for (const piece of shape.pieces) {
        const along = gaussLegendre(piece.curved ? ARC_NODES : degree + 1);

        for (let j = 0; j < along.nodes.length; j++) {
            const s = (along.nodes[j] + 1) / 2;
            const [cx, cy] = piece.point(s);
            const cross = piece.cross(s);

            for (let i = 0; i < radial.nodes.length; i++) {
                // The point is a fraction `t` of the way to the outline, and an area element is t cross dt ds
                const t = (radial.nodes[i] + 1) / 2;

                x.push(t * cx);
                y.push(t * cy);
                weight.push((along.weights[j] / 2) * (radial.weights[i] / 2) * t * cross);
            }
        }
    }

    return { x: Float64Array.from(x), y: Float64Array.from(y), weight: Float64Array.from(weight) };
}

interface Options {
    /** The degree of the polynomials. */
    degree?: number;
    /** How many modes to find. */
    modes?: number;
    poisson?: number;
}

/**
 * Finds the modes of a plate of the given shape with the Rayleigh-Ritz method.
 *
 * The idea: of all the shapes `w` the plate can take, the modes are those that make the ratio of bending energy to
 * kinetic energy stationary. If `w` is restricted to the combinations of a few well chosen functions (here the
 * polynomials of the basis), looking for the stationary points becomes a matrix eigenvalue problem. A free edge needs no
 * condition to be imposed on `w`, it comes out of the energy by itself, which is why the same few lines work for any outline.
 */
export function analyzePlate(shape: PlateShape, options: Options = {}): PlateModes {
    const degree = options.degree ?? DEGREE;
    const wanted = options.modes ?? MODES;
    const nu = options.poisson ?? POISSON;

    const basis = new PolynomialBasis(degree, shape.half);
    const { x, y, weight } = quadrature(shape, degree);
    const points = weight.length;
    const size = basis.size;

    // The functions at the integration points, one after the other, and their curvatures. Everything that comes
    // into the integrals is multiplied by the square root of the weights already, so that an integral is a scalar product.
    const roots = weight.map(Math.sqrt);
    const value = new Float64Array(size * points);
    const laplacian = new Float64Array(size * points);
    const curvatureX = new Float64Array(size * points);
    const curvatureY = new Float64Array(size * points);
    const twist = new Float64Array(size * points);

    const at = new Float64Array(size);
    const xx = new Float64Array(size);
    const yy = new Float64Array(size);
    const xy = new Float64Array(size);

    // The bending energy of a plate is the integral of  nu (w_xx + w_yy)^2 + (1 - nu) (w_xx^2 + w_yy^2 + 2 w_xy^2)
    // (the same as (w_xx + w_yy)^2 - 2 (1 - nu) (w_xx w_yy - w_xy^2), written as a sum of squares)
    const factors = { laplacian: Math.sqrt(nu), curvature: Math.sqrt(1 - nu), twist: Math.sqrt(2 * (1 - nu)) };

    for (let p = 0; p < points; p++) {
        basis.values(x[p], y[p], at);
        basis.curvatures(x[p], y[p], xx, yy, xy);

        for (let b = 0; b < size; b++) {
            const i = b * points + p;

            value[i] = at[b] * roots[p];
            laplacian[i] = (xx[b] + yy[b]) * roots[p] * factors.laplacian;
            curvatureX[i] = xx[b] * roots[p] * factors.curvature;
            curvatureY[i] = yy[b] * roots[p] * factors.curvature;
            twist[i] = xy[b] * roots[p] * factors.twist;
        }
    }

    // Combinations of the functions that are perpendicular to one another and have a mean square of 1 on the plate,
    // so that the mass matrix is the identity and what is left is an ordinary eigenvalue problem
    const { combinations, count: kept } = orthonormalize(value, size, points);

    // The bending energy between two of them is a scalar product too: that of the vectors that hold the four
    // curvatures of each one, one after the other
    const length = 4 * points;
    const vectors = new Float64Array(kept * length);
    const parts = [laplacian, curvatureX, curvatureY, twist];

    for (let m = 0; m < kept; m++) {
        for (let b = 0; b < size; b++) {
            const c = combinations[m * size + b];
            if (c === 0) continue;

            for (let part = 0; part < 4; part++) {
                const into = m * length + part * points;
                const from = b * points;

                for (let p = 0; p < points; p++) vectors[into + p] += c * parts[part][from + p];
            }
        }
    }

    const stiffness = new Float64Array(kept * kept);

    for (let m = 0; m < kept; m++) {
        for (let n = m; n < kept; n++) {
            let sum = 0;

            for (let i = 0; i < length; i++) sum += vectors[m * length + i] * vectors[n * length + i];

            stiffness[m * kept + n] = sum;
            stiffness[n * kept + m] = sum;
        }
    }

    const { values, vectors: eigenvectors } = symmetricEigen(stiffness, kept);

    // The first three are the plate moving as a whole (up, and tilting two ways), which bend nothing: they are no modes
    const first = 3;
    const count = Math.min(wanted, kept - first);

    const omega = new Float64Array(count);
    const coefficients = new Float64Array(size * count);

    for (let k = 0; k < count; k++) {
        omega[k] = Math.sqrt(Math.max(values[first + k], 0));

        // Mode k in terms of the original functions
        for (let m = 0; m < kept; m++) {
            const weightOfM = eigenvectors[m * kept + first + k];

            for (let b = 0; b < size; b++) coefficients[b * count + k] += weightOfM * combinations[m * size + b];
        }
    }

    return {
        shape,
        count,
        omega,

        sample(pointList: Float64Array): Float32Array {
            const total = pointList.length / 2;
            const result = new Float32Array(total * count);
            const sum = new Float64Array(count);

            for (let p = 0; p < total; p++) {
                basis.values(pointList[2 * p], pointList[2 * p + 1], at);
                sum.fill(0);

                for (let b = 0; b < size; b++) {
                    const f = at[b];
                    for (let k = 0; k < count; k++) sum[k] += f * coefficients[b * count + k];
                }

                for (let k = 0; k < count; k++) result[p * count + k] = sum[k];
            }

            return result;
        },
    };
}

/**
 * Orthonormalises the functions (the rows of `samples`, each one the values at the integration points, already
 * multiplied by the square root of the weights) with the Gram-Schmidt method, which is done twice because once is not enough
 * when the functions are nearly dependent.
 *
 * Returns the new functions as combinations of the old ones: `combinations[m * size + b]` is how much of the old function
 * `b` there is in the new function `m`. A function that is already made of the previous ones is left out.
 */
function orthonormalize(samples: Float64Array, size: number, points: number): { combinations: Float64Array; count: number } {
    const done = new Float64Array(size * points);
    const combinations = new Float64Array(size * size);
    const work = new Float64Array(points);
    let count = 0;

    for (let b = 0; b < size; b++) {
        work.set(samples.subarray(b * points, (b + 1) * points));

        let before = 0;
        for (let p = 0; p < points; p++) before += work[p] * work[p];

        const mix = combinations.subarray(count * size, (count + 1) * size);
        mix[b] = 1;

        for (let pass = 0; pass < 2; pass++) {
            for (let m = 0; m < count; m++) {
                let dot = 0;
                for (let p = 0; p < points; p++) dot += done[m * points + p] * work[p];

                for (let p = 0; p < points; p++) work[p] -= dot * done[m * points + p];
                for (let k = 0; k < size; k++) mix[k] -= dot * combinations[m * size + k];
            }
        }

        let after = 0;
        for (let p = 0; p < points; p++) after += work[p] * work[p];

        const norm = Math.sqrt(after);

        // Nothing new is left of this function
        if (norm < 1e-9 * Math.sqrt(before)) {
            mix.fill(0);
            continue;
        }

        for (let p = 0; p < points; p++) done[count * points + p] = work[p] / norm;
        for (let k = 0; k < size; k++) mix[k] /= norm;

        count++;
    }

    return { combinations, count };
}

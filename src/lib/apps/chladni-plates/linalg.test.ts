import { describe, expect, it } from 'vitest';
import { gaussLegendre, symmetricEigen } from './linalg';

/** The same numbers every time: a small linear congruential generator. */
function random(seed: number) {
    let state = seed;
    return () => {
        state = (state * 16807) % 2147483647;
        return state / 2147483647 - 0.5;
    };
}

function randomSymmetric(n: number, seed: number): Float64Array {
    const next = random(seed);
    const matrix = new Float64Array(n * n);

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            const value = next();
            matrix[i * n + j] = value;
            matrix[j * n + i] = value;
        }
    }

    return matrix;
}

describe('the Gauss-Legendre rule', () => {
    it('has the nodes of the textbook for 2 and 3 points', () => {
        const two = gaussLegendre(2);
        expect(Array.from(two.nodes).sort((a, b) => a - b)).toEqual([-1 / Math.sqrt(3), 1 / Math.sqrt(3)].map((x) => expect.closeTo(x, 12)));
        expect(Array.from(two.weights)).toEqual([expect.closeTo(1, 12), expect.closeTo(1, 12)]);

        const three = gaussLegendre(3);
        const sorted = Array.from(three.nodes).sort((a, b) => a - b);
        expect(sorted[0]).toBeCloseTo(-Math.sqrt(0.6), 12);
        expect(sorted[1]).toBeCloseTo(0, 12);
        expect(sorted[2]).toBeCloseTo(Math.sqrt(0.6), 12);
        expect(Math.max(...three.weights)).toBeCloseTo(8 / 9, 12);
    });

    it('has weights that add up to the length of the interval', () => {
        for (const n of [1, 4, 9, 16, 33]) {
            const { weights } = gaussLegendre(n);
            expect(weights.reduce((sum, w) => sum + w, 0)).toBeCloseTo(2, 12);
        }
    });

    it('integrates polynomials of degree up to 2n - 1 exactly', () => {
        const n = 6;
        const { nodes, weights } = gaussLegendre(n);

        for (let degree = 0; degree <= 2 * n - 1; degree++) {
            let sum = 0;
            for (let i = 0; i < n; i++) sum += weights[i] * nodes[i] ** degree;

            const exact = degree % 2 === 1 ? 0 : 2 / (degree + 1);
            expect(sum).toBeCloseTo(exact, 12);
        }
    });

    it('integrates a smooth function with many digits', () => {
        const { nodes, weights } = gaussLegendre(12);
        let sum = 0;
        for (let i = 0; i < nodes.length; i++) sum += weights[i] * Math.cos(nodes[i]);

        expect(sum).toBeCloseTo(2 * Math.sin(1), 12);
    });
});

describe('the eigenvalues of a symmetric matrix', () => {
    it('are those of a diagonal matrix, in order', () => {
        const { values } = symmetricEigen(Float64Array.from([3, 0, 0, 0, 1, 0, 0, 0, 2]), 3);

        expect(Array.from(values)).toEqual([1, 2, 3]);
    });

    it('are known for the matrix that discretises a string', () => {
        // 2 on the diagonal and -1 next to it: the eigenvalues are 2 - 2 cos(k pi / (n + 1))
        const n = 25;
        const matrix = new Float64Array(n * n);

        for (let i = 0; i < n; i++) {
            matrix[i * n + i] = 2;
            if (i + 1 < n) {
                matrix[i * n + i + 1] = -1;
                matrix[(i + 1) * n + i] = -1;
            }
        }

        const { values } = symmetricEigen(matrix, n);

        for (let k = 1; k <= n; k++) expect(values[k - 1]).toBeCloseTo(2 - 2 * Math.cos((k * Math.PI) / (n + 1)), 12);
    });

    it('come with vectors that really are eigenvectors', () => {
        for (const n of [1, 2, 3, 8, 30]) {
            const matrix = randomSymmetric(n, 11 + n);
            const { values, vectors } = symmetricEigen(matrix, n);

            for (let c = 0; c < n; c++) {
                for (let r = 0; r < n; r++) {
                    let product = 0;
                    for (let k = 0; k < n; k++) product += matrix[r * n + k] * vectors[k * n + c];

                    expect(product).toBeCloseTo(values[c] * vectors[r * n + c], 10);
                }
            }
        }
    });

    it('come with vectors of length 1 that are perpendicular to one another', () => {
        const n = 20;
        const { vectors } = symmetricEigen(randomSymmetric(n, 5), n);

        for (let a = 0; a < n; a++) {
            for (let b = 0; b < n; b++) {
                let dot = 0;
                for (let k = 0; k < n; k++) dot += vectors[k * n + a] * vectors[k * n + b];

                expect(dot).toBeCloseTo(a === b ? 1 : 0, 10);
            }
        }
    });

    it('add up to the trace', () => {
        const n = 15;
        const matrix = randomSymmetric(n, 3);
        const { values } = symmetricEigen(matrix, n);

        let trace = 0;
        for (let i = 0; i < n; i++) trace += matrix[i * n + i];

        expect(values.reduce((sum, v) => sum + v, 0)).toBeCloseTo(trace, 10);
    });

    it('are in ascending order', () => {
        const { values } = symmetricEigen(randomSymmetric(18, 9), 18);

        for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    });

    it('can be repeated: the identity has only ones', () => {
        const n = 6;
        const identity = new Float64Array(n * n);
        for (let i = 0; i < n; i++) identity[i * n + i] = 1;

        expect(Array.from(symmetricEigen(identity, n).values)).toEqual([1, 1, 1, 1, 1, 1]);
    });

    it('does not change the matrix it is given', () => {
        const matrix = randomSymmetric(5, 2);
        const copy = Float64Array.from(matrix);

        symmetricEigen(matrix, 5);

        expect(matrix).toEqual(copy);
    });
});

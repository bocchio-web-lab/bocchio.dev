/** Nodes and weights of the Gauss-Legendre rule with `n` points, which integrates polynomials up to degree 2n - 1 exactly on [-1, 1]. */
export function gaussLegendre(n: number): { nodes: Float64Array; weights: Float64Array } {
    const nodes = new Float64Array(n);
    const weights = new Float64Array(n);

    for (let i = 0; i < n; i++) {
        // The nodes are the roots of the Legendre polynomial of degree n: Newton's method from a good first guess
        let x = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
        let slope = 1;

        for (let iteration = 0; iteration < 100; iteration++) {
            let previous = 1;
            let current = x;

            for (let k = 2; k <= n; k++) {
                const next = ((2 * k - 1) * x * current - (k - 1) * previous) / k;
                previous = current;
                current = next;
            }

            slope = (n * (x * current - previous)) / (x * x - 1);
            const step = current / slope;
            x -= step;

            if (Math.abs(step) < 1e-15) break;
        }

        nodes[i] = x;
        weights[i] = 2 / ((1 - x * x) * slope * slope);
    }

    return { nodes, weights };
}

/**
 * The eigenvalues, in ascending order, and the eigenvectors of a symmetric matrix of size n (stored by rows).
 * The vectors come as the columns of an n × n matrix, also stored by rows, and have length 1.
 *
 * It reduces the matrix to a tridiagonal one with Householder reflections and then finds its eigenvalues with the
 * implicit QL method: the classic EISPACK routines `tred2` and `tql2`.
 */
export function symmetricEigen(matrix: Float64Array, n: number): { values: Float64Array; vectors: Float64Array } {
    const v = Float64Array.from(matrix);
    const d = new Float64Array(n);
    const e = new Float64Array(n);

    // Householder reduction to tridiagonal form: the diagonal ends up in d, the sub-diagonal in e
    for (let j = 0; j < n; j++) d[j] = v[(n - 1) * n + j];

    for (let i = n - 1; i > 0; i--) {
        let scale = 0;
        let h = 0;

        for (let k = 0; k < i; k++) scale += Math.abs(d[k]);

        if (scale === 0) {
            e[i] = d[i - 1];

            for (let j = 0; j < i; j++) {
                d[j] = v[(i - 1) * n + j];
                v[i * n + j] = 0;
                v[j * n + i] = 0;
            }
        } else {
            for (let k = 0; k < i; k++) {
                d[k] /= scale;
                h += d[k] * d[k];
            }

            let f = d[i - 1];
            let g = Math.sqrt(h);
            if (f > 0) g = -g;

            e[i] = scale * g;
            h -= f * g;
            d[i - 1] = f - g;

            for (let j = 0; j < i; j++) e[j] = 0;

            for (let j = 0; j < i; j++) {
                f = d[j];
                v[j * n + i] = f;
                g = e[j] + v[j * n + j] * f;

                for (let k = j + 1; k <= i - 1; k++) {
                    g += v[k * n + j] * d[k];
                    e[k] += v[k * n + j] * f;
                }

                e[j] = g;
            }

            f = 0;

            for (let j = 0; j < i; j++) {
                e[j] /= h;
                f += e[j] * d[j];
            }

            const hh = f / (h + h);
            for (let j = 0; j < i; j++) e[j] -= hh * d[j];

            for (let j = 0; j < i; j++) {
                f = d[j];
                g = e[j];

                for (let k = j; k <= i - 1; k++) v[k * n + j] -= f * e[k] + g * d[k];

                d[j] = v[(i - 1) * n + j];
                v[i * n + j] = 0;
            }
        }

        d[i] = h;
    }

    // The reflections, put together, are the matrix that takes the tridiagonal problem back to the original one
    for (let i = 0; i < n - 1; i++) {
        v[(n - 1) * n + i] = v[i * n + i];
        v[i * n + i] = 1;

        const h = d[i + 1];

        if (h !== 0) {
            for (let k = 0; k <= i; k++) d[k] = v[k * n + i + 1] / h;

            for (let j = 0; j <= i; j++) {
                let g = 0;

                for (let k = 0; k <= i; k++) g += v[k * n + i + 1] * v[k * n + j];
                for (let k = 0; k <= i; k++) v[k * n + j] -= g * d[k];
            }
        }

        for (let k = 0; k <= i; k++) v[k * n + i + 1] = 0;
    }

    for (let j = 0; j < n; j++) {
        d[j] = v[(n - 1) * n + j];
        v[(n - 1) * n + j] = 0;
    }

    v[(n - 1) * n + n - 1] = 1;
    e[0] = 0;

    // From here on the eigenvectors are the rows of `v`, so that the rotations below walk along the memory
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const t = v[i * n + j];
            v[i * n + j] = v[j * n + i];
            v[j * n + i] = t;
        }
    }

    // Implicit QL iteration on the tridiagonal matrix
    for (let i = 1; i < n; i++) e[i - 1] = e[i];
    e[n - 1] = 0;

    let shift = 0;
    let tst1 = 0;
    const eps = 2 ** -52;

    for (let l = 0; l < n; l++) {
        tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));

        let m = l;
        while (m < n && Math.abs(e[m]) > eps * tst1) m++;

        // When m is l, d[l] is an eigenvalue already; otherwise it takes a few iterations
        if (m > l) {
            do {
                let g = d[l];
                let p = (d[l + 1] - g) / (2 * e[l]);
                let r = Math.hypot(p, 1);
                if (p < 0) r = -r;

                d[l] = e[l] / (p + r);
                d[l + 1] = e[l] * (p + r);

                const dl1 = d[l + 1];
                let h = g - d[l];

                for (let i = l + 2; i < n; i++) d[i] -= h;
                shift += h;

                p = d[m];

                let c = 1;
                let c2 = c;
                let c3 = c;
                const el1 = e[l + 1];
                let s = 0;
                let s2 = 0;

                for (let i = m - 1; i >= l; i--) {
                    c3 = c2;
                    c2 = c;
                    s2 = s;
                    g = c * e[i];
                    h = c * p;
                    r = Math.hypot(p, e[i]);
                    e[i + 1] = s * r;
                    s = e[i] / r;
                    c = p / r;
                    p = c * d[i] - s * g;
                    d[i + 1] = h + s * (c * g + s * d[i]);

                    const low = i * n;
                    const high = (i + 1) * n;

                    for (let k = 0; k < n; k++) {
                        h = v[high + k];
                        v[high + k] = s * v[low + k] + c * h;
                        v[low + k] = c * v[low + k] - s * h;
                    }
                }

                p = (-s * s2 * c3 * el1 * e[l]) / dl1;
                e[l] = s * p;
                d[l] = c * p;
            } while (Math.abs(e[l]) > eps * tst1);
        }

        d[l] += shift;
        e[l] = 0;
    }

    // Put them in ascending order
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => d[a] - d[b]);
    const values = new Float64Array(n);
    const vectors = new Float64Array(n * n);

    order.forEach((source, target) => {
        values[target] = d[source];

        for (let k = 0; k < n; k++) vectors[k * n + target] = v[source * n + k];
    });

    return { values, vectors };
}

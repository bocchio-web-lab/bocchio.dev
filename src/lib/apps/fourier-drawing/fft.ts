export function isPowerOfTwo(n: number): boolean {
    return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

export function nextPowerOfTwo(n: number): number {
    let size = 1;
    while (size < n) size <<= 1;
    return size;
}

// Twiddle factors depend only on the transform size, so they are computed once per size.
const twiddleCache = new Map<number, { cos: Float64Array; sin: Float64Array }>();

function getTwiddles(n: number) {
    let table = twiddleCache.get(n);

    if (!table) {
        const cos = new Float64Array(n / 2);
        const sin = new Float64Array(n / 2);

        for (let k = 0; k < n / 2; k++) {
            const angle = (2 * Math.PI * k) / n;
            cos[k] = Math.cos(angle);
            sin[k] = Math.sin(angle);
        }

        table = { cos, sin };
        twiddleCache.set(n, table);
    }

    return table;
}

/**
 * In-place iterative radix-2 Cooley-Tukey FFT of the complex signal `re + i·im`.
 * The length must be a power of two. Neither direction is scaled:
 *
 * - forward: `X[k] = Σ x[n]·e^(-2πi·kn/N)`
 * - inverse: `x[n] = Σ X[k]·e^(+2πi·kn/N)`
 */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
    const n = re.length;

    if (im.length !== n) throw new RangeError('The real and imaginary parts must have the same length');
    if (!isPowerOfTwo(n)) throw new RangeError(`The FFT size must be a power of two (got ${n})`);

    // Bit-reversal permutation
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;

        if (i < j) {
            const tr = re[i];
            const ti = im[i];
            re[i] = re[j];
            im[i] = im[j];
            re[j] = tr;
            im[j] = ti;
        }
    }

    const { cos, sin } = getTwiddles(n);
    const sign = inverse ? 1 : -1;

    // Butterflies
    for (let size = 2; size <= n; size <<= 1) {
        const half = size >> 1;
        const step = n / size;

        for (let start = 0; start < n; start += size) {
            for (let k = 0, t = 0; k < half; k++, t += step) {
                const wr = cos[t];
                const wi = sign * sin[t];

                const a = start + k;
                const b = a + half;

                const xr = re[b] * wr - im[b] * wi;
                const xi = re[b] * wi + im[b] * wr;

                re[b] = re[a] - xr;
                im[b] = im[a] - xi;
                re[a] += xr;
                im[a] += xi;
            }
        }
    }
}

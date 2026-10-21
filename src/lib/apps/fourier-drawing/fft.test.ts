import { describe, expect, it } from 'vitest';
import { fft, isPowerOfTwo, nextPowerOfTwo } from './fft';

/** Textbook O(N²) transform, used as the reference. */
function naiveDft(re: number[], im: number[], inverse = false) {
    const n = re.length;
    const sign = inverse ? 1 : -1;
    const outRe: number[] = [];
    const outIm: number[] = [];

    for (let k = 0; k < n; k++) {
        let sr = 0;
        let si = 0;

        for (let j = 0; j < n; j++) {
            const angle = (sign * 2 * Math.PI * k * j) / n;
            sr += re[j] * Math.cos(angle) - im[j] * Math.sin(angle);
            si += re[j] * Math.sin(angle) + im[j] * Math.cos(angle);
        }

        outRe.push(sr);
        outIm.push(si);
    }

    return { re: outRe, im: outIm };
}

function randomSignal(n: number) {
    // Small deterministic generator so failures are reproducible
    let seed = 12345;
    const next = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296 - 0.5;
    };

    return {
        re: Array.from({ length: n }, next),
        im: Array.from({ length: n }, next),
    };
}

describe('fft', () => {
    it('matches the naive DFT in both directions', () => {
        const signal = randomSignal(64);

        for (const inverse of [false, true]) {
            const re = Float64Array.from(signal.re);
            const im = Float64Array.from(signal.im);
            const expected = naiveDft(signal.re, signal.im, inverse);

            fft(re, im, inverse);

            for (let i = 0; i < 64; i++) {
                expect(re[i]).toBeCloseTo(expected.re[i], 9);
                expect(im[i]).toBeCloseTo(expected.im[i], 9);
            }
        }
    });

    it('gets the original signal back after forward + inverse (scaled by N)', () => {
        const signal = randomSignal(1024);
        const re = Float64Array.from(signal.re);
        const im = Float64Array.from(signal.im);

        fft(re, im);
        fft(re, im, true);

        for (let i = 0; i < 1024; i++) {
            expect(re[i] / 1024).toBeCloseTo(signal.re[i], 10);
            expect(im[i] / 1024).toBeCloseTo(signal.im[i], 10);
        }
    });

    it('turns a pure rotation into a single spike', () => {
        const n = 16;
        const re = new Float64Array(n);
        const im = new Float64Array(n);

        // e^(2πi·3·t): a circle turning three times
        for (let i = 0; i < n; i++) {
            re[i] = Math.cos((2 * Math.PI * 3 * i) / n);
            im[i] = Math.sin((2 * Math.PI * 3 * i) / n);
        }

        fft(re, im);

        for (let k = 0; k < n; k++) {
            expect(re[k]).toBeCloseTo(k === 3 ? n : 0, 9);
            expect(im[k]).toBeCloseTo(0, 9);
        }
    });

    it('rejects sizes that are not a power of two', () => {
        expect(() => fft(new Float64Array(12), new Float64Array(12))).toThrow(RangeError);
        expect(() => fft(new Float64Array(8), new Float64Array(4))).toThrow(RangeError);
    });
});

describe('power of two helpers', () => {
    it('recognises powers of two', () => {
        expect([1, 2, 4, 1024].every(isPowerOfTwo)).toBe(true);
        expect([0, 3, 12, -4, 1.5].some(isPowerOfTwo)).toBe(false);
    });

    it('rounds up to the next power of two', () => {
        expect(nextPowerOfTwo(1)).toBe(1);
        expect(nextPowerOfTwo(5)).toBe(8);
        expect(nextPowerOfTwo(1024)).toBe(1024);
        expect(nextPowerOfTwo(1025)).toBe(2048);
    });
});

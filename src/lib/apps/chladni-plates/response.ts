import type { PlateModes } from './ritz';

/**
 * How hard the plate shakes the sand where it bends the most, in units of the strength it takes to lift a grain, at the
 * resonance of a mode that the shaker reaches well (a force in the middle of the square plate is like this), at power 1.
 * The sand moves where the shaking is above 1, which is where the acceleration of the plate beats gravity.
 */
const SHAKING_AT_A_GOOD_PEAK = 0.9;

/** The quality factor that the shaking at a peak is measured against. */
const REFERENCE_QUALITY = 50;

/**
 * How strongly a point force pushes each mode: the value of the mode where the force acts. A force on a nodal line
 * of a mode does not excite it at all, which is why the place of the shaker matters.
 */
export function couplings(modes: PlateModes, x: number, y: number): Float64Array {
    return Float64Array.from(modes.sample(Float64Array.from([x, y])));
}

/**
 * How far each mode is moved, when the point force pushes at the frequency `omega` (a dimensionless one, like the
 * frequencies of the modes). The result has the real and the imaginary part of every mode, one after the other: the
 * imaginary part is the delay of the plate behind the force, which is about a quarter of a period at resonance.
 *
 * Each mode is a mass on a spring, with a damping that gives it a quality factor `quality`: its amplitude is
 * `coupling / (omega_k^2 - omega^2 + i omega_k omega / quality)`. Near the frequency of a mode that one term is far
 * bigger than the others, and the plate bends like the mode.
 */
export function amplitudes(modes: PlateModes, coupling: Float64Array, omega: number, quality: number): Float64Array {
    const result = new Float64Array(2 * modes.count);

    for (let k = 0; k < modes.count; k++) {
        const spring = modes.omega[k] ** 2 - omega ** 2;
        const damping = (modes.omega[k] * omega) / quality;
        const size = spring * spring + damping * damping;

        result[2 * k] = (coupling[k] * spring) / size;
        result[2 * k + 1] = (-coupling[k] * damping) / size;
    }

    return result;
}

/**
 * How big the response of the whole plate is at the frequency `omega`: the square root of the mean square of the
 * displacement over the plate. The modes are orthonormal, so it is the amount in each, added up as squares.
 */
export function overallResponse(modes: PlateModes, coupling: Float64Array, omega: number, quality: number): number {
    const a = amplitudes(modes, coupling, omega, quality);
    let sum = 0;

    for (let i = 0; i < a.length; i++) sum += a[i] * a[i];

    return Math.sqrt(sum);
}

/**
 * The factor that turns the acceleration of the plate, which is `omega^2` times the displacement, into the shaking
 * that the sand feels. `power` is how hard the shaker is driven (1 is the normal strength).
 */
export function shakingFactor(power: number): number {
    return (power * SHAKING_AT_A_GOOD_PEAK) / REFERENCE_QUALITY;
}

/** The frequencies at which the shaker makes the plate resonate with a mode that it can reach, with how well it does it. */
export function reachableModes(modes: PlateModes, coupling: Float64Array, minimum = 0.15): { mode: number; omega: number; coupling: number }[] {
    const found: { mode: number; omega: number; coupling: number }[] = [];

    for (let k = 0; k < modes.count; k++) {
        if (Math.abs(coupling[k]) >= minimum) found.push({ mode: k, omega: modes.omega[k], coupling: coupling[k] });
    }

    return found;
}

/** The material of the plates: aluminium, which is about as stiff for its weight as steel (the same pitch at the same size). */
const YOUNG = 70e9;
const DENSITY = 2700;
const POISSON = 0.3;

/**
 * How many hertz a unit of the dimensionless frequency is, for a plate of the given size and thickness.
 *
 * The frequency of a mode is `omega = Omega sqrt(D / (rho h)) / L^2`, with the bending stiffness
 * `D = E h^3 / (12 (1 - nu^2))`: thick plates ring higher, big ones lower.
 *
 * @param size the side, in centimetres, of a square plate that has the same area
 * @param thickness in millimetres
 */
export function hertzPerOmega(size: number, thickness: number): number {
    const length = size / 100;
    const height = thickness / 1000;
    const speed = Math.sqrt(YOUNG / (12 * DENSITY * (1 - POISSON ** 2)));

    return (speed * height) / (2 * Math.PI * length ** 2);
}

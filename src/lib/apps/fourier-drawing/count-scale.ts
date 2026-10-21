/**
 * Maps the positions of a slider to a number of circles.
 *
 * The first circles matter far more than the last ones, so a plain linear slider would pack all the interesting
 * values at its left edge. A logarithmic one has the opposite flaw: at the start many positions are the same
 * number. This scale moves one circle at a time at first, then speeds up, so that every step of the slider changes
 * the result, whatever the total.
 */
export interface CountScale {
    /** The slider goes from position 0 to this one. */
    steps: number;
    /** Number of circles at a slider position, from 1 to the maximum. */
    count: (position: number) => number;
    /** The slider position closest to a number of circles. */
    position: (count: number) => number;
}

/** A slider with more steps than this is hard to use. */
const MAX_STEPS = 200;

/** Finds the curvature `a` for which `a / sinh(a)` equals `target`, a value between 0 and 1. */
function solveCurvature(target: number): number {
    let low = 0;
    let high = 50;

    for (let i = 0; i < 60; i++) {
        const middle = (low + high) / 2;
        const slope = middle < 1e-9 ? 1 : middle / Math.sinh(middle);

        if (slope > target) low = middle;
        else high = middle;
    }

    return (low + high) / 2;
}

export function createCountScale(maximum: number): CountScale {
    const span = Math.max(0, Math.floor(maximum) - 1);
    const steps = Math.min(span, MAX_STEPS);

    if (steps === 0) {
        return { steps: 0, count: () => Math.max(0, Math.floor(maximum)), position: () => 0 };
    }

    // Up to MAX_STEPS + 1 circles the slider is linear. Beyond that it follows a hyperbolic sine, bent just enough
    // for the first step to still add a single circle.
    const curvature = span <= steps ? 0 : solveCurvature(steps / span);
    const bend = Math.sinh(curvature);

    const count = (position: number) => {
        const share = Math.min(1, Math.max(0, position / steps));
        const progress = curvature === 0 ? share : Math.sinh(curvature * share) / bend;

        return 1 + Math.round(span * progress);
    };

    const positionOf = (circles: number) => {
        const progress = Math.min(1, Math.max(0, (circles - 1) / span));
        const share = curvature === 0 ? progress : Math.asinh(progress * bend) / curvature;

        return Math.round(share * steps);
    };

    return { steps, count, position: positionOf };
}

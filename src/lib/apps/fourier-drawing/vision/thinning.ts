/**
 * Guo-Hall thinning: peels a mask until every line is one pixel wide, without breaking it apart.
 * The mask is modified in place and must not have any set pixel on its outermost ring.
 *
 * Unlike the better known Zhang-Suen algorithm it also reduces the diagonal lines that are two pixels wide,
 * which would otherwise be traced twice, side by side.
 */
export function thin(mask: Uint8Array, width: number, height: number): void {
    let candidates: number[] = [];

    for (let i = 0; i < mask.length; i++) {
        if (mask[i]) candidates.push(i);
    }

    const removable: number[] = [];
    let changed = true;

    while (changed) {
        changed = false;

        // The two sub-iterations peel opposite sides, which keeps the skeleton centred
        for (const pass of [0, 1]) {
            removable.length = 0;

            for (const i of candidates) {
                if (canRemove(mask, i, width, height, pass)) removable.push(i);
            }

            for (const i of removable) mask[i] = 0;

            if (removable.length > 0) {
                changed = true;
                candidates = candidates.filter((i) => mask[i]);
            }
        }
    }
}

function canRemove(mask: Uint8Array, i: number, width: number, height: number, pass: number): boolean {
    const x = i % width;
    const y = (i - x) / width;

    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return false;

    // Neighbours clockwise from the top: N, NE, E, SE, S, SW, W, NW
    const p2 = mask[i - width];
    const p3 = mask[i - width + 1];
    const p4 = mask[i + 1];
    const p5 = mask[i + width + 1];
    const p6 = mask[i + width];
    const p7 = mask[i + width - 1];
    const p8 = mask[i - 1];
    const p9 = mask[i - width - 1];

    // Connected groups of neighbours: exactly one, so taking the pixel away cannot split the line
    const groups =
        ((1 - p2) & (p3 | p4)) + ((1 - p4) & (p5 | p6)) + ((1 - p6) & (p7 | p8)) + ((1 - p8) & (p9 | p2));
    if (groups !== 1) return false;

    // Neighbours counted in pairs, in the two possible ways: the pixel must be on an edge, but not at the tip of a line
    const pairsA = (p9 | p2) + (p3 | p4) + (p5 | p6) + (p7 | p8);
    const pairsB = (p2 | p3) + (p4 | p5) + (p6 | p7) + (p8 | p9);
    const pairs = Math.min(pairsA, pairsB);
    if (pairs < 2 || pairs > 3) return false;

    // Each sub-iteration only takes pixels from one side
    return pass === 0 ? ((p6 | p7 | (1 - p9)) & p8) === 0 : ((p2 | p3 | (1 - p5)) & p4) === 0;
}

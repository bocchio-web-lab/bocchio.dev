import { LAND_CELLS_PER_DEGREE, LAND_ROWS } from './land';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const WIDTH = 360 * LAND_CELLS_PER_DEGREE;
const HEIGHT = 180 * LAND_CELLS_PER_DEGREE;

/** The cells of the grid, row after row from the north, with 1 for the land. They are worked out when they are first needed. */
let cells: Uint8Array | null = null;

function decode(): Uint8Array {
    const grid = new Uint8Array(WIDTH * HEIGHT);

    LAND_ROWS.forEach((text, row) => {
        let column = 0;
        let land = 0;

        for (let i = 0; i < text.length; i += 2) {
            const length = BASE64.indexOf(text[i]) * 64 + BASE64.indexOf(text[i + 1]);

            if (land) grid.fill(1, row * WIDTH + column, row * WIDTH + column + length);

            column += length;
            land = 1 - land;
        }
    });

    return grid;
}

/** How much land there is at a place, from 0 for the sea to 1 for the land: it changes smoothly between the cells, and 0.5 is the coast. */
export function landAt(lat: number, lon: number): number {
    const grid = (cells ??= decode());

    // The place in cells, where the middle of the first cell is 0
    const x = (lon + 180) * LAND_CELLS_PER_DEGREE - 0.5;
    const y = (90 - lat) * LAND_CELLS_PER_DEGREE - 0.5;
    const left = Math.floor(x);
    const top = Math.floor(y);
    const across = x - left;
    const down = y - top;

    // The columns go round the Earth, the rows stop at the poles
    const column0 = left < 0 ? WIDTH - 1 : left;
    const column1 = left + 1 >= WIDTH ? 0 : left + 1;
    const row0 = Math.max(0, Math.min(HEIGHT - 1, top)) * WIDTH;
    const row1 = Math.max(0, Math.min(HEIGHT - 1, top + 1)) * WIDTH;

    const upper = grid[row0 + column0] * (1 - across) + grid[row0 + column1] * across;
    const lower = grid[row1 + column0] * (1 - across) + grid[row1 + column1] * across;

    return upper * (1 - down) + lower * down;
}

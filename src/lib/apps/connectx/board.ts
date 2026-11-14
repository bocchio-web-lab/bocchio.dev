import type { GameConfig } from './protocol';

/** A place on the board. Row 0 is the top one. */
export interface Cell {
    row: number;
    col: number;
}

export function emptyBoard(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
}

/** A column is full when its top cell is taken. */
export function isColumnFull(board: number[][], col: number): boolean {
    return (board[0]?.[col] ?? 1) !== 0;
}

/** Directions in which a line can go, as `[row, column]` steps: across, down and the two diagonals. */
const DIRECTIONS: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
];

/**
 * The discs that won the game: every line of the winner that has the number of discs it takes (or more).
 * A move can complete several lines at once, and they are all shown.
 */
export function winningLine(board: number[][], connect: number, winner: number): Cell[] {
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    const won = new Map<number, Cell>();

    const holds = (row: number, col: number) => row >= 0 && row < rows && col >= 0 && col < cols && board[row][col] === winner;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            for (const [dRow, dCol] of DIRECTIONS) {
                // Only lines that start here: the cell before is not part of the same line
                if (!holds(row, col) || holds(row - dRow, col - dCol)) continue;

                const line: Cell[] = [];
                for (let r = row, c = col; holds(r, c); r += dRow, c += dCol) line.push({ row: r, col: c });

                if (line.length >= connect) for (const cell of line) won.set(cell.row * cols + cell.col, cell);
            }
        }
    }

    return [...won.values()];
}

/** The disc that was dropped between two states of the same game (none if nothing changed, or if it was many). */
export function lastMove(before: number[][] | null, after: number[][]): Cell | null {
    if (!before || before.length !== after.length) return null;

    let found: Cell | null = null;

    for (let row = 0; row < after.length; row++) {
        for (let col = 0; col < after[row].length; col++) {
            if (before[row]?.[col] === after[row][col]) continue;
            if (found || before[row]?.[col] !== 0) return null;

            found = { row, col };
        }
    }

    return found;
}

/** What is written about the shape of a game: `6 × 7, connect 4`, and the players if they are not two. */
export function describeConfig(config: GameConfig): string {
    const players = config.players === 2 ? '' : `, ${config.players} players`;
    return `${config.rows} × ${config.cols}, connect ${config.connect}${players}`;
}

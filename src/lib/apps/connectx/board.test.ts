import { describe, expect, it } from 'vitest';
import { describeConfig, emptyBoard, isColumnFull, lastMove, winningLine } from './board';

/** A board from lines of text: `.` is empty, digits are players. Row 0 is the first line. */
function board(...lines: string[]): number[][] {
    return lines.map((line) => [...line].map((char) => (char === '.' ? 0 : Number(char))));
}

const keys = (cells: { row: number; col: number }[]) => cells.map((cell) => `${cell.row},${cell.col}`).sort();

describe('the board', () => {
    it('starts empty', () => {
        expect(emptyBoard(2, 3)).toEqual([
            [0, 0, 0],
            [0, 0, 0],
        ]);
    });

    it('has a full column when its top cell is taken', () => {
        const full = board('1.', '2.', '1.');

        expect(isColumnFull(full, 0)).toBe(true);
        expect(isColumnFull(full, 1)).toBe(false);
        expect(isColumnFull(full, 5)).toBe(true); // there is no such column
    });
});

describe('the winning line', () => {
    it('is found across', () => {
        const won = board('.......', '.......', '.......', '.......', '2.2....', '1111.2.');

        expect(keys(winningLine(won, 4, 1))).toEqual(['5,0', '5,1', '5,2', '5,3']);
    });

    it('is found down', () => {
        const won = board('....', '1...', '1...', '1.2.', '12.2');

        expect(keys(winningLine(won, 4, 1))).toEqual(['1,0', '2,0', '3,0', '4,0']);
    });

    it('is found on a diagonal that goes down to the right', () => {
        const won = board('1...', '21..', '221.', '2221');

        expect(keys(winningLine(won, 4, 1))).toEqual(['0,0', '1,1', '2,2', '3,3']);
    });

    it('is found on a diagonal that goes down to the left', () => {
        const won = board('...1', '..12', '.122', '1222');

        expect(keys(winningLine(won, 4, 1))).toEqual(['0,3', '1,2', '2,1', '3,0']);
    });

    it('includes all the discs of a line that is longer than needed', () => {
        const won = board('......', '111111');

        expect(winningLine(won, 4, 1)).toHaveLength(6);
    });

    it('includes every line completed at once', () => {
        // Across and down, crossing at the corner
        const won = board('1...', '1...', '1...', '1111');

        expect(keys(winningLine(won, 4, 1))).toEqual(['0,0', '1,0', '2,0', '3,0', '3,1', '3,2', '3,3']);
    });

    it('depends on the number of discs to connect', () => {
        const won = board('....', '....', '....', '222.');

        expect(winningLine(won, 3, 2)).toHaveLength(3);
        expect(winningLine(won, 4, 2)).toEqual([]);
    });

    it('is the one of the winner, not of anybody else', () => {
        const won = board('....', '....', '2222', '1111');

        expect(keys(winningLine(won, 4, 2))).toEqual(['2,0', '2,1', '2,2', '2,3']);
    });

    it('does not exist when nobody has connected enough', () => {
        expect(winningLine(board('1.1', '.1.', '2.2'), 3, 1)).toEqual([]);
        expect(winningLine([], 4, 1)).toEqual([]);
    });
});

describe('the last move', () => {
    it('is the disc that was added', () => {
        const before = board('...', '...', '1..');
        const after = board('...', '2..', '1..');

        expect(lastMove(before, after)).toEqual({ row: 1, col: 0 });
    });

    it('is unknown when nothing changed, or when it all changed', () => {
        const same = board('...', '1..');

        expect(lastMove(same, same)).toBeNull();
        expect(lastMove(null, same)).toBeNull();
        expect(lastMove(board('...', '...'), board('1.1', '...'))).toBeNull();
    });

    it('is unknown when a disc was replaced', () => {
        expect(lastMove(board('1'), board('2'))).toBeNull();
    });
});

describe('describing a game', () => {
    it('says the size and the discs to connect', () => {
        expect(describeConfig({ rows: 6, cols: 7, players: 2, connect: 4 })).toBe('6 × 7, connect 4');
    });

    it('also says the players, when they are not two', () => {
        expect(describeConfig({ rows: 7, cols: 9, players: 3, connect: 4 })).toBe('7 × 9, connect 4, 3 players');
    });
});

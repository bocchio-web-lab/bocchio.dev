import { describe, expect, it } from 'vitest';
import { canMove, colorOf, isComputer, isFinished, seats, summarize, withNames, type GameView } from './game';
import { emptyBoard } from './board';
import { GameStatus, type GameState } from './protocol';

function state(overrides: Partial<GameState> = {}): GameState {
    return {
        id: 1,
        board: emptyBoard(6, 7),
        rows: 6,
        cols: 7,
        current: 1,
        status: GameStatus.IN_PROGRESS,
        winner: null,
        players: [1, 2],
        names: ['Ada', 'Bob'],
        ...overrides,
    };
}

function view(overrides: Partial<GameView> = {}): GameView {
    return {
        id: 1,
        name: 'Duel',
        config: { rows: 6, cols: 7, players: 2, connect: 4 },
        me: 1,
        myName: 'Ada',
        state: state(),
        roster: { 1: 'Ada', 2: 'Bob' },
        last: null,
        computer: null,
        level: null,
        problem: null,
        ...overrides,
    };
}

describe('colours', () => {
    it('are different for each player', () => {
        const colors = [1, 2, 3, 4].map(colorOf);

        expect(new Set(colors).size).toBe(4);
    });
});

describe('what is going on', () => {
    it('is a wait, right after joining', () => {
        const summary = summarize(view({ state: null }));

        expect(summary.tone).toBe('waiting');
        expect(summary.headline).toBe('Waiting for an opponent…');
    });

    it('is a wait while the game has not started', () => {
        expect(summarize(view({ state: state({ status: GameStatus.NOT_STARTED, players: [1], names: ['Ada'] }) })).tone).toBe('waiting');
    });

    it('counts the players that are missing in a game of many', () => {
        const config = { rows: 7, cols: 9, players: 4, connect: 4 };

        expect(summarize(view({ config, state: state({ status: GameStatus.NOT_STARTED, players: [1, 2], names: ['A', 'B'] }) })).headline).toBe('Waiting for 2 more players…');
        expect(summarize(view({ config, state: state({ status: GameStatus.NOT_STARTED, players: [1, 2, 3], names: ['A', 'B', 'C'] }) })).headline).toBe('Waiting for 1 more player…');
    });

    it('tells whose turn it is', () => {
        expect(summarize(view({ state: state({ current: 1 }) }))).toMatchObject({ tone: 'turn', headline: 'Your turn' });
        expect(summarize(view({ state: state({ current: 2 }) }))).toMatchObject({ tone: 'opponent', headline: "Bob's turn" });
    });

    it('says that a computer is thinking', () => {
        const thinking = view({ roster: { 1: 'Ada', 2: 'Computer (Easy)' }, state: state({ current: 2, names: ['Ada', 'Computer (Easy)'] }) });

        expect(summarize(thinking).headline).toBe('Computer (Easy) is thinking…');
    });

    it('is a victory, a defeat or a draw when the game is over', () => {
        expect(summarize(view({ state: state({ status: GameStatus.FINISHED_WIN, winner: 1 }) })).tone).toBe('won');
        expect(summarize(view({ state: state({ status: GameStatus.FINISHED_WIN, winner: 2 }) }))).toMatchObject({ tone: 'lost', headline: 'Bob won' });
        expect(summarize(view({ state: state({ status: GameStatus.FINISHED_DRAW }) })).tone).toBe('draw');
    });

    it('is a game that nobody else is in any more', () => {
        expect(summarize(view({ state: state({ players: [1], names: ['Ada'] }) }))).toMatchObject({ tone: 'alone', headline: 'Your opponent left the game' });

        const config = { rows: 7, cols: 9, players: 3, connect: 4 };
        const crowd = view({ config, state: state({ players: [1], names: ['Ada'] }) });

        expect(summarize(crowd).headline).toBe('The other players left the game');
    });

    it('remembers the winner by name, even if the winner has gone', () => {
        const over = view({ state: state({ status: GameStatus.FINISHED_WIN, winner: 2, players: [1], names: ['Ada'] }) });

        expect(summarize(over).headline).toBe('Bob won');
    });

    it('does not make a mess of a winner nobody knows', () => {
        expect(summarize(view({ state: state({ status: GameStatus.FINISHED_WIN, winner: 3 }) })).headline).toBe('Player 3 won');
    });
});

describe('moving', () => {
    it('is possible on your turn', () => {
        expect(canMove(view())).toBe(true);
    });

    it('is not on the turn of the others', () => {
        expect(canMove(view({ state: state({ current: 2 }) }))).toBe(false);
    });

    it('is not possible before the game, after it, or without a state', () => {
        expect(canMove(view({ state: null }))).toBe(false);
        expect(canMove(view({ state: state({ status: GameStatus.NOT_STARTED }) }))).toBe(false);
        expect(canMove(view({ state: state({ status: GameStatus.FINISHED_WIN, winner: 1 }) }))).toBe(false);
    });

    it('is not possible when the others have gone', () => {
        expect(canMove(view({ state: state({ players: [1], names: ['Ada'] }) }))).toBe(false);
    });
});

describe('the end of the game', () => {
    it('is a win or a draw', () => {
        expect(isFinished(view({ state: state({ status: GameStatus.FINISHED_WIN, winner: 2 }) }))).toBe(true);
        expect(isFinished(view({ state: state({ status: GameStatus.FINISHED_DRAW }) }))).toBe(true);
        expect(isFinished(view())).toBe(false);
        expect(isFinished(view({ state: null }))).toBe(false);
    });
});

describe('the seats', () => {
    it('show who is there', () => {
        expect(seats(view())).toEqual([
            { player: 1, name: 'Ada', you: true, presence: 'here' },
            { player: 2, name: 'Bob', you: false, presence: 'here' },
        ]);
    });

    it('show who is missing before the start', () => {
        const waiting = view({ state: state({ status: GameStatus.NOT_STARTED, players: [1], names: ['Ada'] }) });

        expect(seats(waiting)[1]).toMatchObject({ player: 2, presence: 'free' });
    });

    it('know only the visitor right after joining', () => {
        expect(seats(view({ state: null, me: 2, myName: 'Bob' }))).toEqual([
            { player: 1, name: '', you: false, presence: 'free' },
            { player: 2, name: 'Bob', you: true, presence: 'here' },
        ]);
    });

    it('show who has left a game that had started', () => {
        const left = view({ state: state({ players: [1], names: ['Ada'] }) });

        expect(seats(left)[1]).toMatchObject({ player: 2, name: 'Bob', presence: 'left' });
    });

    it('do not blame a player who is gone for a game that is over', () => {
        // A computer goes away as soon as its game is over, which is no reason to say that it left
        const over = view({ state: state({ status: GameStatus.FINISHED_WIN, winner: 2, players: [1], names: ['Ada'] }) });

        expect(seats(over)).toEqual([
            { player: 1, name: 'Ada', you: true, presence: 'here' },
            { player: 2, name: 'Bob', you: false, presence: 'here' },
        ]);
    });

    it('are free again when somebody leaves before the game starts', () => {
        const waiting = view({ state: state({ status: GameStatus.NOT_STARTED, players: [1], names: ['Ada'] }) });

        expect(seats(waiting)[1]).toEqual({ player: 2, name: '', you: false, presence: 'free' });
    });

    it('have a place for everybody in a game of many', () => {
        const config = { rows: 7, cols: 9, players: 3, connect: 4 };

        expect(seats(view({ config, state: state({ status: GameStatus.NOT_STARTED, players: [1], names: ['Ada'] }) }))).toHaveLength(3);
    });
});

describe('the roster', () => {
    it('learns the names that the state tells', () => {
        expect(withNames({}, state())).toEqual({ 1: 'Ada', 2: 'Bob' });
    });

    it('keeps the names of the players who are gone', () => {
        expect(withNames({ 1: 'Ada', 2: 'Bob' }, state({ players: [1], names: ['Ada'] }))).toEqual({ 1: 'Ada', 2: 'Bob' });
    });

    it('takes the new name of a player who comes in the place of another', () => {
        expect(withNames({ 1: 'Ada', 2: 'Bob' }, state({ players: [1, 2], names: ['Ada', 'Eve'] }))).toEqual({ 1: 'Ada', 2: 'Eve' });
    });

    it('does not put a player without a name in it', () => {
        expect(withNames({}, state({ players: [1, 2], names: ['Ada'] }))).toEqual({ 1: 'Ada' });
    });
});

describe('computers', () => {
    it('have a name that says so', () => {
        expect(isComputer('Computer (Hard)')).toBe(true);
        expect(isComputer('Compu')).toBe(false);
        expect(isComputer('Ada')).toBe(false);
    });
});

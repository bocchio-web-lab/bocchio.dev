import type { Cell } from './board';
import { GameStatus, type GameConfig, type GameState } from './protocol';

/** The game the visitor is in. */
export interface GameView {
    id: number;
    /** Empty for a game of the quick match. */
    name: string;
    config: GameConfig;
    /** The number of the player the visitor is. */
    me: number;
    myName: string;
    /** What the server last said about the game; null until it does, right after joining. */
    state: GameState | null;
    /** The names of the players by number, kept after they leave: a computer goes away as soon as its game is over. */
    roster: Record<number, string>;
    /** The disc dropped last, to point it out. */
    last: Cell | null;
    /** The name of the computer that plays in this game, if the visitor asked for one. */
    computer: string | null;
    /** How strong that computer is. */
    level: number | null;
    /** What went wrong with the last move, if anything. */
    problem: string | null;
}

/** The colours of the discs, by player. They are meant to stand out from one another on a dark blue board. */
const PLAYER_COLORS = ['#e5484d', '#f5c518', '#30a46c', '#a855f7'];

export function colorOf(player: number): string {
    return PLAYER_COLORS[(player - 1 + PLAYER_COLORS.length) % PLAYER_COLORS.length];
}

export type Tone = 'waiting' | 'turn' | 'opponent' | 'won' | 'lost' | 'draw' | 'alone';

export interface Summary {
    tone: Tone;
    headline: string;
    detail?: string;
}

export interface Seat {
    player: number;
    name: string;
    you: boolean;
    /** `free`: nobody yet. `left`: somebody was there, in a game that has started. */
    presence: 'here' | 'free' | 'left';
}

export function isComputer(name: string): boolean {
    return name.startsWith('Computer (');
}

/** The roster with the names that a state of the game tells. */
export function withNames(roster: Record<number, string>, state: GameState): Record<number, string> {
    const names = { ...roster };

    state.players.forEach((player, index) => {
        if (state.names[index]) names[player] = state.names[index];
    });

    return names;
}

/** The places at the table: who sits at each, and who is missing. */
export function seats(view: GameView): Seat[] {
    const present = new Set(view.state?.players ?? [view.me]);
    const started = view.state !== null && view.state.status !== GameStatus.NOT_STARTED;
    const over = isFinished(view);
    const result: Seat[] = [];

    for (let player = 1; player <= view.config.players; player++) {
        const name = view.roster[player] ?? '';
        let presence: Seat['presence'];

        if (present.has(player)) presence = 'here';
        // Nobody sits here: nobody has, or somebody left the room before the game started
        else if (name === '' || !started) presence = 'free';
        // The game is over: whoever has gone, a computer for instance, still played it
        else presence = over ? 'here' : 'left';

        result.push({ player, name: presence === 'free' ? '' : name, you: player === view.me, presence });
    }

    return result;
}

/** Whether the other players are still there: playing on alone makes no sense. */
function alone(view: GameView): boolean {
    return view.state !== null && view.state.players.every((player) => player === view.me);
}

/** Whether the visitor can drop a disc now. */
export function canMove(view: GameView): boolean {
    const state = view.state;

    return state !== null && state.status === GameStatus.IN_PROGRESS && state.current === view.me && !alone(view);
}

/** Whether the game is over, one way or another. */
export function isFinished(view: GameView): boolean {
    return view.state !== null && (view.state.status === GameStatus.FINISHED_WIN || view.state.status === GameStatus.FINISHED_DRAW);
}

/** What is going on, in a few words. */
export function summarize(view: GameView): Summary {
    const state = view.state;
    const nameOf = (player: number) => view.roster[player] || `Player ${player}`;

    if (!state || state.status === GameStatus.NOT_STARTED) {
        const missing = view.config.players - (state?.players.length ?? 1);

        return {
            tone: 'waiting',
            headline: view.config.players === 2 ? 'Waiting for an opponent…' : `Waiting for ${missing} more player${missing === 1 ? '' : 's'}…`,
        };
    }

    if (state.status === GameStatus.FINISHED_DRAW) return { tone: 'draw', headline: "It's a draw", detail: 'The board is full.' };

    if (state.status === GameStatus.FINISHED_WIN) {
        return state.winner === view.me
            ? { tone: 'won', headline: 'You won!', detail: 'Well played.' }
            : { tone: 'lost', headline: `${nameOf(state.winner ?? 0)} won`, detail: 'Better luck next time.' };
    }

    if (alone(view)) {
        return {
            tone: 'alone',
            headline: view.config.players === 2 ? 'Your opponent left the game' : 'The other players left the game',
            detail: 'Leave to find another game.',
        };
    }

    if (state.current === view.me) return { tone: 'turn', headline: 'Your turn', detail: 'Choose a column.' };

    const who = nameOf(state.current);
    return { tone: 'opponent', headline: isComputer(who) ? `${who} is thinking…` : `${who}'s turn` };
}

// The messages of the ConnectX game, as the web gateway carries them (see network/gateway/README.md in
// https://github.com/Bocchio01/connectx-game-suite). One WebSocket text message is one JSON envelope: `{ type, payload }`.

export const MessageType = {
    REQ_CONNECT: 0x01,
    RES_CONNECT: 0x02,
    DISCONNECT: 0x03,
    HEARTBEAT: 0x04,
    MAKE_MOVE: 0x10,
    MOVE_RESULT: 0x11,
    GAME_STATE_UPDATE: 0x12,
    REQ_CREATE_GAME: 0x20,
    RES_CREATE_GAME: 0x21,
    REQ_LIST_GAMES: 0x22,
    RES_LIST_GAMES: 0x23,
    REQ_JOIN_GAME: 0x24,
    RES_JOIN_GAME: 0x25,
    // What the gateway offers on top of the game server
    REQ_COMPUTER_LEVELS: 0x30,
    RES_COMPUTER_LEVELS: 0x31,
    REQ_ADD_COMPUTER: 0x32,
    RES_ADD_COMPUTER: 0x33,
    ERROR: 0xff,
} as const;

export const GameStatus = {
    NOT_STARTED: 0,
    IN_PROGRESS: 1,
    FINISHED_WIN: 2,
    FINISHED_DRAW: 3,
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const ErrorCode = {
    INVALID_MESSAGE: 1,
    CONNECTION_REFUSED: 100,
    GAME_NOT_FOUND: 200,
    GAME_FULL: 201,
    GAME_ALREADY_STARTED: 202,
    GAME_NOT_STARTED: 203,
    ALREADY_IN_GAME: 204,
    TOO_MANY_ROOMS: 205,
    INVALID_MOVE: 300,
    NOT_YOUR_TURN: 301,
    COLUMN_FULL: 302,
    GAME_ALREADY_OVER: 303,
} as const;

/** Biggest and smallest games the server accepts. */
export const LIMITS = {
    minSize: 4,
    maxSize: 20,
    minPlayers: 2,
    maxPlayers: 4,
    minConnect: 3,
    maxName: 32,
} as const;

export type Payload = Record<string, unknown>;

export interface Message {
    type: number;
    payload: Payload;
}

/** The shape of a game. */
export interface GameConfig {
    rows: number;
    cols: number;
    players: number;
    /** How many discs in a line win. */
    connect: number;
}

/** A game in the lobby. */
export interface Room {
    id: number;
    /** Empty for the games of the quick match, which have no name. */
    name: string;
    players: number;
    status: GameStatus;
    config: GameConfig;
}

/** What the server says about a game that is going on: the whole board, every time. */
export interface GameState {
    id: number;
    /** `board[row][col]`, row 0 at the top: 0 is an empty cell, any other number is the player who holds it. */
    board: number[][];
    rows: number;
    cols: number;
    /** The player who has to move. */
    current: number;
    status: GameStatus;
    winner: number | null;
    /** The players who are in the game now, with their names in the same order. */
    players: number[];
    names: string[];
}

/** A strength of the computer opponent. */
export interface Level {
    level: number;
    name: string;
    summary: string;
}

export interface Levels {
    /** Whether this server has computers to play against. */
    available: boolean;
    levels: Level[];
}

export interface Joined {
    /** The number of the player I am. */
    me: number;
    room: Room;
}

export function isRecord(value: unknown): value is Payload {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function integer(value: unknown): number | null {
    return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function status(value: unknown): GameStatus | null {
    const number = integer(value);
    return number !== null && number >= GameStatus.NOT_STARTED && number <= GameStatus.FINISHED_DRAW ? (number as GameStatus) : null;
}

/** Reads a message that came from the gateway; null if it is not one. */
export function parseMessage(data: unknown): Message | null {
    if (typeof data !== 'string') return null;

    let message: unknown;
    try {
        message = JSON.parse(data);
    } catch {
        return null;
    }

    if (!isRecord(message)) return null;

    const type = integer(message.type);
    if (type === null) return null;

    return { type, payload: isRecord(message.payload) ? message.payload : {} };
}

export function encodeMessage(type: number, payload: Payload = {}): string {
    return JSON.stringify({ type, payload });
}

export function configToWire(config: GameConfig): Payload {
    return { rows: config.rows, cols: config.cols, num_players: config.players, connect_length: config.connect };
}

export function parseConfig(value: unknown): GameConfig | null {
    if (!isRecord(value)) return null;

    const rows = integer(value.rows);
    const cols = integer(value.cols);
    const players = integer(value.num_players);
    const connect = integer(value.connect_length);

    return rows === null || cols === null || players === null || connect === null ? null : { rows, cols, players, connect };
}

/** A game of the lobby list (which calls its name `game_name`) or of a join response (`name`). */
export function parseRoom(value: unknown): Room | null {
    if (!isRecord(value)) return null;

    const id = integer(value.game_id);
    const players = integer(value.current_players);
    const state = status(value.status);
    const config = parseConfig(value.config);

    if (id === null || players === null || state === null || config === null) return null;

    return { id, name: text(value.game_name ?? value.name), players, status: state, config };
}

export function parseRooms(payload: Payload): Room[] {
    if (!Array.isArray(payload.games)) return [];

    return payload.games.map(parseRoom).filter((room): room is Room => room !== null);
}

export function parseJoined(payload: Payload): Joined | null {
    const me = integer(payload.assigned_player_id);
    const room = parseRoom(payload.game_info);

    return me === null || room === null ? null : { me, room };
}

export function parseGameState(payload: Payload): GameState | null {
    const id = integer(payload.game_id);
    const rows = integer(payload.rows);
    const cols = integer(payload.cols);
    const current = integer(payload.current_player);
    const state = status(payload.status);

    if (id === null || rows === null || cols === null || current === null || state === null) return null;
    if (!Array.isArray(payload.board) || payload.board.length !== rows) return null;

    const board: number[][] = [];
    for (const row of payload.board) {
        if (!Array.isArray(row) || row.length !== cols || !row.every((cell) => integer(cell) !== null)) return null;
        board.push(row as number[]);
    }

    const players = Array.isArray(payload.players) ? payload.players.filter((player): player is number => integer(player) !== null) : [];
    const names = Array.isArray(payload.player_names) ? payload.player_names.map(text) : [];

    return { id, board, rows, cols, current, status: state, winner: integer(payload.winner), players, names };
}

export function parseLevels(payload: Payload): Levels {
    const levels: Level[] = [];

    if (Array.isArray(payload.levels)) {
        for (const item of payload.levels) {
            if (!isRecord(item)) continue;

            const level = integer(item.level);
            if (level !== null) levels.push({ level, name: text(item.name), summary: text(item.summary) });
        }
    }

    return { available: payload.available === true && levels.length > 0, levels };
}

/** What an ERROR message says. */
export function parseError(payload: Payload): { code: number; text: string } {
    return { code: integer(payload.error_code) ?? 0, text: text(payload.error_message) };
}

/** Why a connection ended, in words for the visitor (`opened`: whether it had worked until then). */
export function describeClose(code: number, reason: string, opened: boolean): string {
    if (!opened) {
        return code === 1013
            ? 'The game server is not available right now. Please try again in a little while.'
            : 'Cannot reach the game server. It may be down or restarting: please try again in a little while.';
    }

    switch (code) {
        case 1000:
            return 'You left the game.';
        case 1001:
            return reason ? `The connection was closed: ${reason.replace(/\.$/, '').toLowerCase()}.` : 'The connection was closed.';
        case 1008:
            return 'You were disconnected for sending too many messages.';
        case 1011:
            return 'The game server closed the connection.';
        case 1013:
            return 'The game server is not available right now. Please try again in a little while.';
        default:
            return 'The connection to the game server was lost.';
    }
}

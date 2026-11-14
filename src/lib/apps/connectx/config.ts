import { LIMITS, type GameConfig } from './protocol';

/** The game everybody knows. */
export const CLASSIC: GameConfig = { rows: 6, cols: 7, players: 2, connect: 4 };

export interface Preset {
    id: string;
    label: string;
    config: GameConfig;
}

/** Some of the games that can be played, to start from. */
export const PRESETS: Preset[] = [
    { id: 'classic', label: 'Classic', config: CLASSIC },
    { id: 'connect-5', label: 'Connect 5', config: { rows: 6, cols: 9, players: 2, connect: 5 } },
    { id: 'three-players', label: 'Three players', config: { rows: 7, cols: 9, players: 3, connect: 4 } },
];

export function sameConfig(a: GameConfig, b: GameConfig): boolean {
    return a.rows === b.rows && a.cols === b.cols && a.players === b.players && a.connect === b.connect;
}

/** Why a game cannot be played with this shape (null if it can). The gateway applies the same rules. */
export function checkConfig(config: GameConfig): string | null {
    const numbers = [config.rows, config.cols, config.players, config.connect];

    if (!numbers.every((number) => Number.isInteger(number))) return 'Rows, columns, discs and players must be whole numbers.';

    if (config.rows < LIMITS.minSize || config.rows > LIMITS.maxSize || config.cols < LIMITS.minSize || config.cols > LIMITS.maxSize)
        return `The board must have between ${LIMITS.minSize} and ${LIMITS.maxSize} rows and columns.`;

    if (config.players < LIMITS.minPlayers || config.players > LIMITS.maxPlayers)
        return `A game has between ${LIMITS.minPlayers} and ${LIMITS.maxPlayers} players.`;

    if (config.connect < LIMITS.minConnect || config.connect > Math.max(config.rows, config.cols))
        return `The discs to connect must be at least ${LIMITS.minConnect} and fit on the board.`;

    return null;
}

/**
 * Whether a computer can play this game: two players, on a board that fits the 64 bits of the AI
 * (the gateway has the last word, and says why when it refuses).
 */
export function computerCanPlay(config: GameConfig): boolean {
    return config.players === 2 && config.cols * (config.rows + 1) <= 64;
}

/** A name as the server takes it: no control characters, no spaces at the ends, not too long. */
export function cleanName(name: string): string {
    // eslint-disable-next-line no-control-regex
    return name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, LIMITS.maxName).trim();
}

/** Where the gateway listens when it is run on the developer's machine, with no options. */
export const LOCAL_GATEWAY_URL = 'ws://127.0.0.1:8081/connectx/ws';

/** Whether an address is the developer's own machine: `localhost`, or a name the machine makes up (`.test`). */
function isLocalHost(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost') || hostname.endsWith('.test');
}

/**
 * Where the gateway is: the address given for it if there is one (`PUBLIC_CONNECTX_URL`). Otherwise it is looked for
 * where the API is: on the same host, which is what the visitors' browsers are told to reach (that is only the name of
 * a machine, the API is not involved), or on the developer's own machine if the API is there too.
 */
export function resolveGatewayUrl(explicit: string | undefined, apiBase: string | undefined): string | null {
    if (explicit && explicit.trim() !== '') return explicit.trim();

    if (!apiBase) return null;

    try {
        const url = new URL(apiBase);

        if (isLocalHost(url.hostname)) return LOCAL_GATEWAY_URL;

        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.pathname = '/connectx/ws';
        url.search = '';
        url.hash = '';

        return url.toString();
    } catch {
        return null;
    }
}

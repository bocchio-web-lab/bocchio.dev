import { lastMove } from './board';
import { CLASSIC, checkConfig, cleanName } from './config';
import { ConnectionClosed, GatewayConnection, RequestError, type CloseInfo, type SocketFactory } from './connection';
import { canMove, withNames, type GameView } from './game';
import {
    ErrorCode,
    GameStatus,
    MessageType,
    configToWire,
    describeClose,
    parseError,
    parseGameState,
    parseJoined,
    parseLevels,
    parseRooms,
    type GameConfig,
    type GameState,
    type Joined,
    type Levels,
    type Message,
    type Room,
} from './protocol';

/** How often the list of rooms is asked for again, while the visitor looks at it. */
const POLL_INTERVAL = 4_000;

/** Somebody who does nothing at all in the lobby for this long is sent away: the place is for someone else. */
const IDLE_LIMIT = 10 * 60_000;

const PROTOCOL_VERSION = 1;

/** The strength of the computer that is chosen at first (the middle one). */
export const DEFAULT_LEVEL = 3;

/** Where the visitor is: not connected, getting connected, choosing a game, or playing one. */
export type Phase = 'idle' | 'connecting' | 'lobby' | 'game';

export interface Notice {
    tone: 'error' | 'info';
    text: string;
}

/** An error of the server, in words for the visitor. */
function explain(error: RequestError): string {
    switch (error.code) {
        case ErrorCode.GAME_NOT_FOUND:
            return 'That game does not exist any more.';
        case ErrorCode.GAME_FULL:
            return 'That game is already full.';
        case ErrorCode.GAME_ALREADY_STARTED:
            return 'That game has already started.';
        case ErrorCode.INVALID_MESSAGE:
            return error.message === 'Game name already exists'
                ? 'A room with this name already exists: please choose another name.'
                : error.message || 'The game server did not understand the request.';
        default:
            return error.message || 'The request failed. Please try again.';
    }
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 7);
}

/**
 * Everything the ConnectX page knows and does: the connection to the game, the lobby, the game that is being played.
 *
 * Nothing happens until the visitor asks for it: the connection is opened by `connect()` and lasts until
 * `disconnect()`. A game lives as long as its connection does, and there is one game for each connection,
 * so leaving a game means connecting again.
 */
export class ConnectXSession {
    phase = $state<Phase>('idle');
    name = $state('');
    notice = $state<Notice | null>(null);

    // The lobby
    rooms = $state.raw<Room[]>([]);
    roomsLoaded = $state(false);
    /** What computers there are to play against; null until the gateway says. */
    levels = $state.raw<Levels | null>(null);
    level = $state(DEFAULT_LEVEL);

    // The game
    game = $state.raw<GameView | null>(null);

    /** Something that takes a while is under way (the visitor has asked for it and has to wait). */
    busy = $state(false);
    moving = $state(false);

    #connection: GatewayConnection | null = null;
    #timer: ReturnType<typeof setInterval> | undefined;
    #activity = Date.now();
    /** A state of the game that came before the answer to the request that tells which game it is. */
    #early: GameState | null = null;

    constructor(
        private readonly gatewayUrl: string | null,
        private readonly createSocket?: SocketFactory,
    ) {}

    // Connecting

    /** Opens the connection and goes to the lobby. Returns whether it worked (if not, `notice` tells why). */
    async connect(name: string): Promise<boolean> {
        this.#hangUp();

        this.name = cleanName(name) || 'Guest';
        this.notice = null;

        if (!this.gatewayUrl) {
            this.notice = { tone: 'error', text: 'The address of the game server is not set up.' };
            return false;
        }

        this.phase = 'connecting';
        this.touch();

        const connection: GatewayConnection = new GatewayConnection(
            this.gatewayUrl,
            {
                onMessage: (message) => this.#received(connection, message),
                onClose: (info) => this.#closed(connection, info),
            },
            this.createSocket,
        );
        this.#connection = connection;

        try {
            await connection.open();

            const reply = await connection.request(
                MessageType.REQ_CONNECT,
                { player_name: this.name, protocol_version: PROTOCOL_VERSION },
                MessageType.RES_CONNECT,
            );

            if (reply.success !== true) {
                const message = typeof reply.message === 'string' ? reply.message : '';
                throw new RequestError(message || 'The game server did not accept the connection.', ErrorCode.CONNECTION_REFUSED);
            }
        } catch (error) {
            // (a connection that ended has said so itself: see #closed)
            if (this.#connection === connection && !(error instanceof ConnectionClosed)) {
                this.#failed(connection, error);
                this.#hangUp();
            }

            return false;
        }

        if (this.#connection !== connection) return false;

        this.phase = 'lobby';
        this.#timer = setInterval(() => this.#tick(), POLL_INTERVAL);

        void this.refreshRooms();
        void this.#loadLevels(connection);

        return true;
    }

    /** Hangs up, which is also how a game is left. `notice` is what the visitor is told, if anything. */
    disconnect(notice: Notice | null = null): void {
        this.#hangUp();
        this.notice = notice;
    }

    /** Leaves the game (and the lobby) and comes back to a new lobby, ready to start another game. */
    async leave(notice: Notice | null = null): Promise<void> {
        const name = this.name;

        this.disconnect();

        if ((await this.connect(name)) && notice) this.notice = notice;
    }

    /** Tells that the visitor is there, so that the lobby is not closed for inactivity. */
    touch(): void {
        this.#activity = Date.now();
    }

    dispose(): void {
        this.#hangUp();
    }

    // The lobby

    /** Asks the gateway for the rooms there are now. */
    async refreshRooms(): Promise<void> {
        const connection = this.#connection;
        if (!connection || this.phase !== 'lobby') return;

        try {
            const reply = await connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES);

            if (connection === this.#connection && this.phase === 'lobby') {
                this.rooms = parseRooms(reply);
                this.roomsLoaded = true;
            }
        } catch {
            // The list stays as it is; if the connection is gone, #closed has told the visitor
        }
    }

    /** Joins a game that is waiting for players. */
    joinRoom(room: Room): Promise<void> {
        return this.#run((connection) => this.#join(connection, room.id));
    }

    /** Joins the first game that is waiting for a player, or opens a new classic one. */
    quickMatch(): Promise<void> {
        return this.#run((connection) => this.#join(connection, 0));
    }

    /** Joins the room with this name, such as the one of an invitation, if it is still open. */
    joinNamed(name: string): Promise<void> {
        return this.#run(async (connection) => {
            const rooms = parseRooms(await connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES));
            const room = rooms.find((candidate) => candidate.name === name);

            if (!room || room.status !== GameStatus.NOT_STARTED || room.players >= room.config.players) {
                this.notice = { tone: 'info', text: `The room “${name}” is not open any more.` };
                return;
            }

            await this.#join(connection, room.id);
        });
    }

    /** Opens a room and waits in it for the others. */
    createRoom(name: string, config: GameConfig): Promise<void> {
        return this.#run(async (connection) => {
            const problem = checkConfig(config);

            if (problem) {
                this.notice = { tone: 'error', text: problem };
                return;
            }

            await this.#open(connection, cleanName(name), config);
        });
    }

    /** Opens a classic game against the computer. */
    playComputer(level = this.level): Promise<void> {
        return this.#run(async (connection) => {
            await this.#open(connection, `Computer game ${randomSuffix()}`, CLASSIC);

            const refusal = await this.#summon(connection, level);

            // There is nobody to play with: better to go back and choose something else
            if (refusal !== null) await this.leave({ tone: 'error', text: refusal });
        });
    }

    // The game

    /** Asks a computer to join the game, while it waits for players. */
    addComputer(level = this.level): Promise<void> {
        return this.#run(async (connection) => {
            const refusal = await this.#summon(connection, level);

            if (refusal !== null) this.notice = { tone: 'error', text: refusal };
        });
    }

    /** Drops a disc in the column. */
    async move(column: number): Promise<void> {
        const connection = this.#connection;
        const game = this.game;

        if (!connection || !game || !canMove(game) || this.moving) return;

        this.moving = true;
        this.touch();

        try {
            const reply = await connection.request(MessageType.MAKE_MOVE, { column }, MessageType.MOVE_RESULT);

            if (reply.success !== true) {
                this.#problem(connection, typeof reply.message === 'string' && reply.message ? reply.message : 'That move is not allowed.');
            }
        } catch (error) {
            if (error instanceof RequestError) this.#problem(connection, error.message || 'That move is not allowed.');
        } finally {
            this.moving = false;
        }
    }

    /** Another game against the same computer. */
    async rematch(): Promise<void> {
        const level = this.game?.level;
        if (level === null || level === undefined) return;

        await this.leave();

        if (this.phase === 'lobby') await this.playComputer(level);
    }

    // Behind the scenes

    /** Runs something the visitor asked for, one at a time, and tells them if it fails. */
    async #run(action: (connection: GatewayConnection) => Promise<void>): Promise<void> {
        const connection = this.#connection;
        if (!connection || this.busy) return;

        this.busy = true;
        this.notice = null;
        this.touch();

        try {
            await action(connection);
        } catch (error) {
            this.#failed(connection, error);
        } finally {
            this.busy = false;
        }
    }

    /** Creates a game, in which its creator takes a place at once (the gateway does that). */
    async #open(connection: GatewayConnection, name: string, config: GameConfig): Promise<void> {
        const reply = await connection.request(
            MessageType.REQ_CREATE_GAME,
            { name, config: configToWire(config) },
            [MessageType.RES_CREATE_GAME, MessageType.RES_JOIN_GAME],
        );

        this.#enter(this.#joined(reply));
    }

    async #join(connection: GatewayConnection, id: number): Promise<void> {
        const reply = await connection.request(MessageType.REQ_JOIN_GAME, { game_id: id }, MessageType.RES_JOIN_GAME);

        this.#enter(this.#joined(reply));
    }

    #joined(reply: Record<string, unknown>): Joined {
        const joined = parseJoined(reply);
        if (!joined) throw new Error('The game server sent something unexpected.');

        return joined;
    }

    /** Asks for a computer in the game: null if it comes, otherwise why it does not. */
    async #summon(connection: GatewayConnection, level: number): Promise<string | null> {
        const reply = await connection.request(MessageType.REQ_ADD_COMPUTER, { level }, MessageType.RES_ADD_COMPUTER);

        if (reply.success !== true) {
            return typeof reply.message === 'string' && reply.message ? reply.message : 'The computer could not join the game.';
        }

        if (this.game && connection === this.#connection) {
            this.game = { ...this.game, computer: typeof reply.name === 'string' ? reply.name : 'Computer', level };
        }

        return null;
    }

    #enter(joined: Joined): void {
        const early = this.#early !== null && this.#early.id === joined.room.id ? this.#early : null;

        this.#early = null;
        this.#stopPolling();

        this.phase = 'game';
        this.game = {
            id: joined.room.id,
            name: joined.room.name,
            config: joined.room.config,
            me: joined.me,
            myName: this.name,
            state: early,
            roster: early ? withNames({ [joined.me]: this.name }, early) : { [joined.me]: this.name },
            last: null,
            computer: null,
            level: null,
            problem: null,
        };
    }

    #received(connection: GatewayConnection, message: Message): void {
        if (connection !== this.#connection) return;

        if (message.type === MessageType.GAME_STATE_UPDATE) {
            const state = parseGameState(message.payload);
            if (state) this.#apply(state);
        } else if (message.type === MessageType.ERROR) {
            const { text } = parseError(message.payload);
            if (text) this.notice = { tone: 'error', text };
        }
    }

    #apply(state: GameState): void {
        const game = this.game;

        // The game is not known yet: the answer to the request that tells which one it is has not been read
        if (!game || game.id !== state.id) {
            this.#early = state;
            return;
        }

        this.game = {
            ...game,
            state,
            roster: withNames(game.roster, state),
            last: lastMove(game.state?.board ?? null, state.board) ?? game.last,
            problem: null,
        };
    }

    #problem(connection: GatewayConnection, text: string): void {
        if (connection === this.#connection && this.game) this.game = { ...this.game, problem: text };
    }

    #failed(connection: GatewayConnection, error: unknown): void {
        // A connection that ended has told the visitor itself (see #closed)
        if (error instanceof ConnectionClosed || connection !== this.#connection) return;

        this.notice = {
            tone: 'error',
            text: error instanceof RequestError ? explain(error) : 'Something went wrong. Please try again.',
        };
    }

    #closed(connection: GatewayConnection, info: CloseInfo): void {
        // Not the connection in use: it was dropped on purpose
        if (connection !== this.#connection) return;

        this.#hangUp();

        this.notice = {
            tone: info.opened && info.code === 1000 ? 'info' : 'error',
            text: describeClose(info.code, info.reason, info.opened),
        };
    }

    async #loadLevels(connection: GatewayConnection): Promise<void> {
        let levels: Levels;

        try {
            levels = parseLevels(await connection.request(MessageType.REQ_COMPUTER_LEVELS, {}, MessageType.RES_COMPUTER_LEVELS));
        } catch {
            // A gateway that does not know about computers answers with an error
            levels = { available: false, levels: [] };
        }

        if (connection !== this.#connection) return;

        this.levels = levels;

        if (levels.levels.length > 0 && !levels.levels.some((candidate) => candidate.level === this.level)) {
            this.level = levels.levels[Math.floor(levels.levels.length / 2)].level;
        }
    }

    #tick(): void {
        if (this.phase !== 'lobby') return;

        // Nobody is looking: no need to keep up with the rooms
        if (typeof document !== 'undefined' && document.hidden) return;

        if (Date.now() - this.#activity > IDLE_LIMIT) {
            this.disconnect({ tone: 'info', text: 'You were disconnected after a while without activity.' });
            return;
        }

        void this.refreshRooms();
    }

    #stopPolling(): void {
        clearInterval(this.#timer);
        this.#timer = undefined;
    }

    /** Drops the connection and everything that depended on it, without a word. */
    #hangUp(): void {
        this.#stopPolling();

        const connection = this.#connection;
        this.#connection = null;
        connection?.close();

        this.phase = 'idle';
        this.game = null;
        this.rooms = [];
        this.roomsLoaded = false;
        this.levels = null;
        this.busy = false;
        this.moving = false;
        this.#early = null;
    }
}

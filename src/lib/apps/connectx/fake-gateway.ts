// A stand-in for the gateway and the game server behind it, for the tests: it answers the way they do
// (see network/gateway/README.md), without any network. Messages travel on microtasks, in order, like on a real connection.

import { emptyBoard, isColumnFull, winningLine } from './board';
import { CLASSIC } from './config';
import type { SocketFactory, SocketLike } from './connection';
import {
    ErrorCode,
    GameStatus,
    MessageType,
    configToWire,
    parseConfig,
    parseMessage,
    type GameConfig,
    type Message,
    type Payload,
} from './protocol';

interface Seat {
    player: number;
    name: string;
    /** The browser that holds the seat; null for somebody who is not a browser of the test (a computer, another visitor). */
    socket: FakeSocket | null;
    computer: boolean;
}

export interface FakeGame {
    id: number;
    name: string;
    config: GameConfig;
    seats: Seat[];
    board: number[][];
    current: number;
    status: GameStatus;
    winner: number | null;
}

type Handler<T> = ((this: WebSocket, event: T) => unknown) | null;

function fire<T>(handler: Handler<T>, event: unknown): void {
    handler?.call(undefined as unknown as WebSocket, event as T);
}

export class FakeSocket implements SocketLike {
    readyState = 0;
    onopen: Handler<Event> = null;
    onmessage: Handler<MessageEvent> = null;
    onclose: Handler<CloseEvent> = null;
    onerror: Handler<Event> = null;

    /** What the page has sent. */
    sent: Message[] = [];
    name = '';

    constructor(
        readonly url: string,
        private readonly server: FakeServer,
    ) {
        queueMicrotask(() => {
            if (this.readyState !== 0) return;

            if (!server.reachable) {
                this.readyState = 3;
                fire(this.onerror, {});
                fire(this.onclose, { code: 1006, reason: '' });
                return;
            }

            this.readyState = 1;
            fire(this.onopen, {});
        });
    }

    send(data: string): void {
        const message = parseMessage(data);
        if (!message) return;

        this.sent.push(message);
        queueMicrotask(() => {
            if (this.readyState === 1) this.server.handle(this, message);
        });
    }

    close(code = 1000, reason = ''): void {
        if (this.readyState >= 2) return;

        this.readyState = 3;
        queueMicrotask(() => {
            this.server.left(this);
            fire(this.onclose, { code, reason });
        });
    }

    /** What the server says. */
    deliver(type: number, payload: Payload = {}): void {
        queueMicrotask(() => {
            if (this.readyState === 1) fire(this.onmessage, { data: JSON.stringify({ type, payload }) });
        });
    }

    /** The server hangs up. */
    hangUp(code: number, reason = ''): void {
        queueMicrotask(() => {
            if (this.readyState >= 2) return;

            this.readyState = 3;
            this.server.left(this);
            fire(this.onclose, { code, reason });
        });
    }

    /** Of what the page has sent, the messages of a type. */
    sentOf(type: number): Message[] {
        return this.sent.filter((message) => message.type === type);
    }
}

const LEVELS = [
    { level: 1, name: 'Beginner', summary: 'Sees only the next move.' },
    { level: 2, name: 'Easy', summary: 'Thinks four moves ahead.' },
    { level: 3, name: 'Medium', summary: 'Thinks eight moves ahead.' },
];

export class FakeServer {
    /** Whether browsers can connect at all. */
    reachable = true;
    /** Whether there are computers to play against. */
    computers = true;
    /** Say nothing to requests of this type (to see what a page does when nobody answers). */
    mute = new Set<number>();

    sockets: FakeSocket[] = [];
    games: FakeGame[] = [];

    #nextGame = 1;

    readonly factory: SocketFactory = (url) => {
        const socket = new FakeSocket(url, this);
        this.sockets.push(socket);
        return socket;
    };

    // What the tests do to the server

    /** A room opened by somebody else, waiting for a second player. */
    addRoom(name: string, config: GameConfig = CLASSIC, creator = 'Ada'): FakeGame {
        const game = this.#create(name, config);
        game.seats.push({ player: 1, name: creator, socket: null, computer: false });

        return game;
    }

    /** A move of a player who is not one of the browsers of the test. */
    play(game: FakeGame, player: number, column: number): void {
        this.#drop(game, player, column);
        this.#broadcast(game);
        this.#computerTurn(game);
    }

    /** A player who is not one of the browsers of the test leaves. */
    leave(game: FakeGame, player: number): void {
        game.seats = game.seats.filter((seat) => seat.player !== player);
        this.#broadcast(game);
    }

    // What the browsers ask

    handle(socket: FakeSocket, message: Message): void {
        if (this.mute.has(message.type)) return;

        const { type, payload } = message;

        switch (type) {
            case MessageType.REQ_CONNECT:
                socket.name = typeof payload.player_name === 'string' ? payload.player_name : '';
                socket.deliver(MessageType.RES_CONNECT, { success: true, session_token: '', message: 'Connected successfully' });
                break;

            case MessageType.REQ_LIST_GAMES:
                socket.deliver(MessageType.RES_LIST_GAMES, {
                    games: this.games.map((game) => ({ ...this.#info(game), game_name: game.name })),
                });
                break;

            case MessageType.REQ_CREATE_GAME:
                this.#handleCreate(socket, payload);
                break;

            case MessageType.REQ_JOIN_GAME:
                this.#handleJoin(socket, typeof payload.game_id === 'number' ? payload.game_id : -1);
                break;

            case MessageType.MAKE_MOVE:
                this.#handleMove(socket, typeof payload.column === 'number' ? payload.column : -1);
                break;

            case MessageType.REQ_COMPUTER_LEVELS:
                socket.deliver(MessageType.RES_COMPUTER_LEVELS, { available: this.computers, levels: this.computers ? LEVELS : [] });
                break;

            case MessageType.REQ_ADD_COMPUTER:
                this.#handleComputer(socket, typeof payload.level === 'number' ? payload.level : -1);
                break;

            default:
                this.#error(socket, ErrorCode.INVALID_MESSAGE, 'Unknown message type');
        }
    }

    /** A browser has gone: it leaves its game. */
    left(socket: FakeSocket): void {
        for (const game of [...this.games]) {
            if (!game.seats.some((seat) => seat.socket === socket)) continue;

            game.seats = game.seats.filter((seat) => seat.socket !== socket);

            // The gateway takes the computer away together with the visitor it was playing
            if (game.seats.every((seat) => seat.computer)) game.seats = [];

            if (game.seats.length === 0) this.games = this.games.filter((candidate) => candidate !== game);
            else this.#broadcast(game);
        }
    }

    // How the server works

    #create(name: string, config: GameConfig): FakeGame {
        const game: FakeGame = {
            id: this.#nextGame++,
            name,
            config,
            seats: [],
            board: emptyBoard(config.rows, config.cols),
            current: 1,
            status: GameStatus.NOT_STARTED,
            winner: null,
        };

        this.games.push(game);
        return game;
    }

    #info(game: FakeGame): Payload {
        return {
            game_id: game.id,
            name: game.name,
            current_players: game.seats.length,
            status: game.status,
            config: configToWire(game.config),
        };
    }

    #state(game: FakeGame): Payload {
        const seats = [...game.seats].sort((a, b) => a.player - b.player);

        return {
            game_id: game.id,
            board: game.board,
            rows: game.config.rows,
            cols: game.config.cols,
            current_player: game.current,
            status: game.status,
            winner: game.winner,
            players: seats.map((seat) => seat.player),
            player_names: seats.map((seat) => seat.name),
        };
    }

    #broadcast(game: FakeGame): void {
        for (const seat of game.seats) seat.socket?.deliver(MessageType.GAME_STATE_UPDATE, this.#state(game));
    }

    #error(socket: FakeSocket, code: number, text: string): void {
        socket.deliver(MessageType.ERROR, { error_code: code, error_message: text });
    }

    /** Puts somebody in a game, who starts it if it is the last one. Returns the number of the player. */
    #seat(game: FakeGame, seat: Omit<Seat, 'player'>): number {
        let player = 1;
        while (game.seats.some((taken) => taken.player === player)) player++;

        game.seats.push({ ...seat, player });

        if (game.seats.length === game.config.players) game.status = GameStatus.IN_PROGRESS;

        return player;
    }

    #handleCreate(socket: FakeSocket, payload: Payload): void {
        const name = typeof payload.name === 'string' ? payload.name : '';
        const config = parseConfig(payload.config);

        if (!config) return this.#error(socket, ErrorCode.INVALID_MESSAGE, 'Invalid game configuration');

        if (name !== '' && this.games.some((game) => game.name === name))
            return this.#error(socket, ErrorCode.INVALID_MESSAGE, 'Game name already exists');

        if (this.games.some((game) => game.seats.some((seat) => seat.socket === socket)))
            return this.#error(socket, ErrorCode.ALREADY_IN_GAME, 'You are already in a game');

        const game = this.#create(name, config);
        socket.deliver(MessageType.RES_CREATE_GAME, { success: true, game_info: this.#info(game), message: 'Game created successfully' });

        // Like the gateway, the creator takes a place at once
        const player = this.#seat(game, { name: socket.name, socket, computer: false });
        socket.deliver(MessageType.RES_JOIN_GAME, { success: true, assigned_player_id: player, game_info: this.#info(game), message: 'Joined' });
        this.#broadcast(game);
    }

    #handleJoin(socket: FakeSocket, id: number): void {
        if (this.games.some((game) => game.seats.some((seat) => seat.socket === socket)))
            return this.#error(socket, ErrorCode.ALREADY_IN_GAME, 'You are already in a game');

        let game: FakeGame | undefined;

        if (id === 0) {
            game = this.games.find((candidate) => candidate.name === '' && candidate.status === GameStatus.NOT_STARTED);
            game ??= this.#create('', CLASSIC);
        } else {
            game = this.games.find((candidate) => candidate.id === id);
            if (!game) return this.#error(socket, ErrorCode.GAME_NOT_FOUND, 'Game not found');
        }

        if (game.seats.length >= game.config.players) return this.#error(socket, ErrorCode.GAME_FULL, 'Game is full');
        if (game.status !== GameStatus.NOT_STARTED) return this.#error(socket, ErrorCode.GAME_ALREADY_STARTED, 'Game already started');

        const player = this.#seat(game, { name: socket.name, socket, computer: false });
        socket.deliver(MessageType.RES_JOIN_GAME, { success: true, assigned_player_id: player, game_info: this.#info(game), message: 'Joined' });
        this.#broadcast(game);
    }

    #handleMove(socket: FakeSocket, column: number): void {
        const game = this.games.find((candidate) => candidate.seats.some((seat) => seat.socket === socket));
        const seat = game?.seats.find((candidate) => candidate.socket === socket);

        if (!game || !seat) return this.#error(socket, ErrorCode.GAME_NOT_FOUND, 'Game not found');
        if (game.status !== GameStatus.IN_PROGRESS) return this.#error(socket, ErrorCode.GAME_ALREADY_OVER, 'Game is over');
        if (game.current !== seat.player) return this.#error(socket, ErrorCode.NOT_YOUR_TURN, 'Not your turn');

        if (!this.#drop(game, seat.player, column)) {
            socket.deliver(MessageType.MOVE_RESULT, { success: false, message: 'Invalid move (column full or out of range)' });
            return;
        }

        socket.deliver(MessageType.MOVE_RESULT, { success: true, message: 'Move successful' });
        this.#broadcast(game);
        this.#computerTurn(game);
    }

    #handleComputer(socket: FakeSocket, level: number): void {
        const game = this.games.find((candidate) => candidate.seats.some((seat) => seat.socket === socket));
        const chosen = LEVELS.find((candidate) => candidate.level === level);

        const refuse = (message: string) => socket.deliver(MessageType.RES_ADD_COMPUTER, { success: false, message, name: '' });

        if (!this.computers) return refuse('The computer is not available on this server');
        if (!game) return refuse('Open a game first');
        if (game.config.players !== 2) return refuse('The computer plays two-player games only');
        if (!chosen) return refuse('There is no such level');

        const name = `Computer (${chosen.name})`;
        this.#seat(game, { name, socket: null, computer: true });

        socket.deliver(MessageType.RES_ADD_COMPUTER, { success: true, message: 'The computer is joining the game', name });
        this.#broadcast(game);
        this.#computerTurn(game);
    }

    /** Drops a disc for a player, and ends the game if that wins it or fills the board. */
    #drop(game: FakeGame, player: number, column: number): boolean {
        if (game.status !== GameStatus.IN_PROGRESS || column < 0 || column >= game.config.cols || isColumnFull(game.board, column)) return false;

        let row = game.config.rows - 1;
        while (game.board[row][column] !== 0) row--;
        game.board[row][column] = player;

        if (winningLine(game.board, game.config.connect, player).length > 0) {
            game.status = GameStatus.FINISHED_WIN;
            game.winner = player;
        } else if (game.board[0].every((cell) => cell !== 0)) {
            game.status = GameStatus.FINISHED_DRAW;
        } else {
            game.current = (game.current % game.config.players) + 1;
        }

        if (game.status !== GameStatus.IN_PROGRESS) this.#dismissComputers(game);

        return true;
    }

    /** The computer plays one game and goes: it leaves as soon as the game is over. */
    #dismissComputers(game: FakeGame): void {
        queueMicrotask(() => {
            if (!game.seats.some((seat) => seat.computer)) return;

            game.seats = game.seats.filter((seat) => !seat.computer);
            this.#broadcast(game);
        });
    }

    /** The computer plays in the first column that is not full. */
    #computerTurn(game: FakeGame): void {
        const seat = game.seats.find((candidate) => candidate.player === game.current && candidate.computer);
        if (!seat || game.status !== GameStatus.IN_PROGRESS) return;

        queueMicrotask(() => {
            const column = game.board[0].findIndex((cell) => cell === 0);

            if (column >= 0 && this.#drop(game, seat.player, column)) {
                this.#broadcast(game);
                this.#computerTurn(game);
            }
        });
    }
}


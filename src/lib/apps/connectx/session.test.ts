import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLASSIC } from './config';
import { FakeServer } from './fake-gateway';
import { canMove, seats, summarize } from './game';
import { GameStatus, MessageType } from './protocol';
import { ConnectXSession } from './session.svelte';

const URL = 'ws://gateway.test/connectx/ws';

/** Lets the messages that are on their way arrive, and what they set off happen. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

function visitor(server: FakeServer): ConnectXSession {
    return new ConnectXSession(URL, server.factory);
}

/** A visitor who is in the lobby. */
async function inLobby(server = new FakeServer(), name = 'Zoe') {
    const session = visitor(server);

    await session.connect(name);
    await settle();

    return { server, session, socket: server.sockets[server.sockets.length - 1] };
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('connecting', () => {
    it('opens the lobby, with the rooms and the computers', async () => {
        const server = new FakeServer();
        server.addRoom('Duel');

        const session = visitor(server);
        const connecting = session.connect('Zoe');

        expect(session.phase).toBe('connecting');
        expect(await connecting).toBe(true);
        expect(session.phase).toBe('lobby');

        await settle();

        expect(session.name).toBe('Zoe');
        expect(session.roomsLoaded).toBe(true);
        expect(session.rooms.map((room) => room.name)).toEqual(['Duel']);
        expect(session.levels?.available).toBe(true);
        expect(session.levels?.levels).toHaveLength(3);
    });

    it('introduces the visitor to the server by name', async () => {
        const { socket } = await inLobby(new FakeServer(), '  Zoe  ');

        expect(socket.sentOf(MessageType.REQ_CONNECT)[0].payload).toEqual({ player_name: 'Zoe', protocol_version: 1 });
    });

    it('calls a visitor without a name Guest', async () => {
        const { session } = await inLobby(new FakeServer(), '   ');

        expect(session.name).toBe('Guest');
    });

    it('tells the visitor when the gateway cannot be reached', async () => {
        const server = new FakeServer();
        server.reachable = false;

        const session = visitor(server);

        expect(await session.connect('Zoe')).toBe(false);
        expect(session.phase).toBe('idle');
        expect(session.notice).toMatchObject({ tone: 'error' });
        expect(session.notice?.text).toMatch(/cannot reach the game server/i);
    });

    it('tells the visitor when there is no address to connect to', async () => {
        const session = new ConnectXSession(null);

        expect(await session.connect('Zoe')).toBe(false);
        expect(session.notice?.text).toMatch(/not set up/i);
    });

    it('is not possible to see the computers on a gateway that does not know them', async () => {
        const server = new FakeServer();
        server.computers = false;

        const { session } = await inLobby(server);

        expect(session.levels).toEqual({ available: false, levels: [] });
    });

    it('starts again from the beginning when connecting a second time', async () => {
        const { server, session } = await inLobby();

        await session.connect('Zoe');
        await settle();

        expect(server.sockets).toHaveLength(2);
        expect(server.sockets[0].readyState).toBe(3);
        expect(session.phase).toBe('lobby');
    });
});

describe('the lobby', () => {
    it('asks for the rooms again every few seconds', async () => {
        vi.useFakeTimers();

        const server = new FakeServer();
        const session = visitor(server);

        await session.connect('Zoe');
        await vi.advanceTimersByTimeAsync(0);

        const socket = server.sockets[0];
        expect(socket.sentOf(MessageType.REQ_LIST_GAMES)).toHaveLength(1);

        server.addRoom('Late');
        session.touch();
        await vi.advanceTimersByTimeAsync(4_000);

        expect(socket.sentOf(MessageType.REQ_LIST_GAMES)).toHaveLength(2);
        expect(session.rooms.map((room) => room.name)).toEqual(['Late']);

        session.dispose();
    });

    it('does not bother while nobody is looking', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('document', { hidden: true });

        const server = new FakeServer();
        const session = visitor(server);

        await session.connect('Zoe');
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(20_000);

        expect(server.sockets[0].sentOf(MessageType.REQ_LIST_GAMES)).toHaveLength(1);

        session.dispose();
    });

    it('sends away a visitor who does nothing for a long time', async () => {
        vi.useFakeTimers();

        const server = new FakeServer();
        const session = visitor(server);

        await session.connect('Zoe');
        await vi.advanceTimersByTimeAsync(9 * 60_000);

        expect(session.phase).toBe('lobby');

        await vi.advanceTimersByTimeAsync(2 * 60_000);

        expect(session.phase).toBe('idle');
        expect(session.notice).toMatchObject({ tone: 'info' });
        expect(session.notice?.text).toMatch(/without activity/);
        expect(server.sockets[0].readyState).toBe(3);
    });

    it('keeps a visitor who is doing something', async () => {
        vi.useFakeTimers();

        const server = new FakeServer();
        const session = visitor(server);

        await session.connect('Zoe');

        for (let minute = 0; minute < 15; minute++) {
            session.touch();
            await vi.advanceTimersByTimeAsync(60_000);
        }

        expect(session.phase).toBe('lobby');

        session.dispose();
    });

    it('closes when the visitor leaves', async () => {
        const { server, session } = await inLobby();

        session.disconnect({ tone: 'info', text: 'Bye' });

        expect(session.phase).toBe('idle');
        expect(session.notice?.text).toBe('Bye');
        expect(session.rooms).toEqual([]);
        expect(server.sockets[0].readyState).toBe(3);
    });
});

describe('opening a room', () => {
    it('puts the visitor in it, waiting for the others', async () => {
        const { server, session } = await inLobby();

        await session.createRoom('Duel', CLASSIC);

        expect(session.phase).toBe('game');
        expect(session.game).toMatchObject({ name: 'Duel', me: 1, myName: 'Zoe', config: CLASSIC });
        expect(session.game?.state?.status).toBe(GameStatus.NOT_STARTED);
        expect(summarize(session.game!).tone).toBe('waiting');
        expect(server.games.map((game) => game.name)).toEqual(['Duel']);
        expect(session.busy).toBe(false);
    });

    it('is not possible with a name that is taken', async () => {
        const server = new FakeServer();
        server.addRoom('Duel');

        const { session } = await inLobby(server);
        await session.createRoom('Duel', CLASSIC);

        expect(session.phase).toBe('lobby');
        expect(session.notice?.text).toMatch(/already exists/);
    });

    it('is not possible for a game that cannot be played', async () => {
        const { session, socket } = await inLobby();

        await session.createRoom('Odd', { rows: 3, cols: 7, players: 2, connect: 4 });

        expect(session.phase).toBe('lobby');
        expect(session.notice?.text).toMatch(/between 4 and 20/);
        expect(socket.sentOf(MessageType.REQ_CREATE_GAME)).toHaveLength(0);
    });

    it('does as it is told only once at a time', async () => {
        const { server, session } = await inLobby();

        await Promise.all([session.createRoom('One', CLASSIC), session.createRoom('Two', CLASSIC)]);

        expect(server.games).toHaveLength(1);
    });

    it('is a game where friends can come, with a place for everybody', async () => {
        const { session } = await inLobby();

        await session.createRoom('Trio', { rows: 7, cols: 9, players: 3, connect: 4 });

        expect(summarize(session.game!).headline).toBe('Waiting for 2 more players…');
    });
});

describe('joining a room', () => {
    it('starts the game, with the other player on the move', async () => {
        const server = new FakeServer();
        const duel = server.addRoom('Duel');

        const { session } = await inLobby(server);
        await session.joinRoom(session.rooms[0]);

        expect(session.phase).toBe('game');
        expect(session.game).toMatchObject({ id: duel.id, name: 'Duel', me: 2 });
        expect(session.game?.state?.status).toBe(GameStatus.IN_PROGRESS);
        expect(session.game?.state?.names).toEqual(['Ada', 'Zoe']);
        expect(canMove(session.game!)).toBe(false);
        expect(summarize(session.game!).headline).toBe("Ada's turn");
    });

    it('does not happen when the room is taken meanwhile', async () => {
        const server = new FakeServer();
        const duel = server.addRoom('Duel');

        const { session } = await inLobby(server);
        const room = session.rooms[0];

        // Somebody else was quicker
        server.addRoom('Other');
        duel.seats.push({ player: 2, name: 'Eve', socket: null, computer: false });

        await session.joinRoom(room);

        expect(session.phase).toBe('lobby');
        expect(session.notice?.text).toBe('That game is already full.');
    });

    it('does not happen when the room is gone', async () => {
        const server = new FakeServer();
        const duel = server.addRoom('Duel');

        const { session } = await inLobby(server);
        const room = session.rooms[0];

        server.games = server.games.filter((game) => game !== duel);
        await session.joinRoom(room);

        expect(session.notice?.text).toMatch(/does not exist/);
    });

    it('can be done by name, as an invitation says', async () => {
        const server = new FakeServer();
        server.addRoom('Other');
        server.addRoom('Duel');

        const { session } = await inLobby(server);
        await session.joinNamed('Duel');

        expect(session.phase).toBe('game');
        expect(session.game?.name).toBe('Duel');
    });

    it('is said to be impossible by name when the room is not there any more', async () => {
        const { session } = await inLobby();

        await session.joinNamed('Gone');

        expect(session.phase).toBe('lobby');
        expect(session.notice).toMatchObject({ tone: 'info' });
        expect(session.notice?.text).toMatch(/“Gone” is not open any more/);
    });

    it('is not done by name when the room is full', async () => {
        const server = new FakeServer();
        const duel = server.addRoom('Duel');
        duel.seats.push({ player: 2, name: 'Eve', socket: null, computer: false });
        duel.status = GameStatus.IN_PROGRESS;

        const { session } = await inLobby(server);
        await session.joinNamed('Duel');

        expect(session.phase).toBe('lobby');
    });
});

describe('the quick match', () => {
    it('opens a game when there is none to join, and waits in it', async () => {
        const { server, session } = await inLobby();

        await session.quickMatch();

        expect(session.phase).toBe('game');
        expect(session.game?.name).toBe('');
        expect(server.games).toHaveLength(1);
        expect(summarize(session.game!).tone).toBe('waiting');
    });

    it('brings two visitors together', async () => {
        const server = new FakeServer();
        const first = (await inLobby(server, 'Ann')).session;
        const second = (await inLobby(server, 'Ben')).session;

        await first.quickMatch();
        await second.quickMatch();
        await settle();

        expect(first.game?.id).toBe(second.game?.id);
        expect(first.game?.state?.names).toEqual(['Ann', 'Ben']);
        expect(first.game?.me).toBe(1);
        expect(second.game?.me).toBe(2);
        expect(canMove(first.game!)).toBe(true);
        expect(canMove(second.game!)).toBe(false);
    });
});

describe('playing', () => {
    async function inDuel() {
        const server = new FakeServer();
        const duel = server.addRoom('Duel');

        const { session } = await inLobby(server);
        await session.joinRoom(session.rooms[0]);

        return { server, duel, session, socket: server.sockets[0] };
    }

    it('follows the moves of the opponent, and points the last one out', async () => {
        const { server, duel, session } = await inDuel();

        server.play(duel, 1, 3);
        await settle();

        expect(session.game?.state?.board[5][3]).toBe(1);
        expect(session.game?.last).toEqual({ row: 5, col: 3 });
        expect(canMove(session.game!)).toBe(true);
        expect(summarize(session.game!).headline).toBe('Your turn');
    });

    it('drops a disc in the column', async () => {
        const { server, duel, session } = await inDuel();

        server.play(duel, 1, 3);
        await settle();
        await session.move(2);
        await settle();

        expect(session.game?.state?.board[5][2]).toBe(2);
        expect(session.game?.last).toEqual({ row: 5, col: 2 });
        expect(session.game?.problem).toBeNull();
        expect(session.moving).toBe(false);
        expect(canMove(session.game!)).toBe(false);
    });

    it('does not even ask when it is not the turn of the visitor', async () => {
        const { session, socket } = await inDuel();

        await session.move(2);

        expect(socket.sentOf(MessageType.MAKE_MOVE)).toHaveLength(0);
    });

    it('tells when a column is full', async () => {
        const { server, duel, session } = await inDuel();

        server.play(duel, 1, 0);
        await settle();

        for (let row = 0; row < 6; row++) duel.board[row][0] = 1;

        await session.move(0);

        expect(session.game?.problem).toMatch(/column full/);
    });

    it('tells when the server says that it is not the turn', async () => {
        const { server, duel, session, socket } = await inDuel();

        server.play(duel, 1, 3);
        await settle();

        // The server believes it is somebody else's turn (the state of the page is a moment behind)
        duel.current = 1;
        await session.move(2);

        expect(socket.sentOf(MessageType.MAKE_MOVE)).toHaveLength(1);
        expect(session.game?.problem).toBe('Not your turn');
    });

    it('takes the end of the game: the winner, and the line', async () => {
        const { server, duel, session } = await inDuel();

        // Ada plays across, Zoe plays in the next column up: Ada wins on her fourth move
        for (const column of [0, 1, 2]) {
            server.play(duel, 1, column);
            await settle();
            await session.move(column);
            await settle();
        }

        server.play(duel, 1, 3);
        await settle();

        expect(session.game?.state?.status).toBe(GameStatus.FINISHED_WIN);
        expect(session.game?.state?.winner).toBe(1);
        expect(summarize(session.game!)).toMatchObject({ tone: 'lost', headline: 'Ada won' });
        expect(canMove(session.game!)).toBe(false);
    });

    it('knows when the other players have left', async () => {
        const { server, duel, session } = await inDuel();

        server.leave(duel, 1);
        await settle();

        expect(summarize(session.game!).tone).toBe('alone');
        expect(canMove(session.game!)).toBe(false);
    });

    it('goes back to the start when the connection is lost', async () => {
        const { session, socket } = await inDuel();

        socket.hangUp(1011, 'The game server closed the connection');
        await settle();

        expect(session.phase).toBe('idle');
        expect(session.game).toBeNull();
        expect(session.notice).toMatchObject({ tone: 'error' });
        expect(session.notice?.text).toMatch(/game server closed/i);
    });

    it('is left by hanging up, which is what lets the others know', async () => {
        const { server, duel, session } = await inDuel();

        await session.leave();
        await settle();

        expect(session.phase).toBe('lobby');
        expect(session.game).toBeNull();
        expect(server.sockets).toHaveLength(2);
        expect(duel.seats.map((seat) => seat.name)).toEqual(['Ada']);
    });

    it('is left with a message, if there is one to give', async () => {
        const { session } = await inDuel();

        await session.leave({ tone: 'info', text: 'See you' });

        expect(session.phase).toBe('lobby');
        expect(session.notice?.text).toBe('See you');
    });
});

describe('playing against the computer', () => {
    it('is a classic game, in which the computer is the opponent', async () => {
        const { session } = await inLobby();

        await session.playComputer(2);
        await settle();

        expect(session.phase).toBe('game');
        expect(session.game).toMatchObject({ computer: 'Computer (Easy)', level: 2, config: CLASSIC });
        expect(session.game?.state?.status).toBe(GameStatus.IN_PROGRESS);
        expect(session.game?.state?.names).toEqual(['Zoe', 'Computer (Easy)']);
        expect(canMove(session.game!)).toBe(true);
    });

    it('uses the level that was chosen, unless told otherwise', async () => {
        const { session, socket } = await inLobby();

        session.level = 1;
        await session.playComputer();

        expect(socket.sentOf(MessageType.REQ_ADD_COMPUTER)[0].payload).toEqual({ level: 1 });
    });

    it('answers every move', async () => {
        const { session } = await inLobby();

        await session.playComputer(3);
        await settle();
        await session.move(3);
        await settle();

        const board = session.game!.state!.board;
        const discs = board.flat().filter((cell) => cell !== 0);

        expect(discs).toHaveLength(2);
        expect(board[5][3]).toBe(1);
        expect(board[5][0]).toBe(2);
        expect(canMove(session.game!)).toBe(true);
    });

    it('ends with the name of the computer, which has gone by then', async () => {
        const { server, session } = await inLobby();

        await session.playComputer(2);
        await settle();

        // The computer plays in the first free column from the left: it wins along the bottom row
        for (const column of [6, 5, 6, 5]) {
            await session.move(column);
            await settle();
        }

        expect(server.games[0].seats.some((seat) => seat.computer)).toBe(false);
        expect(session.game?.state?.status).toBe(GameStatus.FINISHED_WIN);
        expect(summarize(session.game!)).toMatchObject({ tone: 'lost', headline: 'Computer (Easy) won' });
        expect(seats(session.game!).map((seat) => [seat.name, seat.presence])).toEqual([
            ['Zoe', 'here'],
            ['Computer (Easy)', 'here'],
        ]);
    });

    it('goes back to the lobby with the reason, if there is no computer', async () => {
        const server = new FakeServer();
        server.computers = false;

        const { session } = await inLobby(server);
        await session.playComputer(2);
        await settle();

        expect(session.phase).toBe('lobby');
        expect(session.game).toBeNull();
        expect(session.notice).toMatchObject({ tone: 'error', text: 'The computer is not available on this server' });
        expect(server.sockets).toHaveLength(2);
        expect(server.games).toHaveLength(0);
    });

    it('can be asked for in a room, while waiting', async () => {
        const { session } = await inLobby();

        await session.createRoom('Mine', CLASSIC);
        await session.addComputer(3);
        await settle();

        expect(session.game?.computer).toBe('Computer (Medium)');
        expect(session.game?.state?.status).toBe(GameStatus.IN_PROGRESS);
    });

    it('is refused in a game for more players, and the visitor stays', async () => {
        const { session } = await inLobby();

        await session.createRoom('Trio', { rows: 7, cols: 9, players: 3, connect: 4 });
        await session.addComputer(3);

        expect(session.phase).toBe('game');
        expect(session.notice?.text).toBe('The computer plays two-player games only');
        expect(session.game?.computer).toBeNull();
    });

    it('can be played again, against the same level', async () => {
        const { server, session } = await inLobby();

        await session.playComputer(1);
        await settle();
        await session.rematch();
        await settle();

        expect(session.phase).toBe('game');
        expect(session.game).toMatchObject({ computer: 'Computer (Beginner)', level: 1 });
        expect(server.sockets).toHaveLength(2);
        expect(server.games).toHaveLength(1);
    });

    it('cannot be played again when it was not a game against the computer', async () => {
        const { server, session } = await inLobby();

        await session.createRoom('Mine', CLASSIC);
        await session.rematch();

        expect(session.phase).toBe('game');
        expect(server.sockets).toHaveLength(1);
    });
});

describe('what the server says on its own', () => {
    it('is shown when it is an error', async () => {
        const { session, socket } = await inLobby();

        socket.deliver(MessageType.ERROR, { error_code: 100, error_message: 'The game server is not answering' });
        await settle();

        expect(session.notice).toEqual({ tone: 'error', text: 'The game server is not answering' });
    });
});

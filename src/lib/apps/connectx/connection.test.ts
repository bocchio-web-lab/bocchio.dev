import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionClosed, GatewayConnection, RequestError, type CloseInfo, type SocketLike } from './connection';
import { MessageType, type Message } from './protocol';

/** A socket that does only what the test tells it to. */
class ManualSocket implements SocketLike {
    readyState = 0;
    onopen: SocketLike['onopen'] = null;
    onmessage: SocketLike['onmessage'] = null;
    onclose: SocketLike['onclose'] = null;
    onerror: SocketLike['onerror'] = null;

    sent: Message[] = [];
    closedWith: [number, string] | null = null;

    send(data: string): void {
        this.sent.push(JSON.parse(data));
    }

    close(code = 1005, reason = ''): void {
        this.closedWith = [code, reason];
    }

    // What happens to it

    opens(): void {
        this.readyState = 1;
        this.onopen?.call(undefined as unknown as WebSocket, {} as Event);
    }

    receives(type: number, payload: object = {}): void {
        this.receivesRaw(JSON.stringify({ type, payload }));
    }

    receivesRaw(data: string): void {
        this.onmessage?.call(undefined as unknown as WebSocket, { data } as MessageEvent);
    }

    ends(code: number, reason = ''): void {
        this.readyState = 3;
        this.onclose?.call(undefined as unknown as WebSocket, { code, reason } as CloseEvent);
    }
}

interface Setup {
    socket: ManualSocket;
    connection: GatewayConnection;
    messages: Message[];
    closes: CloseInfo[];
}

function setup(): Setup {
    const socket = new ManualSocket();
    const messages: Message[] = [];
    const closes: CloseInfo[] = [];

    const connection = new GatewayConnection(
        'ws://gateway.test/connectx/ws',
        { onMessage: (message) => messages.push(message), onClose: (info) => closes.push(info) },
        () => socket,
    );

    return { socket, connection, messages, closes };
}

async function opened(): Promise<Setup> {
    const context = setup();
    const opening = context.connection.open();

    context.socket.opens();
    await opening;

    return context;
}

const STATE = { game_id: 1 };

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('opening', () => {
    it('is done when the socket opens', async () => {
        const { socket, connection } = setup();
        const opening = connection.open();

        expect(connection.isOpen).toBe(false);

        socket.opens();
        await opening;

        expect(connection.isOpen).toBe(true);
    });

    it('fails, saying that the gateway was never reached, if the socket closes first', async () => {
        const { socket, connection, closes } = setup();
        const failure = expect(connection.open()).rejects.toMatchObject({ info: { code: 1006, opened: false } });

        socket.ends(1006);
        await failure;

        expect(closes).toEqual([{ code: 1006, reason: '', opened: false }]);
        expect(connection.isOpen).toBe(false);
    });

    it('fails when the page is not allowed to open the address', async () => {
        const closes: CloseInfo[] = [];
        const connection = new GatewayConnection(
            'ws://insecure.test',
            { onMessage: () => {}, onClose: (info) => closes.push(info) },
            () => {
                throw new DOMException('Insecure', 'SecurityError');
            },
        );

        await expect(connection.open()).rejects.toBeInstanceOf(ConnectionClosed);
        expect(closes).toHaveLength(1);
    });

    it('fails, and hangs up, if it takes too long', async () => {
        const { socket, connection, closes } = setup();
        const failure = expect(connection.open()).rejects.toBeInstanceOf(ConnectionClosed);

        await vi.advanceTimersByTimeAsync(10_000);
        await failure;

        expect(socket.closedWith?.[0]).toBe(4000);
        expect(closes).toHaveLength(1);
        expect(closes[0].opened).toBe(false);
    });
});

describe('a request', () => {
    it('is sent and answered', async () => {
        const { socket, connection } = await opened();

        const answer = connection.request(MessageType.REQ_LIST_GAMES, { x: 1 }, MessageType.RES_LIST_GAMES);

        expect(socket.sent).toEqual([{ type: MessageType.REQ_LIST_GAMES, payload: { x: 1 } }]);

        socket.receives(MessageType.RES_LIST_GAMES, { games: [] });

        await expect(answer).resolves.toEqual({ games: [] });
    });

    it('waits for the request before it to be answered', async () => {
        const { socket, connection } = await opened();

        const first = connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES);
        const second = connection.request(MessageType.REQ_COMPUTER_LEVELS, {}, MessageType.RES_COMPUTER_LEVELS);

        expect(socket.sent.map((message) => message.type)).toEqual([MessageType.REQ_LIST_GAMES]);

        socket.receives(MessageType.RES_LIST_GAMES, { n: 1 });
        await first;

        expect(socket.sent.map((message) => message.type)).toEqual([MessageType.REQ_LIST_GAMES, MessageType.REQ_COMPUTER_LEVELS]);

        socket.receives(MessageType.RES_COMPUTER_LEVELS, { n: 2 });
        await expect(second).resolves.toEqual({ n: 2 });
    });

    it('may need several messages, and gets the last', async () => {
        const { socket, connection, messages } = await opened();

        const answer = connection.request(MessageType.REQ_CREATE_GAME, {}, [MessageType.RES_CREATE_GAME, MessageType.RES_JOIN_GAME]);

        socket.receives(MessageType.RES_CREATE_GAME, { step: 1 });
        socket.receives(MessageType.RES_JOIN_GAME, { step: 2 });

        await expect(answer).resolves.toEqual({ step: 2 });
        expect(messages).toEqual([]);
    });

    it('is not completed by the messages of the wrong order', async () => {
        const { socket, connection, messages } = await opened();
        let done = false;

        const answer = connection.request(MessageType.REQ_CREATE_GAME, {}, [MessageType.RES_CREATE_GAME, MessageType.RES_JOIN_GAME]).then(() => (done = true));

        socket.receives(MessageType.RES_JOIN_GAME, { step: 2 });
        await Promise.resolve();

        expect(done).toBe(false);
        expect(messages).toHaveLength(1); // it was somebody else's business

        socket.receives(MessageType.RES_CREATE_GAME);
        socket.receives(MessageType.RES_JOIN_GAME);
        await answer;
    });

    it('fails with the error that the server answers with', async () => {
        const { socket, connection } = await opened();

        const answer = expect(connection.request(MessageType.REQ_JOIN_GAME, {}, MessageType.RES_JOIN_GAME)).rejects.toMatchObject({
            name: 'RequestError',
            code: 201,
            message: 'Game is full',
        });

        socket.receives(MessageType.ERROR, { error_code: 201, error_message: 'Game is full' });
        await answer;
    });

    it('does not stop the ones that follow from being answered after an error', async () => {
        const { socket, connection } = await opened();

        const first = expect(connection.request(MessageType.REQ_JOIN_GAME, {}, MessageType.RES_JOIN_GAME)).rejects.toBeInstanceOf(RequestError);
        const second = connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES);

        socket.receives(MessageType.ERROR, { error_code: 200, error_message: 'Game not found' });
        await first;

        socket.receives(MessageType.RES_LIST_GAMES, { ok: true });
        await expect(second).resolves.toEqual({ ok: true });
    });

    it('fails, and so does the connection, if nobody answers', async () => {
        const { socket, connection, closes } = await opened();

        const first = expect(connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES)).rejects.toMatchObject({ code: 0 });
        const second = expect(connection.request(MessageType.REQ_COMPUTER_LEVELS, {}, MessageType.RES_COMPUTER_LEVELS)).rejects.toBeInstanceOf(ConnectionClosed);

        await vi.advanceTimersByTimeAsync(10_000);
        await first;
        await second;

        expect(socket.closedWith?.[0]).toBe(4000);
        expect(closes).toHaveLength(1);
        expect(connection.isOpen).toBe(false);
    });

    it('may take longer if it has to', async () => {
        const { socket, connection } = await opened();

        const answer = connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES, 60_000);

        await vi.advanceTimersByTimeAsync(30_000);
        socket.receives(MessageType.RES_LIST_GAMES, {});

        await expect(answer).resolves.toEqual({});
        expect(socket.closedWith).toBeNull();
    });

    it('fails at once on a connection that is not open', async () => {
        const { connection } = setup();

        await expect(connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES)).rejects.toBeInstanceOf(ConnectionClosed);
    });
});

describe('the rest of the messages', () => {
    it('go to the handler', async () => {
        const { socket, messages } = await opened();

        socket.receives(MessageType.GAME_STATE_UPDATE, STATE);

        expect(messages).toEqual([{ type: MessageType.GAME_STATE_UPDATE, payload: STATE }]);
    });

    it('go to the handler also while a request waits', async () => {
        const { socket, connection, messages } = await opened();

        const answer = connection.request(MessageType.MAKE_MOVE, {}, MessageType.MOVE_RESULT);

        socket.receives(MessageType.GAME_STATE_UPDATE, STATE);
        socket.receives(MessageType.MOVE_RESULT, { success: true });

        await expect(answer).resolves.toEqual({ success: true });
        expect(messages).toHaveLength(1);
    });

    it('go to the handler when a request is not waiting for them, errors included', async () => {
        const { socket, messages } = await opened();

        socket.receives(MessageType.ERROR, { error_code: 100, error_message: 'The game server is not answering' });

        expect(messages[0].type).toBe(MessageType.ERROR);
    });

    it('are ignored when they make no sense', async () => {
        const { socket, messages } = await opened();

        socket.receivesRaw('not json');
        socket.receivesRaw('{"payload":{}}');
        socket.receivesRaw('[1,2]');

        expect(messages).toEqual([]);
    });
});

describe('sending', () => {
    it('is possible while the connection is open', async () => {
        const { socket, connection } = await opened();

        expect(connection.send(MessageType.HEARTBEAT, { timestamp: 1 })).toBe(true);
        expect(socket.sent).toEqual([{ type: MessageType.HEARTBEAT, payload: { timestamp: 1 } }]);
    });

    it('is not, otherwise', () => {
        const { connection } = setup();

        expect(connection.send(MessageType.HEARTBEAT)).toBe(false);
    });
});

describe('closing', () => {
    it('is told once, with what the gateway said', async () => {
        const { socket, closes } = await opened();

        socket.ends(1008, 'Too many messages');

        expect(closes).toEqual([{ code: 1008, reason: 'Too many messages', opened: true }]);
    });

    it('ends the requests that are waiting', async () => {
        const { socket, connection } = await opened();

        const first = expect(connection.request(MessageType.REQ_LIST_GAMES, {}, MessageType.RES_LIST_GAMES)).rejects.toMatchObject({ info: { code: 1011 } });
        const second = expect(connection.request(MessageType.REQ_COMPUTER_LEVELS, {}, MessageType.RES_COMPUTER_LEVELS)).rejects.toBeInstanceOf(ConnectionClosed);

        socket.ends(1011);

        await first;
        await second;
        expect(connection.isOpen).toBe(false);
    });

    it('is done by the page at once, without waiting for the browser to confirm', async () => {
        const { socket, connection, closes } = await opened();

        connection.close();

        expect(socket.closedWith).toEqual([1000, '']);
        expect(connection.isOpen).toBe(false);
        expect(closes).toEqual([{ code: 1000, reason: '', opened: true }]);

        // …and the confirmation, when it comes, is not told again
        socket.ends(1000);
        expect(closes).toHaveLength(1);
    });

    it('can be asked twice', async () => {
        const { connection, closes } = await opened();

        connection.close();
        connection.close();

        expect(closes).toHaveLength(1);
    });
});

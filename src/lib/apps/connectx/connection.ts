import { MessageType, encodeMessage, parseError, parseMessage, type Message, type Payload } from './protocol';

/** How long the gateway has to answer a request before the connection is given up. */
const REQUEST_TIMEOUT = 10_000;

/** How long to wait for the connection to open. */
const OPEN_TIMEOUT = 10_000;

/** The code of a connection that the page itself closes, because the other side stopped answering. */
const CLOSE_UNRESPONSIVE = 4000;

const OPEN = 1;

/** What the game server (or the gateway) answered to a request with an error message. */
export class RequestError extends Error {
    constructor(
        message: string,
        readonly code: number,
    ) {
        super(message);
        this.name = 'RequestError';
    }
}

/** The connection ended, or was never there. */
export class ConnectionClosed extends Error {
    constructor(readonly info: CloseInfo) {
        super(`The connection closed (${info.code})`);
        this.name = 'ConnectionClosed';
    }
}

export interface CloseInfo {
    code: number;
    reason: string;
    /** Whether the connection had been open: otherwise it is the gateway that could not be reached. */
    opened: boolean;
}

export interface ConnectionHandlers {
    /** Everything that is not the answer to a request: the state of the game, mainly. */
    onMessage: (message: Message) => void;
    /** The connection has ended. Called once, whoever closed it. */
    onClose: (info: CloseInfo) => void;
}

/** The part of a WebSocket that is used here (which makes it easy to replace in tests). */
export type SocketLike = Pick<WebSocket, 'readyState' | 'onopen' | 'onmessage' | 'onclose' | 'onerror' | 'send' | 'close'>;

export type SocketFactory = (url: string) => SocketLike;

interface Pending {
    type: number;
    payload: Payload;
    /** The messages that complete the request, in the order they come. */
    expects: number[];
    received: number;
    timeout: number;
    timer?: ReturnType<typeof setTimeout>;
    resolve: (payload: Payload) => void;
    reject: (reason: Error) => void;
}

/**
 * A connection to the gateway: a WebSocket on which requests are answered one at a time.
 *
 * The game protocol has no request numbers, so the answer to a request is told by its type: the next message
 * of the expected type, or an error. That is why there is never more than one request out: the others wait their turn.
 * Whatever arrives while no request is waiting for it (the state of the game, the opponent's moves) goes to `onMessage`.
 */
export class GatewayConnection {
    #socket: SocketLike | null = null;
    #opened = false;
    #closed = false;
    #queue: Pending[] = [];
    #current: Pending | null = null;
    #openTimer: ReturnType<typeof setTimeout> | undefined;
    #openFailed: ((reason: Error) => void) | null = null;

    constructor(
        readonly url: string,
        private readonly handlers: ConnectionHandlers,
        private readonly createSocket: SocketFactory = (url) => new WebSocket(url),
    ) {}

    get isOpen(): boolean {
        return this.#socket !== null && this.#socket.readyState === OPEN && !this.#closed;
    }

    /** Opens the connection. Rejects with `ConnectionClosed` if it cannot be opened. */
    open(): Promise<void> {
        return new Promise((resolve, reject) => {
            let socket: SocketLike;

            try {
                socket = this.createSocket(this.url);
            } catch {
                // A page that is not allowed to open this address (an insecure one from a secure page) gets here
                this.#finish({ code: 1006, reason: '', opened: false });
                reject(new ConnectionClosed({ code: 1006, reason: '', opened: false }));
                return;
            }

            this.#socket = socket;
            this.#openFailed = reject;
            this.#openTimer = setTimeout(() => this.close(CLOSE_UNRESPONSIVE, 'No answer'), OPEN_TIMEOUT);

            socket.onopen = () => {
                clearTimeout(this.#openTimer);
                this.#opened = true;
                this.#openFailed = null;
                resolve();
            };

            socket.onmessage = (event) => this.#receive(event.data);
            socket.onclose = (event) => this.#finish({ code: event.code, reason: event.reason, opened: this.#opened });

            // An error is always followed by the close event, which is where it is dealt with
            socket.onerror = () => {};
        });
    }

    /** Sends a message that has no answer. */
    send(type: number, payload: Payload = {}): boolean {
        if (!this.isOpen) return false;

        this.#socket!.send(encodeMessage(type, payload));
        return true;
    }

    /**
     * Sends a request and waits for its answer: the payload of the last of the expected messages. A request
     * is also answered by an error message, which makes the promise fail with a `RequestError`.
     */
    request(type: number, payload: Payload, expects: number | number[], timeout = REQUEST_TIMEOUT): Promise<Payload> {
        return new Promise((resolve, reject) => {
            if (!this.isOpen) {
                reject(new ConnectionClosed({ code: 1006, reason: '', opened: this.#opened }));
                return;
            }

            this.#queue.push({ type, payload, expects: [expects].flat(), received: 0, timeout, resolve, reject });
            this.#sendNext();
        });
    }

    /** Hangs up. */
    close(code = 1000, reason = ''): void {
        if (!this.#socket || this.#closed) return;

        try {
            this.#socket.close(code, reason);
        } catch {
            // It is closed already
        }

        // The close event may take a while (or never come, if the network is gone): as far as we are concerned it is over
        this.#finish({ code, reason, opened: this.#opened });
    }

    #sendNext(): void {
        if (this.#current || !this.isOpen) return;

        const pending = this.#queue.shift();
        if (!pending) return;

        this.#current = pending;

        pending.timer = setTimeout(() => {
            // Not knowing whether the answer will ever come, the ones that follow could be mistaken for it
            this.#settle(pending, new RequestError('The game server did not answer in time', 0));
            this.close(CLOSE_UNRESPONSIVE, 'No answer');
        }, pending.timeout);

        this.#socket!.send(encodeMessage(pending.type, pending.payload));
    }

    #receive(data: unknown): void {
        const message = parseMessage(data);
        if (!message) return;

        const pending = this.#current;

        if (pending) {
            if (message.type === MessageType.ERROR) {
                const error = parseError(message.payload);
                this.#settle(pending, new RequestError(error.text, error.code));
                return;
            }

            if (message.type === pending.expects[pending.received]) {
                pending.received++;

                if (pending.received === pending.expects.length) this.#settle(pending, message.payload);
                return;
            }
        }

        this.handlers.onMessage(message);
    }

    /** Ends the request that is waiting, with its answer or with an error, and goes on with the next. */
    #settle(pending: Pending, result: Payload | Error): void {
        if (this.#current !== pending) return;

        clearTimeout(pending.timer);
        this.#current = null;

        if (result instanceof Error) pending.reject(result);
        else pending.resolve(result);

        this.#sendNext();
    }

    #finish(info: CloseInfo): void {
        if (this.#closed) return;
        this.#closed = true;

        clearTimeout(this.#openTimer);
        this.#openFailed?.(new ConnectionClosed(info));
        this.#openFailed = null;

        const waiting = [...(this.#current ? [this.#current] : []), ...this.#queue];
        this.#current = null;
        this.#queue = [];

        for (const pending of waiting) {
            clearTimeout(pending.timer);
            pending.reject(new ConnectionClosed(info));
        }

        this.handlers.onClose(info);
    }
}

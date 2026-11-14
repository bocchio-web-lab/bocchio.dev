import { describe, expect, it } from 'vitest';
import {
    GameStatus,
    MessageType,
    configToWire,
    describeClose,
    encodeMessage,
    parseConfig,
    parseError,
    parseGameState,
    parseJoined,
    parseLevels,
    parseMessage,
    parseRoom,
    parseRooms,
} from './protocol';

const wireConfig = { rows: 6, cols: 7, num_players: 2, connect_length: 4 };

describe('messages', () => {
    it('are an envelope with a type and a payload', () => {
        expect(JSON.parse(encodeMessage(MessageType.MAKE_MOVE, { column: 3 }))).toEqual({ type: 0x10, payload: { column: 3 } });
        expect(JSON.parse(encodeMessage(MessageType.REQ_LIST_GAMES))).toEqual({ type: 0x22, payload: {} });
    });

    it('are read back from text', () => {
        expect(parseMessage('{"type":18,"payload":{"game_id":1}}')).toEqual({ type: 18, payload: { game_id: 1 } });
        expect(parseMessage('{"type":255}')).toEqual({ type: 255, payload: {} });
    });

    it('are refused when they are not what the gateway sends', () => {
        expect(parseMessage('not json')).toBeNull();
        expect(parseMessage('[]')).toBeNull();
        expect(parseMessage('{"payload":{}}')).toBeNull();
        expect(parseMessage('{"type":"18"}')).toBeNull();
        expect(parseMessage('{"type":1.5}')).toBeNull();
        expect(parseMessage(new ArrayBuffer(4))).toBeNull();
        expect(parseMessage(undefined)).toBeNull();
    });
});

describe('game configurations', () => {
    it('go to the server with its names and come back with ours', () => {
        const config = { rows: 6, cols: 9, players: 3, connect: 5 };

        expect(configToWire(config)).toEqual({ rows: 6, cols: 9, num_players: 3, connect_length: 5 });
        expect(parseConfig(configToWire(config))).toEqual(config);
    });

    it('must be complete', () => {
        expect(parseConfig({ rows: 6, cols: 7, num_players: 2 })).toBeNull();
        expect(parseConfig({ ...wireConfig, rows: '6' })).toBeNull();
        expect(parseConfig(null)).toBeNull();
    });
});

describe('rooms', () => {
    it('are read from the lobby list, where the name is called game_name', () => {
        const room = parseRoom({ game_id: 4, game_name: 'Duel', current_players: 1, status: 0, config: wireConfig });

        expect(room).toEqual({ id: 4, name: 'Duel', players: 1, status: GameStatus.NOT_STARTED, config: { rows: 6, cols: 7, players: 2, connect: 4 } });
    });

    it('are read from a join response, where it is called name', () => {
        expect(parseRoom({ game_id: 4, name: 'Duel', current_players: 2, status: 1, config: wireConfig })?.name).toBe('Duel');
    });

    it('may have no name', () => {
        expect(parseRoom({ game_id: 4, game_name: '', current_players: 1, status: 0, config: wireConfig })?.name).toBe('');
        expect(parseRoom({ game_id: 4, current_players: 1, status: 0, config: wireConfig })?.name).toBe('');
    });

    it('are skipped when they make no sense, without spoiling the list', () => {
        const good = { game_id: 1, game_name: 'A', current_players: 1, status: 0, config: wireConfig };

        expect(parseRooms({ games: [good, { game_id: 2 }, 'rubbish', { ...good, status: 9 }, { ...good, game_id: 3 }] }).map((room) => room.id)).toEqual([1, 3]);
        expect(parseRooms({})).toEqual([]);
        expect(parseRooms({ games: 'no' })).toEqual([]);
    });
});

describe('joining a game', () => {
    it('tells which player the visitor is', () => {
        const joined = parseJoined({
            success: true,
            assigned_player_id: 2,
            game_info: { game_id: 7, name: 'Duel', current_players: 2, status: 1, config: wireConfig },
        });

        expect(joined?.me).toBe(2);
        expect(joined?.room.id).toBe(7);
    });

    it('is not understood without its parts', () => {
        expect(parseJoined({ success: true })).toBeNull();
        expect(parseJoined({ assigned_player_id: 1, game_info: {} })).toBeNull();
    });
});

describe('the state of a game', () => {
    const state = {
        game_id: 3,
        board: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 2, 0, 0],
        ],
        rows: 4,
        cols: 4,
        current_player: 1,
        status: 1,
        winner: null,
        players: [1, 2],
        player_names: ['Ada', 'Bob'],
    };

    it('is read as it is', () => {
        const read = parseGameState(state);

        expect(read).toEqual({
            id: 3,
            board: state.board,
            rows: 4,
            cols: 4,
            current: 1,
            status: GameStatus.IN_PROGRESS,
            winner: null,
            players: [1, 2],
            names: ['Ada', 'Bob'],
        });
    });

    it('carries the winner when there is one', () => {
        expect(parseGameState({ ...state, status: 2, winner: 2 })?.winner).toBe(2);
    });

    it('is refused when the board is not the size it says', () => {
        expect(parseGameState({ ...state, rows: 5 })).toBeNull();
        expect(parseGameState({ ...state, cols: 5 })).toBeNull();
        expect(parseGameState({ ...state, board: [[0, 0, 0, 'x'], ...state.board.slice(1)] })).toBeNull();
        expect(parseGameState({ ...state, board: 'empty' })).toBeNull();
    });

    it('is refused without its basics', () => {
        expect(parseGameState({ ...state, game_id: undefined })).toBeNull();
        expect(parseGameState({ ...state, status: 7 })).toBeNull();
    });

    it('can do without the list of players', () => {
        expect(parseGameState({ ...state, players: undefined, player_names: undefined })?.players).toEqual([]);
    });
});

describe('the computers', () => {
    it('are listed with their levels', () => {
        const levels = parseLevels({ available: true, levels: [{ level: 1, name: 'Beginner', summary: 'Sees one move.' }, { level: 2, name: 'Easy', summary: '' }, { name: 'broken' }] });

        expect(levels.available).toBe(true);
        expect(levels.levels.map((level) => level.name)).toEqual(['Beginner', 'Easy']);
    });

    it('are not available when there are none', () => {
        expect(parseLevels({ available: true, levels: [] }).available).toBe(false);
        expect(parseLevels({ available: false, levels: [{ level: 1, name: 'A', summary: '' }] }).available).toBe(false);
        expect(parseLevels({})).toEqual({ available: false, levels: [] });
    });
});

describe('errors', () => {
    it('have a code and a text', () => {
        expect(parseError({ error_code: 301, error_message: 'Not your turn' })).toEqual({ code: 301, text: 'Not your turn' });
        expect(parseError({})).toEqual({ code: 0, text: '' });
    });
});

describe('why a connection ended', () => {
    it('is the gateway that cannot be reached, if it never opened', () => {
        expect(describeClose(1006, '', false)).toMatch(/cannot reach/i);
        expect(describeClose(1013, 'Game server unavailable', false)).toMatch(/not available/i);
    });

    it('is told by the code, once it had', () => {
        expect(describeClose(1008, 'Too many messages', true)).toMatch(/too many messages/i);
        expect(describeClose(1011, '', true)).toMatch(/game server closed/i);
        expect(describeClose(1006, '', true)).toMatch(/lost/i);
    });

    it('may be a reason of the gateway, put in a sentence', () => {
        expect(describeClose(1001, 'Idle for too long', true)).toBe('The connection was closed: idle for too long.');
        expect(describeClose(1001, '', true)).toBe('The connection was closed.');
    });
});

import { describe, expect, it } from 'vitest';
import { CLASSIC, LOCAL_GATEWAY_URL, PRESETS, checkConfig, cleanName, computerCanPlay, resolveGatewayUrl, sameConfig } from './config';

describe('game configurations', () => {
    it('accept the classic game and every preset', () => {
        expect(checkConfig(CLASSIC)).toBeNull();

        for (const preset of PRESETS) expect(checkConfig(preset.config), preset.label).toBeNull();
    });

    it('accept the biggest and the smallest games', () => {
        expect(checkConfig({ rows: 4, cols: 4, players: 2, connect: 3 })).toBeNull();
        expect(checkConfig({ rows: 20, cols: 20, players: 4, connect: 20 })).toBeNull();
    });

    it('keep the board within the limits of the server', () => {
        expect(checkConfig({ ...CLASSIC, rows: 3 })).toMatch(/between 4 and 20/);
        expect(checkConfig({ ...CLASSIC, cols: 21 })).toMatch(/between 4 and 20/);
    });

    it('keep the players within the limits of the server', () => {
        expect(checkConfig({ ...CLASSIC, players: 1 })).toMatch(/between 2 and 4 players/);
        expect(checkConfig({ ...CLASSIC, players: 5 })).toMatch(/between 2 and 4 players/);
    });

    it('need a line that is possible', () => {
        expect(checkConfig({ ...CLASSIC, connect: 2 })).toMatch(/at least 3/);
        expect(checkConfig({ rows: 4, cols: 5, players: 2, connect: 6 })).toMatch(/fit on the board/);
        expect(checkConfig({ rows: 4, cols: 5, players: 2, connect: 5 })).toBeNull(); // along the longer side
    });

    it('are made of whole numbers', () => {
        expect(checkConfig({ ...CLASSIC, rows: 6.5 })).toMatch(/whole numbers/);
        expect(checkConfig({ ...CLASSIC, cols: Number.NaN })).toMatch(/whole numbers/);
    });

    it('can be compared', () => {
        expect(sameConfig(CLASSIC, { rows: 6, cols: 7, players: 2, connect: 4 })).toBe(true);
        expect(sameConfig(CLASSIC, { ...CLASSIC, connect: 5 })).toBe(false);
    });
});

describe('the computer', () => {
    it('plays two-player games on boards that fit its 64 bits', () => {
        expect(computerCanPlay(CLASSIC)).toBe(true);
        expect(computerCanPlay({ rows: 6, cols: 9, players: 2, connect: 5 })).toBe(true); // 9 × 7 = 63
        expect(computerCanPlay({ rows: 7, cols: 9, players: 2, connect: 4 })).toBe(false); // 9 × 8 = 72
    });

    it('does not play with more than one opponent', () => {
        expect(computerCanPlay({ ...CLASSIC, players: 3 })).toBe(false);
    });
});

describe('names', () => {
    it('lose what a name cannot have', () => {
        expect(cleanName('  Ada  ')).toBe('Ada');
        expect(cleanName('A\u0000d\u001fa\u007f')).toBe('Ada');
        expect(cleanName('')).toBe('');
        expect(cleanName('   ')).toBe('');
    });

    it('are not longer than the server allows', () => {
        expect(cleanName('x'.repeat(50))).toHaveLength(32);
        expect(cleanName(`${'x'.repeat(31)}  yy`)).toBe('x'.repeat(31));
    });
});

describe('the address of the gateway', () => {
    it('is the one that is given', () => {
        expect(resolveGatewayUrl('ws://127.0.0.1:8081/connectx/ws', 'https://api.bocchio.dev')).toBe('ws://127.0.0.1:8081/connectx/ws');
        expect(resolveGatewayUrl('  wss://play.example.com/ws  ', undefined)).toBe('wss://play.example.com/ws');
    });

    it('is otherwise on the host of the API, with a secure connection if that is secure', () => {
        expect(resolveGatewayUrl(undefined, 'https://api.bocchio.dev')).toBe('wss://api.bocchio.dev/connectx/ws');
        expect(resolveGatewayUrl('', 'http://staging.example.com')).toBe('ws://staging.example.com/connectx/ws');
    });

    it('drops whatever else the address of the API has', () => {
        expect(resolveGatewayUrl(undefined, 'https://api.bocchio.dev/v1/?key=1#top')).toBe('wss://api.bocchio.dev/connectx/ws');
        expect(resolveGatewayUrl(undefined, 'https://api.example.com:8443')).toBe('wss://api.example.com:8443/connectx/ws');
    });

    it('is on the machine of the developer when the API is', () => {
        expect(LOCAL_GATEWAY_URL).toBe('ws://127.0.0.1:8081/connectx/ws');
        expect(resolveGatewayUrl(undefined, 'http://api.bocchio.test:8000')).toBe(LOCAL_GATEWAY_URL);
        expect(resolveGatewayUrl(undefined, 'http://localhost:8000')).toBe(LOCAL_GATEWAY_URL);
        expect(resolveGatewayUrl(undefined, 'http://127.0.0.1')).toBe(LOCAL_GATEWAY_URL);
        expect(resolveGatewayUrl(undefined, 'http://api.myapp.localhost')).toBe(LOCAL_GATEWAY_URL);
    });

    it('is not mistaken for a local one by a name that only looks like it', () => {
        expect(resolveGatewayUrl(undefined, 'https://contest.example.com')).toBe('wss://contest.example.com/connectx/ws');
        expect(resolveGatewayUrl(undefined, 'https://localhost.example.com')).toBe('wss://localhost.example.com/connectx/ws');
    });

    it('is unknown when there is nothing to tell it from', () => {
        expect(resolveGatewayUrl(undefined, undefined)).toBeNull();
        expect(resolveGatewayUrl('  ', 'not an address')).toBeNull();
    });
});

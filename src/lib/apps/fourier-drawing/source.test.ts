import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageSourceError, describeImageUrl, parseImageUrl } from './source';

beforeEach(() => {
    // The functions resolve relative links against the page they run in
    vi.stubGlobal('window', { location: { href: 'https://bocchio.dev/apps/fourier-drawing?image=x' } });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('parseImageUrl', () => {
    it('accepts web links as they are', () => {
        expect(parseImageUrl('https://example.com/cat.jpg').href).toBe('https://example.com/cat.jpg');
        expect(parseImageUrl('  http://example.com/cat.jpg  ').href).toBe('http://example.com/cat.jpg');
    });

    it('takes an address without a scheme for a secure web address, like a browser does', () => {
        expect(parseImageUrl('example.com/cat.jpg').href).toBe('https://example.com/cat.jpg');
    });

    it('resolves a path starting with a slash against this site', () => {
        expect(parseImageUrl('/images/cat.jpg').href).toBe('https://bocchio.dev/images/cat.jpg');
    });

    it('accepts pictures embedded in the link', () => {
        expect(parseImageUrl('data:image/png;base64,AAAA').protocol).toBe('data:');
    });

    it.each([
        'ftp://example.com/cat.jpg',
        'javascript:alert(1)',
        'file:///etc/passwd',
        'data:text/html,<script>alert(1)</script>',
    ])('refuses %s', (link) => {
        expect(() => parseImageUrl(link)).toThrow(ImageSourceError);
    });

    it('refuses text that cannot be a link', () => {
        expect(() => parseImageUrl('not a url at all')).toThrow(/valid link/);
    });
});

describe('describeImageUrl', () => {
    it('uses the file name of the picture', () => {
        expect(describeImageUrl('https://example.com/photos/My%20Cat.jpg?size=big')).toBe('My Cat.jpg');
    });

    it('falls back to the website when there is no file name', () => {
        expect(describeImageUrl('https://example.com/')).toBe('example.com');
    });

    it('does not print the whole picture when it is embedded in the link', () => {
        expect(describeImageUrl('data:image/png;base64,AAAA')).toBe('image');
    });
});

import { describe, expect, it } from 'vitest';
import { getPortalLink } from './app';

describe('getPortalLink', () => {
    it('leads to /portals, which is where the private areas of the services are (/apps is for the public apps)', () => {
        expect(getPortalLink({ slug: 'cms' }, { id: '7' })).toBe('/portals/cms/7');
        expect(getPortalLink({ slug: 'ptm' }, { id: '7' })).toBe('/portals/ptm/7');
    });

    it('gives nothing for a service that has no portal, or for no service', () => {
        expect(getPortalLink({ slug: 'unknown' }, { id: '7' })).toBeNull();
        expect(getPortalLink(undefined, { id: '7' })).toBeNull();
    });
});

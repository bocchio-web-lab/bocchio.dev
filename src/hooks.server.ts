import type { Handle } from '@sveltejs/kit';
import { createIdentitySdk } from '$lib/sdk.server';

export const handle: Handle = async ({ event, resolve }) => {
    const sdk = createIdentitySdk(event.cookies);
    const user = await sdk.getUser({ throwOnError: false });
    event.locals.user = user.data || null;

    const response = await resolve(event, {
        filterSerializedResponseHeaders: (name) => {
            return name === 'content-type';
        }
    });

    return response;
};

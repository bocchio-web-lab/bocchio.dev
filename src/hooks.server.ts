// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { createAuthService } from '$lib/api/auth.server';

export const handle: Handle = async ({ event, resolve }) => {
    const authService = createAuthService(event.cookies);
    event.locals.user = await authService.getUser();
    return resolve(event);
};

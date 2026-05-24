import type { User } from '$lib/sdk/identity/types';

declare global {
    namespace App {
        interface Locals {
            user: User | null;
        }

        // interface PageData {
        //     user: App.Locals['user'];
        // }
    }
}

export { };
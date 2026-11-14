import type { PageLoad } from './$types';
import { loadApp } from '$lib/utils/cms';

// The page is a static file: the game is played over a connection that the browser opens.
// The title and the text of the app are in its entry of the CMS, whose slug is the name of this folder
export const prerender = true;

export const load: PageLoad = ({ fetch, url }) => loadApp('connectx', fetch, url);

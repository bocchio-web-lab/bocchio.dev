import type { Raster } from './types';

/** Images are scaled so that their longest side is this long before being analysed. */
export const WORKING_SIZE = 640;

/** Bigger files are refused: decoding them would freeze the page. */
const MAX_FILE_SIZE = 30 * 1024 * 1024;

const DOWNLOAD_TIMEOUT = 20_000;

/**
 * Free image proxy that adds the CORS headers a page needs to read the pixels of a picture. It is only used
 * when the website hosting the image does not allow it, and it also shrinks big pictures on the way.
 */
const IMAGE_PROXY = 'https://images.weserv.nl/';

/** A problem the visitor can understand and fix, so the message can be shown as it is. */
export class ImageSourceError extends Error {
    override name = 'ImageSourceError';
}

export interface LoadedImage {
    raster: Raster;
    /** The same pixels as a canvas, ready to be drawn behind the drawing. */
    canvas: HTMLCanvasElement;
}

/**
 * Checks that the text is a link we can load. A link without a scheme is taken for a web address, like browsers do,
 * and a path starting with a slash is a picture of this very site.
 */
export function parseImageUrl(text: string): URL {
    const trimmed = text.trim();
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
    let url: URL;

    try {
        url = new URL(hasScheme || trimmed.startsWith('/') ? trimmed : `https://${trimmed}`, window.location.href);
    } catch {
        throw new ImageSourceError("That doesn't look like a valid link");
    }

    const isImageData = url.protocol === 'data:' && url.href.startsWith('data:image/');

    if (url.protocol !== 'http:' && url.protocol !== 'https:' && !isImageData) {
        throw new ImageSourceError('Only web links (http or https) can be loaded');
    }

    return url;
}

/** A short name for the image behind a link: its file name, or its website when it has none. */
export function describeImageUrl(text: string): string {
    try {
        const url = parseImageUrl(text);
        if (url.protocol === 'data:') return 'image';

        return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? url.hostname);
    } catch {
        return 'image';
    }
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
    if (file.size > MAX_FILE_SIZE) throw new ImageSourceError('That file is too big: the limit is 30 MB');
    if (file.type && !file.type.startsWith('image/')) throw new ImageSourceError('That file is not an image');

    return rasterize(file);
}

export function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

export async function loadImageUrl(text: string, signal?: AbortSignal): Promise<LoadedImage> {
    const url = parseImageUrl(text);

    try {
        return await rasterize(await download(url.href, signal));
    } catch (error) {
        // A TypeError means the browser could not get a readable answer at all: the host forbids reading its
        // images from other websites (CORS), serves them over plain http, or is unreachable.
        // Any other failure is a real answer from the server, and the proxy would only repeat it.
        if (!(error instanceof TypeError) || url.protocol === 'data:') throw error;
    }

    try {
        return await rasterize(await download(proxied(url), signal));
    } catch (error) {
        if (isAbortError(error)) throw error;

        throw new ImageSourceError("That image can't be downloaded: the link may be wrong, or its website blocks it");
    }
}

function proxied(url: URL): string {
    const options = new URLSearchParams({
        url: url.href,
        w: String(WORKING_SIZE * 2),
        h: String(WORKING_SIZE * 2),
        fit: 'inside',
        we: '',
        output: 'png',
    });

    return `${IMAGE_PROXY}?${options}`;
}

async function download(href: string, signal?: AbortSignal): Promise<Blob> {
    // Give up after a while, or as soon as the caller does
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new ImageSourceError('The download took too long')), DOWNLOAD_TIMEOUT);
    const abort = () => controller.abort(signal?.reason);

    signal?.addEventListener('abort', abort);

    try {
        const response = await fetch(href, { signal: controller.signal, referrerPolicy: 'no-referrer' });

        if (!response.ok) throw new ImageSourceError(`The server answered with an error (${response.status})`);

        const blob = await response.blob();

        if (blob.size > MAX_FILE_SIZE) throw new ImageSourceError('That image is too big: the limit is 30 MB');

        // Some servers label images as generic binary data, so only clear mismatches are refused
        if (blob.type && !blob.type.startsWith('image/') && blob.type !== 'application/octet-stream') {
            throw new ImageSourceError("That link doesn't point to an image");
        }

        return blob;
    } catch (error) {
        // Report our own timeout instead of a bare "AbortError"
        if (controller.signal.reason instanceof ImageSourceError && !signal?.aborted) throw controller.signal.reason;
        throw error;
    } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
    }
}

/** Decodes the picture and reads its pixels at the working size. */
async function rasterize(blob: Blob): Promise<LoadedImage> {
    const objectUrl = URL.createObjectURL(blob);

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new ImageSourceError("That file couldn't be read as an image"));
            element.src = objectUrl;
        });

        // SVG files without a size report 0: any size will do, they are vector graphics
        const naturalWidth = image.naturalWidth || 512;
        const naturalHeight = image.naturalHeight || 512;
        const scale = WORKING_SIZE / Math.max(naturalWidth, naturalHeight);
        const width = Math.max(1, Math.round(naturalWidth * scale));
        const height = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new ImageSourceError('Your browser cannot process images');

        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);

        return { raster: context.getImageData(0, 0, width, height), canvas };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

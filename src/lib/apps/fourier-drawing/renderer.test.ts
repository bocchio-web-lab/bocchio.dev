import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, fitScale, resolveView, zoomCamera, type Camera } from './renderer';

const bounds = { minX: 100, minY: 50, maxX: 500, maxY: 350 };
const still: Camera = { zoom: 1, panX: 0, panY: 0, follow: false };
const tip = { x: 320, y: 140 };

/** Where a point of the drawing ends up on the screen. */
function onScreen(camera: Camera, x: number, y: number, width = 800, height = 600) {
    const view = resolveView(bounds, width, height, camera, tip);
    return { x: x * view.scale + view.offsetX, y: y * view.scale + view.offsetY };
}

describe('fitScale', () => {
    it('makes the drawing fill the view, with a margin, along its tighter side', () => {
        // A 400 x 300 drawing in a 800 x 600 view: the width is the tighter side only if the ratios differ
        expect(fitScale(bounds, 800, 600)).toBeCloseTo((800 * 0.86) / 400, 9);
        expect(fitScale(bounds, 800, 200)).toBeCloseTo((200 * 0.86) / 300, 9);
    });
});

describe('resolveView', () => {
    it('puts the middle of the drawing in the middle of the view', () => {
        const centre = onScreen(still, 300, 200);

        expect(centre.x).toBeCloseTo(400, 9);
        expect(centre.y).toBeCloseTo(300, 9);
    });

    it('puts the pen in the middle when following it', () => {
        const spot = onScreen({ ...still, zoom: 8, follow: true }, tip.x, tip.y);

        expect(spot.x).toBeCloseTo(400, 9);
        expect(spot.y).toBeCloseTo(300, 9);
    });

    it('shifts by the pan, in units of the drawing', () => {
        const before = onScreen(still, 300, 200);
        const after = onScreen({ ...still, zoom: 2, panX: 10 }, 300, 200);

        // The point that used to be in the middle moves 10 drawing units to the left, at double the size
        expect(after.x).toBeCloseTo(400 - 10 * fitScale(bounds, 800, 600) * 2, 9);
        expect(before.x).toBeCloseTo(400, 9);
    });
});

describe('zoomCamera', () => {
    it.each([
        ['from the start', still, 2.5, 600, 120],
        ['again, already magnified', { ...still, zoom: 3, panX: -40, panY: 25 }, 1.5, 150, 480],
        ['out', { ...still, zoom: 6, panX: 30, panY: -10 }, 1 / 1.5, 420, 310],
    ])('keeps the point under the cursor in place when zooming %s', (_name, camera, factor, x, y) => {
        const view = resolveView(bounds, 800, 600, camera, tip);
        const point = { x: (x - view.offsetX) / view.scale, y: (y - view.offsetY) / view.scale };

        const zoomed = zoomCamera(bounds, 800, 600, camera, factor, x, y);
        const after = onScreen(zoomed, point.x, point.y);

        expect(zoomed.zoom).toBeCloseTo(camera.zoom * factor, 9);
        expect(after.x).toBeCloseTo(x, 6);
        expect(after.y).toBeCloseTo(y, 6);
    });

    it('goes no further than the limits', () => {
        expect(zoomCamera(bounds, 800, 600, { ...still, zoom: 30 }, 5, 400, 300).zoom).toBe(MAX_ZOOM);
        expect(zoomCamera(bounds, 800, 600, { ...still, zoom: 2 }, 0.1, 400, 300).zoom).toBe(1);
    });

    it('recentres the drawing when it is back to its full size', () => {
        const camera = zoomCamera(bounds, 800, 600, { ...still, zoom: 1.2, panX: 50, panY: 20 }, 0.5, 100, 100);

        expect(camera).toMatchObject({ zoom: 1, panX: 0, panY: 0 });
    });

    it('leaves the pan alone while the pen is followed', () => {
        const camera = zoomCamera(bounds, 800, 600, { ...still, zoom: 4, panX: 7, panY: 8, follow: true }, 2, 100, 100);

        expect(camera).toMatchObject({ zoom: 8, panX: 7, panY: 8, follow: true });
    });
});

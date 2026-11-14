import { pointAlong, toLatLon, toVector, type LatLon } from './earth';
import { landAt } from './land-mask';
import { letter } from './route';
import { add, dot, length, normalize, type Vec3 } from './vec';
import { frameOf, fromScreen, toScreen, type Frame, type View } from './view';

const ACCENT = '#f97316';

const OCEAN = [22, 52, 92];
const LAND = [96, 126, 88];

/** Where the light comes from, as seen by the viewer: from above, a little to the left. */
const LIGHT = [-0.45, 0.55, 0.7];

/** The globe is worked out pixel by pixel with at most this many pixels, and stretched: it is smooth, and it is quick to turn. */
const MOST_PIXELS = 250_000;

/** Where the globe is on the canvas: the middle and the radius, in pixels. */
interface Layout {
    x: number;
    y: number;
    radius: number;
}

function layoutOf(view: View, width: number, height: number): Layout {
    return { x: width / 2, y: height / 2, radius: view.zoom * 0.46 * Math.min(width, height) };
}

/** How big the globe is on the canvas: dragging by that many pixels turns it by one radian. */
export const globeRadius = (view: View, width: number, height: number): number => layoutOf(view, width, height).radius;

/** The place on the globe that is at a point of the canvas, or nothing if the point is beside the globe. */
export function pickGlobe(view: View, width: number, height: number, pointX: number, pointY: number): LatLon | null {
    const { x, y, radius } = layoutOf(view, width, height);
    const [dx, dy] = [(pointX - x) / radius, (y - pointY) / radius];
    const flat = dx * dx + dy * dy;

    return flat > 1 ? null : toLatLon(fromScreen(frameOf(view), [dx, dy, Math.sqrt(1 - flat)]));
}

/**
 * The view that has all the places of a route on the globe: turned to the middle of them, and as much zoomed in as they
 * allow (a single place is shown with its surroundings).
 */
export function fitGlobe(places: LatLon[]): View {
    const vectors = places.map(toVector);
    const sum = vectors.reduce((total, vector) => add(total, vector), [0, 0, 0] as Vec3);

    // The middle of the places, or the first one if they cancel each other out, like two places on opposite sides
    const middle = length(sum) > 1e-6 ? normalize(sum) : vectors[0];
    const spread = Math.max(...vectors.map((vector) => Math.acos(Math.min(1, dot(vector, middle)))));
    const { lat, lon } = toLatLon(middle);

    // A place that is at an angle from the middle is at the sine of the angle, in radii of the globe, from the centre of the picture
    return {
        yaw: (lon * Math.PI) / 180,
        pitch: (lat * Math.PI) / 180,
        zoom: vectors.length === 1 ? 3 : Math.max(1, 0.87 / Math.sin(Math.max(0.01, Math.min(spread, Math.PI / 2)))),
    };
}

/** What the globe shows besides the Earth: the places of the route, in order. */
export interface GlobeScene {
    view: View;
    route: LatLon[];
    /** The globe is drawn with fewer pixels, to be quick enough to follow the pointer while it is turned. */
    rough?: boolean;
}

/** The picture of the Earth as a globe: the land and the sea, shaded, and the route on it. */
export class Globe {
    // The land and the sea only change when the globe is turned: they are kept for when only the route changes
    private raster: HTMLCanvasElement | null = null;
    private image: ImageData | null = null;
    private pixels = new Uint32Array(0);
    private rastered = '';

    draw(context: CanvasRenderingContext2D, { view, route, rough = false }: GlobeScene, width: number, height: number, pixelRatio: number): void {
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);

        const layout = layoutOf(view, width, height);
        const frame = frameOf(view);

        // The air round the Earth
        const glow = context.createRadialGradient(layout.x, layout.y, layout.radius * 0.97, layout.x, layout.y, layout.radius * 1.12);
        glow.addColorStop(0, 'rgba(110, 160, 255, 0.35)');
        glow.addColorStop(1, 'rgba(110, 160, 255, 0)');
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);

        context.imageSmoothingEnabled = true;
        context.drawImage(this.paint(view, frame, width, height, rough ? 0.5 : pixelRatio, layout), 0, 0, width, height);

        drawGrid(context, frame, layout);
        drawRoute(context, route.map(toVector), frame, layout);
    }

    /** The land and the sea, as a picture of the same shape as the canvas, with `density` pixels for each pixel of the canvas if they are not too many. */
    private paint(view: View, frame: Frame, width: number, height: number, density: number, { x, y, radius }: Layout): HTMLCanvasElement {
        const quality = Math.min(density, Math.sqrt(MOST_PIXELS / (width * height)));
        const [w, h] = [Math.ceil(width * quality), Math.ceil(height * quality)];

        this.raster ??= document.createElement('canvas');

        if (this.raster.width !== w || this.raster.height !== h) {
            this.raster.width = w;
            this.raster.height = h;
            this.image = new ImageData(w, h);
            this.pixels = new Uint32Array(this.image.data.buffer);
            this.rastered = '';
        }

        const key = `${w}x${h}|${view.yaw}|${view.pitch}|${view.zoom}`;
        if (key === this.rastered) return this.raster;

        const { pixels } = this;
        const [rightX, rightY, rightZ] = frame.right;
        const [upX, upY, upZ] = frame.up;
        const [towardX, towardY, towardZ] = frame.toward;
        const degrees = 180 / Math.PI;

        for (let row = 0; row < h; row++) {
            const dy = (y - (row + 0.5) / quality) / radius;

            for (let column = 0; column < w; column++) {
                const dx = ((column + 0.5) / quality - x) / radius;
                const flat = dx * dx + dy * dy;

                if (flat >= 1) {
                    pixels[row * w + column] = 0;
                    continue;
                }

                // The point of the Earth that is at this pixel, from the three directions of the screen
                const dz = Math.sqrt(1 - flat);
                const pointX = dx * rightX + dy * upX + dz * towardX;
                const pointY = dx * rightY + dy * upY + dz * towardY;
                const pointZ = dx * rightZ + dy * upZ + dz * towardZ;

                const coast = landAt(Math.asin(pointZ) * degrees, Math.atan2(pointY, pointX) * degrees);
                const land = coast <= 0.35 ? 0 : coast >= 0.65 ? 1 : (coast - 0.35) / 0.3;
                const light = 0.3 + 0.7 * Math.max(0, dx * LIGHT[0] + dy * LIGHT[1] + dz * LIGHT[2]);
                const edge = 1 - dz;
                const haze = edge * edge * edge * 70;

                const red = Math.min(255, (OCEAN[0] + (LAND[0] - OCEAN[0]) * land) * light + haze * 0.4);
                const green = Math.min(255, (OCEAN[1] + (LAND[1] - OCEAN[1]) * land) * light + haze * 0.6);
                const blue = Math.min(255, (OCEAN[2] + (LAND[2] - OCEAN[2]) * land) * light + haze);

                pixels[row * w + column] = 0xff000000 | (blue << 16) | (green << 8) | red;
            }
        }

        this.raster.getContext('2d')!.putImageData(this.image!, 0, 0);
        this.rastered = key;

        return this.raster;
    }
}

/** Adds to the path the part of a line on the sphere that is on the near side: the points are unit vectors. */
function addVisible(context: CanvasRenderingContext2D, points: Vec3[], frame: Frame, { x, y, radius }: Layout): void {
    let drawing = false;

    for (const point of points) {
        const [right, up, depth] = toScreen(frame, point);

        if (depth < 0) {
            drawing = false;
            continue;
        }

        if (drawing) context.lineTo(x + radius * right, y - radius * up);
        else context.moveTo(x + radius * right, y - radius * up);

        drawing = true;
    }
}

/** The meridians and the parallels, every 30 degrees. */
function drawGrid(context: CanvasRenderingContext2D, frame: Frame, layout: Layout): void {
    context.beginPath();

    for (let lat = -60; lat <= 60; lat += 30) {
        addVisible(context, Array.from({ length: 121 }, (_, i) => toVector({ lat, lon: -180 + 3 * i })), frame, layout);
    }

    for (let lon = -180; lon < 180; lon += 30) {
        addVisible(context, Array.from({ length: 61 }, (_, i) => toVector({ lat: -90 + 3 * i, lon })), frame, layout);
    }

    context.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    context.lineWidth = 1;
    context.stroke();

    // The edge
    context.beginPath();
    context.arc(layout.x, layout.y, layout.radius, 0, 2 * Math.PI);
    context.strokeStyle = 'rgba(150, 190, 255, 0.35)';
    context.stroke();
}

/** The route: the tunnels seen through the Earth, the shortest ways along the surface, and the points. */
function drawRoute(context: CanvasRenderingContext2D, points: Vec3[], frame: Frame, layout: Layout): void {
    const screen = (point: Vec3): [number, number, number] => {
        const [right, up, depth] = toScreen(frame, point);

        return [layout.x + layout.radius * right, layout.y - layout.radius * up, depth];
    };

    // The way on the surface follows a great circle
    context.beginPath();
    points.slice(1).forEach((point, i) => {
        addVisible(context, Array.from({ length: 65 }, (_, step) => pointAlong(points[i], point, step / 64)), frame, layout);
    });
    context.strokeStyle = ACCENT;
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();

    // A tunnel is a straight line from one point to the next, and goes through the Earth: it is drawn on top of the globe
    context.beginPath();
    points.slice(1).forEach((point, i) => {
        const [fromX, fromY] = screen(points[i]);
        const [toX, toY] = screen(point);

        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
    });
    context.setLineDash([6, 5]);
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    context.lineWidth = 1.5;
    context.stroke();
    context.setLineDash([]);

    context.font = '600 12px system-ui, sans-serif';
    context.lineWidth = 3;
    context.lineJoin = 'round';

    points.forEach((point, i) => {
        const [x, y, depth] = screen(point);
        const near = depth >= 0;

        // A point on the other side of the Earth is shown faint: it is where the tunnel comes out
        context.globalAlpha = near ? 1 : 0.4;

        context.beginPath();
        context.arc(x, y, near ? 5 : 4, 0, 2 * Math.PI);
        context.fillStyle = near ? ACCENT : 'rgba(0, 0, 0, 0)';
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();

        context.lineWidth = 3;
        context.strokeStyle = 'rgba(8, 12, 24, 0.85)';
        context.strokeText(letter(i), x + 8, y - 8);
        context.fillStyle = '#ffffff';
        context.fillText(letter(i), x + 8, y - 8);
    });

    context.globalAlpha = 1;
}

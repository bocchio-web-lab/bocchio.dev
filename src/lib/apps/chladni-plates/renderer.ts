import type { Bend, Grid } from './field';
import type { Sand } from './sand';
import type { PlateShape } from './shapes';
import { drawingOrder, lighting, project, type Camera, type Mesh } from './view3d';

export const COLORS = {
    plate: '#262b33',
    edge: 'rgba(255, 255, 255, 0.25)',
    marker: '#f97316',
    sand: [238, 224, 176],
    up: [255, 150, 70],
    down: [70, 170, 255],
} as const;

/** Where the plate is on the canvas: the position of its centre, and how many pixels a unit of length is. */
export interface View {
    centreX: number;
    centreY: number;
    scale: number;
}

/** Fits the plate in the canvas, with a margin around it. */
export function viewOf(shape: PlateShape, width: number, height: number): View {
    const half = Math.max(shape.half.x, shape.half.y);

    return { centreX: width / 2, centreY: height / 2, scale: (0.9 * Math.min(width, height)) / (2 * half) };
}

/** Where a point of the plate is on the canvas (the y axis of the plate goes up, that of the canvas down). */
export function toScreen(view: View, x: number, y: number): [number, number] {
    return [view.centreX + x * view.scale, view.centreY - y * view.scale];
}

/** The point of the plate that is under a point of the canvas. */
export function toPlate(view: View, px: number, py: number): [number, number] {
    return [(px - view.centreX) / view.scale, (view.centreY - py) / view.scale];
}

function outlinePath(context: CanvasRenderingContext2D, shape: PlateShape, view: View): void {
    const outline = shape.outline();

    context.beginPath();

    for (let i = 0; i < outline.length; i += 2) {
        const [x, y] = toScreen(view, outline[i], outline[i + 1]);

        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    }

    context.closePath();
}

/**
 * The sand, drawn as pixels on a layer of its own, which is then put over the rest: thousands of grains
 * are much quicker to draw this way than one by one.
 */
export class SandLayer {
    private canvas: HTMLCanvasElement | null = null;
    private image: ImageData | null = null;
    private pixels = new Uint32Array(0);
    private width = 0;
    private height = 0;
    private readonly color = COLORS.sand[0] | (COLORS.sand[1] << 8) | (COLORS.sand[2] << 16) | (255 << 24);

    /** Clears the layer, and makes it as big as the canvas. */
    begin(width: number, height: number): void {
        if (!this.canvas || this.width !== width || this.height !== height) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.image = new ImageData(width, height);
            this.pixels = new Uint32Array(this.image.data.buffer);
            this.width = width;
            this.height = height;
        }

        this.pixels.fill(0);
    }

    /** A grain: a square of `size` pixels with its top left corner at (x, y). */
    dot(x: number, y: number, size: number): void {
        const left = Math.floor(x);
        const top = Math.floor(y);

        for (let j = Math.max(0, top); j < Math.min(this.height, top + size); j++) {
            for (let i = Math.max(0, left); i < Math.min(this.width, left + size); i++) this.pixels[j * this.width + i] = this.color;
        }
    }

    /** Puts the layer on the canvas, which must not be scaled. */
    paint(context: CanvasRenderingContext2D): void {
        if (!this.canvas || !this.image) return;

        this.canvas.getContext('2d')!.putImageData(this.image, 0, 0);
        context.drawImage(this.canvas, 0, 0);
    }
}

/** The colour of a bend of `value` (from -1 to 1): warm where the plate is up, cool where it is down, nothing where it is still. */
function motionColor(value: number): [number, number, number, number] {
    const strength = Math.min(1, Math.abs(value));
    const [r, g, b] = value >= 0 ? COLORS.up : COLORS.down;

    return [r, g, b, Math.round(255 * 0.8 * strength ** 0.8)];
}

/** The bend of the plate drawn as colours, on a small picture that is scaled up over the plate. */
export class MotionPicture {
    private readonly canvas = document.createElement('canvas');
    private readonly image: ImageData;
    private readonly inside: Uint8Array;

    constructor(
        private readonly grid: Grid,
        shape: PlateShape,
    ) {
        const { size } = grid;

        this.canvas.width = size;
        this.canvas.height = size;
        this.image = new ImageData(size, size);
        this.inside = new Uint8Array(size * size);

        for (let j = 0; j < size; j++) {
            for (let i = 0; i < size; i++) {
                // The picture has the top of the plate at the top: row 0 is the highest y
                this.inside[j * size + i] = shape.contains(grid.coordinate(i), grid.coordinate(size - 1 - j)) ? 1 : 0;
            }
        }
    }

    /** Colours the picture for the moment `phase` of the oscillation, where the biggest bend is `peak`. */
    update(phase: number, peak: number): void {
        const { size, bend } = this.grid;
        const cos = Math.cos(phase);
        const sin = Math.sin(phase);
        const data = this.image.data;

        for (let j = 0; j < size; j++) {
            for (let i = 0; i < size; i++) {
                const at = (j * size + i) * 4;

                if (!this.inside[j * size + i]) {
                    data[at + 3] = 0;
                    continue;
                }

                const cell = (size - 1 - j) * size + i;
                const [r, g, b, a] = motionColor((bend.re[cell] * cos - bend.im[cell] * sin) / peak);

                data[at] = r;
                data[at + 1] = g;
                data[at + 2] = b;
                data[at + 3] = a;
            }
        }

        this.canvas.getContext('2d')!.putImageData(this.image, 0, 0);
    }

    /** Draws it over the plate, with its edges smoothed. */
    draw(context: CanvasRenderingContext2D, view: View): void {
        const [left, top] = toScreen(view, -this.grid.half, this.grid.half);
        const side = 2 * this.grid.half * view.scale;

        context.imageSmoothingEnabled = true;
        context.drawImage(this.canvas, left, top, side, side);
    }
}

export interface Plate2D {
    shape: PlateShape;
    sand: Sand;
    drive: { x: number; y: number };
    /** The picture of the bend that goes under the sand, if it is to be shown. */
    motion: MotionPicture | null;
}

/** The plate seen from above, with the sand on it, in a canvas of `width` by `height` pixels (not scaled). */
export function drawPlate(context: CanvasRenderingContext2D, layer: SandLayer, scene: Plate2D, width: number, height: number, pixelRatio: number): View {
    const view = viewOf(scene.shape, width / pixelRatio, height / pixelRatio);

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    outlinePath(context, scene.shape, view);
    context.fillStyle = COLORS.plate;
    context.fill();

    if (scene.motion) {
        context.save();
        outlinePath(context, scene.shape, view);
        context.clip();
        scene.motion.draw(context, view);
        context.restore();
    }

    layer.begin(width, height);

    const grain = Math.max(1, Math.round(1.6 * pixelRatio));
    const { sand } = scene;

    for (let i = 0; i < sand.count; i++) {
        const [x, y] = toScreen(view, sand.x[i], sand.y[i]);
        layer.dot(x * pixelRatio - grain / 2, y * pixelRatio - grain / 2, grain);
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    layer.paint(context);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    outlinePath(context, scene.shape, view);
    context.strokeStyle = COLORS.edge;
    context.lineWidth = 1.5;
    context.stroke();

    drawShaker(context, ...toScreen(view, scene.drive.x, scene.drive.y));

    return view;
}

/** Where the shaker pushes the plate: a ring with a dot. */
function drawShaker(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.beginPath();
    context.arc(x, y, 8, 0, 2 * Math.PI);
    context.strokeStyle = COLORS.marker;
    context.lineWidth = 2.5;
    context.stroke();

    context.beginPath();
    context.arc(x, y, 2.5, 0, 2 * Math.PI);
    context.fillStyle = COLORS.marker;
    context.fill();
}

export interface Plate3D {
    shape: PlateShape;
    mesh: Mesh;
    /** The bend of the plate at the vertices of the mesh. */
    bend: Bend;
    grid: Grid;
    sand: Sand;
    drive: { x: number; y: number };
    camera: Camera;
    /** The moment of the oscillation, and how many units high the biggest bend is drawn. */
    phase: number;
    height: number;
    /** The biggest bend, to which the colours are in proportion. */
    peak: number;
    /** How many of the grains are drawn. */
    grains: number;
}

const GRAIN_LIFT = 0.004;

function mix(from: readonly number[], to: readonly number[], amount: number): number[] {
    return from.map((value, i) => value + (to[i] - value) * amount);
}

/** The plate seen in perspective, bending, with the sand on it. */
export function drawPlate3D(context: CanvasRenderingContext2D, layer: SandLayer, scene: Plate3D, width: number, height: number, pixelRatio: number): void {
    const { mesh, bend, camera } = scene;
    const w = width / pixelRatio;
    const h = height / pixelRatio;
    const cos = Math.cos(scene.phase);
    const sin = Math.sin(scene.phase);

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    // Every vertex, raised or lowered by the bend
    const count = mesh.points.length / 2;
    const space = new Float64Array(count * 3);
    const raised = new Float64Array(count);

    for (let v = 0; v < count; v++) {
        raised[v] = (bend.re[v] * cos - bend.im[v] * sin) / scene.peak;

        space[3 * v] = mesh.points[2 * v];
        space[3 * v + 1] = mesh.points[2 * v + 1];
        space[3 * v + 2] = raised[v] * scene.height;
    }

    const screen = project(camera, space, w, h);
    const plate = [38, 43, 51];

    for (const q of drawingOrder(mesh.quads, screen)) {
        const quad = mesh.quads.subarray(4 * q, 4 * q + 4);

        // The colour of the plate where it is up or down, lit like a surface
        const level = (raised[quad[0]] + raised[quad[1]] + raised[quad[2]] + raised[quad[3]]) / 4;
        const base = mix(plate, level >= 0 ? COLORS.up : COLORS.down, Math.min(1, Math.abs(level)) ** 0.8 * 0.85);
        const light = 0.45 + 0.55 * lighting(quad, space);
        const color = `rgb(${Math.round(base[0] * light)}, ${Math.round(base[1] * light)}, ${Math.round(base[2] * light)})`;

        context.beginPath();
        context.moveTo(screen[3 * quad[0]], screen[3 * quad[0] + 1]);
        for (let i = 1; i < 4; i++) context.lineTo(screen[3 * quad[i]], screen[3 * quad[i] + 1]);
        context.closePath();

        context.fillStyle = color;
        context.strokeStyle = color;
        context.lineWidth = 0.7;
        context.fill();
        context.stroke();
    }

    // The sand rides on the plate
    const { sand } = scene;
    const shown = Math.min(scene.grains, sand.count);
    const ground = new Float64Array(shown * 3);
    const read = new Float64Array(2);

    for (let i = 0; i < shown; i++) {
        scene.grid.read(sand.x[i], sand.y[i], read);

        ground[3 * i] = sand.x[i];
        ground[3 * i + 1] = sand.y[i];
        ground[3 * i + 2] = ((read[0] * cos - read[1] * sin) / scene.peak) * scene.height + GRAIN_LIFT;
    }

    const grains = project(camera, ground, w, h);
    const size = Math.max(1, Math.round(1.6 * pixelRatio));

    layer.begin(width, height);
    for (let i = 0; i < shown; i++) layer.dot(grains[3 * i] * pixelRatio - size / 2, grains[3 * i + 1] * pixelRatio - size / 2, size);

    context.setTransform(1, 0, 0, 1, 0, 0);
    layer.paint(context);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // The shaker, on the plate where it pushes
    const at = new Float64Array(3);
    const bendAtDrive = new Float64Array(2);

    scene.grid.read(scene.drive.x, scene.drive.y, bendAtDrive);
    at[0] = scene.drive.x;
    at[1] = scene.drive.y;
    at[2] = ((bendAtDrive[0] * cos - bendAtDrive[1] * sin) / scene.peak) * scene.height;

    const mark = project(camera, at, w, h);
    drawShaker(context, mark[0], mark[1]);
}

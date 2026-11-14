import type { Body } from './catalog';
import { letter } from './route';
import { KM_PER_AU, KM_PER_LIGHT_YEAR } from './units';
import { length, scale, type Vec3 } from './vec';
import { frameOf, toScreen, type Frame, type View } from './view';

const ACCENT = '#f97316';

/** Nearer to the Sun than this (0.05 astronomical units) cannot be told apart from the Sun itself on the map. */
const NEAR = 0.05 * KM_PER_AU;

/**
 * How far from the middle of the map something is, in the units of the map. The map is logarithmic: every ten times the
 * distance is one unit more. It is the only way to have the planets and the galaxies in the same picture.
 */
export function mapRadius(km: number): number {
    return Math.log10(1 + km / NEAR);
}

/** Where something is on the map: in the same direction as in space, but at the distance of the map. */
export function mapPoint(position: Vec3): Vec3 {
    const km = length(position);

    return km === 0 ? [0, 0, 0] : scale(position, mapRadius(km) / km);
}

const au = (count: number, label: string) => ({ km: count * KM_PER_AU, label });
const ly = (count: number, label: string) => ({ km: count * KM_PER_LIGHT_YEAR, label });

/** The circles of the map: each is ten times as far from the Sun as the one before. */
export const RINGS = [
    au(1, '1 AU'),
    au(10, '10 AU'),
    au(100, '100 AU'),
    au(1e3, '1,000 AU'),
    au(1e4, '10,000 AU'),
    ly(1, '1 ly'),
    ly(10, '10 ly'),
    ly(100, '100 ly'),
    ly(1e3, '1,000 ly'),
    ly(1e4, '10,000 ly'),
    ly(1e5, '100,000 ly'),
    ly(1e6, '1 million ly'),
    ly(1e7, '10 million ly'),
    ly(1e8, '100 million ly'),
];

/** The radius of the map, a little more than what is the farthest: the Coma Cluster. */
const EXTENT = 15;

/** How close to a body, in pixels, a click has to be to be for it. */
const REACH = 14;

/** The zoom that has all of some bodies in the picture, from where they are in space: the nearest bodies are zoomed in on. */
export function fitZoom(positions: Vec3[]): number {
    const farthest = Math.max(...positions.map((position) => mapRadius(length(position))));

    return (0.85 * EXTENT) / Math.max(farthest, 1.5);
}

export interface SpaceScene {
    view: View;
    bodies: Body[];
    /** Where the bodies are in space on the day that is chosen, in the same order. */
    positions: Vec3[];
    /** The bodies of the route, as their places in the list, in order. */
    route: number[];
    /** The body that the pointer is over. */
    hovered: number | null;
}

const pixelsPerUnit = (view: View, width: number, height: number): number => (view.zoom * 0.47 * Math.min(width, height)) / EXTENT;

interface Projected {
    x: number;
    y: number;
    /** How near to the viewer. */
    depth: number;
    /** Whether the body is in the picture. */
    shown: boolean;
}

/**
 * Where each body is on the canvas, in pixels. The bodies that are farther from the Sun than the edge of the picture are
 * not shown, unless they are on the route: when the map is zoomed in they would only be there because they are in the
 * line of sight, among the planets.
 */
function project({ view, positions, route }: SpaceScene, width: number, height: number): Projected[] {
    const frame = frameOf(view);
    const unit = pixelsPerUnit(view, width, height);

    return positions.map((position, i) => {
        const point = mapPoint(position);
        const [right, up, depth] = toScreen(frame, point);

        return {
            x: width / 2 + unit * right,
            y: height / 2 - unit * up,
            depth,
            shown: length(point) * unit <= 0.5 * Math.min(width, height) || route.includes(i),
        };
    });
}

/** The body that is at a point of the canvas, or nothing: if there are two there, the first one of the list. */
export function pickSpace(scene: SpaceScene, width: number, height: number, pointX: number, pointY: number): number | null {
    const distances = project(scene, width, height).map(({ x, y, shown }) => (shown ? Math.hypot(x - pointX, y - pointY) : Infinity));
    const nearest = Math.min(...distances);

    return nearest > REACH ? null : distances.findIndex((distance) => distance <= nearest + 1);
}

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

const overlap = (a: Box, b: Box): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Which of the labels can be shown, from the most important to the least: one is left out if it would cover another one
 * that is shown, or one of the boxes that are `taken` already. The first `always` labels are shown anyway.
 */
export function chooseLabels(boxes: Box[], always: number, taken: Box[] = []): boolean[] {
    const shown = [...taken];

    return boxes.map((box, i) => {
        const fits = i < always || shown.every((other) => !overlap(box, other));

        if (fits) shown.push(box);

        return fits;
    });
}

/** How big a body is drawn, in pixels. */
function bodyRadius({ id, group }: Body): number {
    if (id === 'sun') return 6;
    if (id === 'moon') return 2.5;

    return group === 'Solar System' ? 3.5 : group === 'Stars' ? 3 : 4;
}

/** The map of the Solar System, the stars and the galaxies, seen from a point of view, with the route on it. */
export function drawSpace(context: CanvasRenderingContext2D, scene: SpaceScene, width: number, height: number, pixelRatio: number): void {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const { view, bodies, route, hovered } = scene;
    const frame = frameOf(view);
    const unit = pixelsPerUnit(view, width, height);
    const points = project(scene, width, height);

    const rings = drawRings(context, frame, unit, width, height);

    // A line from each body down to the plane of the Earth's orbit, to see how high above it is
    context.beginPath();
    scene.positions.forEach((position, i) => {
        const [x, y, z] = mapPoint(position);

        if (!points[i].shown || Math.abs(z) < 0.02) return;

        const [right, up] = toScreen(frame, [x, y, 0]);

        context.moveTo(points[i].x, points[i].y);
        context.lineTo(width / 2 + unit * right, height / 2 - unit * up);
    });
    context.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    context.lineWidth = 1;
    context.stroke();

    context.beginPath();
    route.forEach((index, i) => (i ? context.lineTo(points[index].x, points[index].y) : context.moveTo(points[index].x, points[index].y)));
    context.strokeStyle = ACCENT;
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.stroke();

    // The ones that are far are drawn first, so that the near ones cover them
    const farToNear = points.map((_, i) => i).sort((a, b) => points[a].depth - points[b].depth);

    for (const i of farToNear) {
        if (!points[i].shown) continue;

        const { x, y } = points[i];
        const radius = bodyRadius(bodies[i]);

        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fillStyle = bodies[i].color;
        context.fill();

        if (route.includes(i) || i === hovered) {
            context.beginPath();
            context.arc(x, y, radius + 3, 0, 2 * Math.PI);
            context.strokeStyle = route.includes(i) ? ACCENT : '#ffffff';
            context.lineWidth = 2;
            context.stroke();
        }
    }

    drawLabels(context, scene, points, width, rings);
}

/** The circles of the map, with how far each is from the Sun written at the lowest point of it: the places of the names are given back. */
function drawRings(context: CanvasRenderingContext2D, frame: Frame, unit: number, width: number, height: number): Box[] {
    context.font = '10px system-ui, sans-serif';
    context.textAlign = 'center';
    context.lineWidth = 1;

    const names: Box[] = [];
    let written = -Infinity;

    for (const { km, label } of RINGS) {
        const radius = mapRadius(km);
        const points = Array.from({ length: 97 }, (_, i) => {
            const angle = (i / 96) * 2 * Math.PI;
            const [right, up] = toScreen(frame, [radius * Math.cos(angle), radius * Math.sin(angle), 0]);

            return [width / 2 + unit * right, height / 2 - unit * up];
        });

        context.beginPath();
        points.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
        context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        context.stroke();

        // The names are written if there is room for them one above the other
        if (unit * radius - written < 14) continue;

        const [x, y] = points.reduce((lowest, point) => (point[1] > lowest[1] ? point : lowest));

        const labelWidth = context.measureText(label).width;

        context.fillStyle = 'rgba(203, 213, 225, 0.6)';
        context.fillText(label, x, y + 11);
        names.push({ x: x - labelWidth / 2 - 2, y: y + 1, width: labelWidth + 4, height: 13 });
        written = unit * radius;
    }

    context.textAlign = 'left';

    return names;
}

/** The names of the bodies: the ones of the route, the one that the pointer is over, then the Sun, the Earth and the rest. */
function drawLabels(context: CanvasRenderingContext2D, { bodies, route, hovered }: SpaceScene, points: Projected[], width: number, taken: Box[]): void {
    context.font = '12px system-ui, sans-serif';

    const important = [...new Set([...route, ...(hovered === null ? [] : [hovered])])];
    const first = ['sun', 'earth'].map((id) => bodies.findIndex((body) => body.id === id)).filter((i) => i >= 0);
    const order = [...new Set([...important, ...first, ...bodies.map((_, i) => i)])].filter((i) => points[i].shown);

    const labels = order.map((i) => {
        const text = route.includes(i) ? `${route.map((stop, at) => (stop === i ? letter(at) : '')).join('')} ${bodies[i].name}` : bodies[i].name;
        const textWidth = context.measureText(text).width;
        const { x, y } = points[i];

        // The name is at the right of the body, or at its left if it would go out of the picture
        const left = x + bodyRadius(bodies[i]) + 6 + textWidth + 4 > width ? x - bodyRadius(bodies[i]) - 6 - textWidth : x + bodyRadius(bodies[i]) + 6;

        return { index: i, text, x: left, y, box: { x: left - 2, y: y - 8, width: textWidth + 4, height: 16 } };
    });

    // The names of bodies that are on top of each other, like the Earth and the Moon, are put one under the other
    const placed = [...taken];

    for (const label of labels.slice(0, important.length)) {
        while (placed.some((other) => overlap(label.box, other))) {
            label.y += 14;
            label.box.y += 14;
        }

        placed.push(label.box);
    }

    // The important ones come first in the list: the others only get a place where there is room
    const shown = chooseLabels(
        labels.map((label) => label.box),
        important.length,
        taken,
    );

    labels.forEach(({ index, text, x, y }, i) => {
        if (!shown[i]) return;

        const emphasis = route.includes(index) || index === hovered;

        context.font = `${emphasis ? '600 ' : ''}12px system-ui, sans-serif`;
        context.lineWidth = 3;
        context.lineJoin = 'round';
        context.strokeStyle = 'rgba(8, 12, 24, 0.85)';
        context.strokeText(text, x, y + 4);
        context.fillStyle = emphasis ? '#ffffff' : 'rgba(226, 232, 240, 0.75)';
        context.fillText(text, x, y + 4);
    });
}

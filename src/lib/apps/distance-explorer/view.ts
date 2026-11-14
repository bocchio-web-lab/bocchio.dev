import type { Vec3 } from './vec';

/**
 * Where the viewer is, looking at the origin: the angle round the z axis (the longitude), the angle above the xy plane
 * (the latitude), and how much it is zoomed. On the globe, `yaw` and `pitch` are the longitude and latitude that are in the middle.
 */
export interface View {
    yaw: number;
    pitch: number;
    zoom: number;
}

/** The three directions of the screen, as vectors: to the right, up, and towards the viewer. */
export interface Frame {
    right: Vec3;
    up: Vec3;
    toward: Vec3;
}

export function frameOf({ yaw, pitch }: View): Frame {
    const [sinYaw, cosYaw] = [Math.sin(yaw), Math.cos(yaw)];
    const [sinPitch, cosPitch] = [Math.sin(pitch), Math.cos(pitch)];

    return {
        right: [-sinYaw, cosYaw, 0],
        up: [-sinPitch * cosYaw, -sinPitch * sinYaw, cosPitch],
        toward: [cosPitch * cosYaw, cosPitch * sinYaw, sinPitch],
    };
}

/** Where a point is on the screen, in the units of the point: to the right, up, and how near to the viewer (which is the depth). */
export function toScreen({ right, up, toward }: Frame, [x, y, z]: Vec3): Vec3 {
    return [x * right[0] + y * right[1] + z * right[2], x * up[0] + y * up[1] + z * up[2], x * toward[0] + y * toward[1] + z * toward[2]];
}

/** The point that is at a place on the screen, with a depth: the opposite of `toScreen`. */
export function fromScreen({ right, up, toward }: Frame, [x, y, depth]: Vec3): Vec3 {
    return [x * right[0] + y * up[0] + depth * toward[0], x * right[1] + y * up[1] + depth * toward[1], x * right[2] + y * up[2] + depth * toward[2]];
}

const POLE = Math.PI / 2 - 0.01;

/** The view after the pointer has been dragged by (dx, dy) pixels, on something that is `radius` pixels big: it follows the pointer. */
export function turn(view: View, dx: number, dy: number, radius: number): View {
    return { ...view, yaw: view.yaw - dx / radius, pitch: Math.max(-POLE, Math.min(POLE, view.pitch + dy / radius)) };
}

/** The view after it is zoomed by a factor, but not beyond the limits. */
export function zoom(view: View, factor: number, [least, most]: [number, number]): View {
    return { ...view, zoom: Math.max(least, Math.min(most, view.zoom * factor)) };
}

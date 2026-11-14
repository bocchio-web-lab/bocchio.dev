import { Tone } from './audio';
import { Bend, Grid } from './field';
import { MotionPicture, SandLayer } from './renderer';
import { amplitudes, couplings, hertzPerOmega, overallResponse, reachableModes, shakingFactor } from './response';
import { analyzePlate, type PlateModes } from './ritz';
import { Sand } from './sand';
import { createShape, defaultParameter, type PlateShape, type ShapeId } from './shapes';
import { downloadBlob } from './download';
import { DEFAULT_CAMERA, createMesh, type Camera, type Mesh } from './view3d';

/** Cells along the side of the grid that the sand reads the bend of the plate from. */
const GRID_SIZE = 96;

/** How many hops of the sand there are in a second. */
const SHAKES_PER_SECOND = 150;

/** How slowly the plate is shown to move in the animations, in oscillations per second. */
const SLOW_MOTION = 1.1;

/** The shaking, in units of the strength that lifts a grain, at which a plate counts as resonating as much as it can. */
const BEST_SHAKING = 3;

/** Wait before analysing again, so that dragging a slider does not make an analysis for every tick. */
const REANALYSE_DELAY = 220;

export type ViewMode = 'sand' | 'model';

/** What the page needs for a plate whose modes are known: all that depends on its shape only. */
interface Prepared {
    shape: PlateShape;
    modes: PlateModes;
    grid: Grid;
    mesh: Mesh;
    meshBend: Bend;
    sand: Sand;
    motion: MotionPicture;
}

/** Gives the browser a moment to show the "busy" state before the analysis takes the page over. */
function breathe(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 40));
}

/** Everything the Chladni plates page knows and does: the plate, how it is shaken, the sand, how it is shown. */
export class ChladniStudio {
    // The plate
    shapeId = $state<ShapeId>('square');
    parameter = $state(defaultParameter('square'));
    /** The side, in centimetres, of a square plate of the same area. */
    size = $state(20);
    /** In millimetres. */
    thickness = $state(1);

    // The shaker
    drive = $state.raw({ x: 0, y: 0 });
    frequency = $state(0);
    /** How narrow the resonances are: the higher, the nearer to the frequency of a mode the shaker has to be. */
    quality = $state(50);
    /** 1 is the normal strength. */
    power = $state(3);
    sound = $state(false);

    // How it is shown
    view = $state<ViewMode>('sand');
    camera = $state.raw<Camera>(DEFAULT_CAMERA);
    showMotion = $state(false);
    grains = $state(25000);

    /** The plate is being analysed. */
    busy = $state(false);
    /** What is known about the plate, once it has been analysed. */
    prepared = $state.raw<Prepared | null>(null);
    /** How strongly the shaker pushes each mode: it depends on where the shaker is. */
    coupling = $state.raw<Float64Array>(new Float64Array(0));

    /** The biggest bend on the plate at the moment, which the colours and the height of the 3D view are in proportion to. */
    peak = $state(1);
    /** How hard the plate shakes the sand at its most, in units of the strength that lifts a grain. */
    strongest = $state(0);

    /** Hertz for one unit of the frequencies of the modes. */
    scale = $derived(hertzPerOmega(this.size, this.thickness));

    /** The frequencies at which the plate resonates with a mode that the shaker reaches. */
    resonances = $derived(
        this.prepared
            ? reachableModes(this.prepared.modes, this.coupling).map(({ mode, omega, coupling }) => ({ mode, frequency: omega * this.scale, coupling }))
            : [],
    );

    /** The frequencies the slider goes between. */
    range = $derived.by(() => {
        const modes = this.prepared?.modes;
        if (!modes) return { min: 20, max: 2000 };

        return { min: Math.max(10, Math.floor(0.5 * modes.omega[0] * this.scale)), max: Math.ceil(modes.omega[modes.count - 1] * this.scale) };
    });

    /** How much the plate resonates at the frequency of the shaker, from 0 to 1 compared to its best. */
    resonance = $derived.by(() => {
        const prepared = this.prepared;
        if (!prepared) return 0;

        return Math.min(1, this.strongest / BEST_SHAKING);
    });

    /** The moment of the oscillation that the animations are at, in radians. */
    phase = 0;
    /** Goes up whenever what is drawn changes (the sand moves, the shaker is moved...): the picture is only drawn again then. */
    revision = 0;
    /** The sand layer is shared by the views: it is only a place to draw on. */
    readonly layer = new SandLayer();

    #cache = new Map<string, PlateModes>();
    #request = 0;
    #reanalyse: ReturnType<typeof setTimeout> | undefined;
    #leftover = 0;
    #tone = new Tone();

    // Choosing the plate

    async selectShape(id: ShapeId): Promise<void> {
        this.shapeId = id;
        this.parameter = defaultParameter(id);

        await this.#analyse();
    }

    /** Changes the shape of the plate a little (how long, how many petals...), a moment after the last change. */
    setParameter(value: number): void {
        this.parameter = value;

        clearTimeout(this.#reanalyse);
        this.#reanalyse = setTimeout(() => this.#analyse(), REANALYSE_DELAY);
    }

    setSize(size: number): void {
        this.#rescale(() => (this.size = size));
    }

    setThickness(thickness: number): void {
        this.#rescale(() => (this.thickness = thickness));
    }

    /** Changes the size or the thickness, which changes the pitch of the plate: the figure stays, at the new frequency. */
    #rescale(change: () => void): void {
        const omega = this.frequency / this.scale;

        change();
        this.setFrequency(omega * this.scale);
    }

    async #analyse(): Promise<void> {
        const request = ++this.#request;

        this.busy = true;
        await breathe();

        const key = `${this.shapeId}:${this.parameter}`;
        const shape = createShape(this.shapeId, this.parameter);
        let modes = this.#cache.get(key);

        if (!modes) {
            modes = analyzePlate(shape);
            this.#cache.set(key, modes);
        }

        // Somebody asked for another plate while this one was being worked out
        if (request !== this.#request) return;

        const grid = new Grid(modes, GRID_SIZE);
        const mesh = createMesh(shape);
        const meshBend = new Bend(modes, mesh.points);

        this.prepared = {
            shape,
            modes,
            grid,
            mesh,
            meshBend,
            sand: new Sand(this.grains, shape),
            motion: new MotionPicture(grid, shape),
        };

        // The shaker starts in the middle of the plate, where the figures of the experiments are made
        this.drive = { x: 0, y: 0 };
        this.coupling = couplings(modes, 0, 0);

        this.frequency = this.#favourite();
        this.#refresh();
        this.busy = false;
    }

    /** A resonance that makes a figure worth looking at: not the first ones, which are plain, nor the last. */
    #favourite(): number {
        const { resonances } = this;

        if (resonances.length === 0) return this.range.min;

        return resonances[Math.min(resonances.length - 1, 3)].frequency;
    }

    // The shaker

    /** Puts the shaker at a point of the plate, if the point is on it. */
    moveDrive(x: number, y: number): void {
        const prepared = this.prepared;
        if (!prepared || !prepared.shape.contains(x, y)) return;

        this.drive = { x, y };
        this.coupling = couplings(prepared.modes, x, y);
        this.#refresh();
    }

    setFrequency(frequency: number): void {
        const { min, max } = this.range;

        this.frequency = Math.max(min, Math.min(max, frequency));
        this.#refresh();
    }

    /** Goes to the next resonance up or down, if there is one. */
    stepResonance(direction: 1 | -1): void {
        const frequencies = this.resonances.map((resonance) => resonance.frequency);
        const here = this.frequency;
        const next = direction === 1 ? frequencies.find((f) => f > here * 1.0005) : [...frequencies].reverse().find((f) => f < here * 0.9995);

        if (next !== undefined) this.setFrequency(next);
    }

    /** Sets the quality factor or the power and works out the bend again. */
    setQuality(quality: number): void {
        this.quality = quality;
        this.#refresh();
    }

    setPower(power: number): void {
        this.power = power;
        this.#refresh();
    }

    /** The bend of the plate at the frequency of the shaker, over the grid and the mesh. */
    #refresh(): void {
        const prepared = this.prepared;
        if (!prepared) return;

        const omega = this.frequency / this.scale;
        const a = amplitudes(prepared.modes, this.coupling, omega, this.quality);

        prepared.grid.bend.combine(a);
        prepared.meshBend.combine(a);

        let peak = 0;
        const { re, im } = prepared.grid.bend;
        for (let i = 0; i < re.length; i++) peak = Math.max(peak, Math.hypot(re[i], im[i]));

        this.peak = Math.max(peak, 1e-12);
        this.strongest = this.#shaking() * peak;
        this.revision++;

        this.#updateSound();
    }

    /** What the bend of the plate has to be multiplied by to get the shaking that the grains feel. */
    #shaking(): number {
        const omega = this.frequency / this.scale;

        return shakingFactor(this.power) * omega * omega;
    }

    // The sand

    /** Lets the sand go on: `dt` seconds have passed. */
    advance(dt: number): void {
        const prepared = this.prepared;
        if (!prepared || this.busy) return;

        this.phase += 2 * Math.PI * SLOW_MOTION * dt;

        // Hops come at a fixed rate, whatever the speed of the screen
        this.#leftover += dt * SHAKES_PER_SECOND;
        const gain = this.#shaking();

        let moved = 0;

        while (this.#leftover >= 1) {
            moved += prepared.sand.shake(prepared.grid, gain);
            this.#leftover -= 1;
        }

        if (moved > 0) this.revision++;
    }

    scatter(): void {
        this.prepared?.sand.scatter();
        this.revision++;
    }

    /** Uses as many grains as asked for, on the same plate. */
    setGrains(count: number): void {
        this.grains = count;

        const prepared = this.prepared;
        if (prepared) this.prepared = { ...prepared, sand: new Sand(count, prepared.shape) };

        this.revision++;
    }

    // The sound

    setSound(on: boolean): void {
        this.sound = on;

        if (on) this.#tone.start();
        else this.#tone.stop();

        this.#updateSound();
    }

    #updateSound(): void {
        if (this.sound) this.#tone.set(this.frequency, this.resonance);
    }

    /** Saves what the canvas shows as a picture. */
    exportPng(canvas: HTMLCanvasElement): void {
        const name = `chladni-${this.shapeId}-${Math.round(this.frequency)}hz.png`;

        canvas.toBlob((blob) => blob && downloadBlob(blob, name));
    }

    /** What the page does when it is left. */
    dispose(): void {
        clearTimeout(this.#reanalyse);
        this.#tone.stop();
    }
}

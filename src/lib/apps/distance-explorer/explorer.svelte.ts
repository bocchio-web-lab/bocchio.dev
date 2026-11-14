import { BODIES, type Body } from './catalog';
import { antipode } from './earth';
import { fitGlobe } from './globe';
import { MAX_STOPS, describeEarthRoute, describeSpaceRoute, type Place } from './route';
import { fitZoom } from './space-map';
import { zoom, type View } from './view';

/** What is measured: the surface of the Earth, or space. */
export type Scale = 'earth' | 'space';

const DEFAULT_VIEWS: Record<Scale, View> = {
    // Europe and Africa in the middle of the globe, and space seen from above and from the side
    earth: { yaw: 0.2, pitch: 0.6, zoom: 1 },
    space: { yaw: -0.8, pitch: 1, zoom: 1 },
};

/** How far each picture can be zoomed: the land of the globe is made of cells of a quarter of a degree, which are seen beyond this. */
const ZOOM_LIMITS: Record<Scale, [number, number]> = { earth: [0.8, 8], space: [0.8, 40] };

/** The days that the positions of the planets can be worked out for. */
export const FIRST_DAY = '1800-01-01';
export const LAST_DAY = '2050-12-31';

const today = (): string => new Date().toISOString().slice(0, 10);

/** Everything that the page knows and does: what is measured, the route on the Earth and the one in space, and the picture of them. */
export class DistanceExplorer {
    scale = $state<Scale>('earth');
    views = $state.raw<Record<Scale, View>>(DEFAULT_VIEWS);

    /** The route on the Earth, and the one in space. */
    places = $state.raw<Place[]>([]);
    bodies = $state.raw<Body[]>([]);

    /** The day of the planets, as YYYY-MM-DD. */
    day = $state(today());

    view = $derived(this.views[this.scale]);
    moment = $derived(new Date(`${this.day}T12:00:00Z`));

    /** Where every body is on the day. */
    positions = $derived(BODIES.map((body) => body.positionAt(this.moment)));
    /** The bodies of the route, as their places in the list of all of them. */
    routeIndices = $derived(this.bodies.map((body) => BODIES.indexOf(body)));

    summary = $derived(this.scale === 'earth' ? describeEarthRoute(this.places) : describeSpaceRoute(this.bodies, this.moment));
    full = $derived((this.scale === 'earth' ? this.places : this.bodies).length >= MAX_STOPS);

    setScale(scale: Scale): void {
        this.scale = scale;
    }

    // The picture

    setView(view: View): void {
        this.views = { ...this.views, [this.scale]: view };
    }

    /** Shows the whole route: the globe turned to it and zoomed to hold it, or the map zoomed to hold its farthest body. */
    fit(): void {
        const limits = ZOOM_LIMITS[this.scale];

        if (this.scale === 'earth') {
            this.setView(zoom(this.places.length ? fitGlobe(this.places) : DEFAULT_VIEWS.earth, 1, limits));
        } else {
            const positions = this.bodies.map((body) => body.positionAt(this.moment));

            this.setView(zoom({ ...this.view, zoom: positions.length ? fitZoom(positions) : 1 }, 1, limits));
        }
    }

    zoomBy(factor: number): void {
        this.setView(zoom(this.view, factor, ZOOM_LIMITS[this.scale]));
    }

    // The route

    /** Adds a place to the route on the Earth, and turns the globe to show it if it is asked to. */
    addPlace(place: Place, show = false): void {
        if (this.full) return;

        this.places = [...this.places, place];

        if (show) this.views = { ...this.views, earth: { ...this.views.earth, yaw: (place.lon * Math.PI) / 180, pitch: (place.lat * Math.PI) / 180 } };
    }

    /** Adds the place on the other side of the Earth from the last one: the tunnel between them goes through the centre. */
    addAntipode(): void {
        const last = this.places.at(-1);

        if (last) this.addPlace({ ...antipode(last), name: last.name ? `Antipode of ${last.name}` : 'Antipode' }, true);
    }

    addBody(body: Body): void {
        if (this.full) return;

        this.bodies = [...this.bodies, body];
        this.frameBodies();
    }

    remove(index: number): void {
        if (this.scale === 'earth') {
            this.places = this.places.filter((_, i) => i !== index);
        } else {
            this.bodies = this.bodies.filter((_, i) => i !== index);
            this.frameBodies();
        }
    }

    clear(): void {
        if (this.scale === 'earth') {
            this.places = [];
        } else {
            this.bodies = [];
            this.frameBodies();
        }
    }

    /** The map follows the route, so that the planets are not a speck next to the Sun when they are what is measured. A single body leaves it as it is. */
    private frameBodies(): void {
        if (this.bodies.length !== 1) this.fit();
    }

    setDay(day: string): void {
        if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day >= FIRST_DAY && day <= LAST_DAY) this.day = day;
    }

    setToday(): void {
        this.setDay(today());
    }
}

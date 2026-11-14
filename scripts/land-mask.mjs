// Makes `src/lib/apps/distance-explorer/land.ts`: the land of the Earth as a grid of cells, from the Natural Earth data
// (public domain) in the `world-atlas` package. It is only run when the map has to be made again, so the data is not
// a dependency of the site.
//
//   npm pack world-atlas && tar -xzf world-atlas-*.tgz
//   node scripts/land-mask.mjs package/land-50m.json > src/lib/apps/distance-explorer/land.ts
import { readFileSync } from 'node:fs';

const CELLS_PER_DEGREE = 4;
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const topology = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const { scale, translate } = topology.transform;

// The arcs of a TopoJSON file are stored as differences between points that are rounded to a grid
const arcs = topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;

    return arc.map(([dx, dy]) => {
        x += dx;
        y += dy;
        return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
});

// A ring is made of arcs, and an arc with a negative number is walked backwards
function ring(indices) {
    const points = [];

    for (const index of indices) {
        const arc = index >= 0 ? arcs[index] : arcs[~index].slice().reverse();
        points.push(...(points.length ? arc.slice(1) : arc));
    }

    return points;
}

// Antarctica goes round the pole: its coast starts and ends on the line where the map is cut, and the ring has to be
// closed by going down to the pole and back
function closeAroundThePole(points) {
    const closed = [];

    points.forEach((point, i) => {
        if (i > 0 && Math.abs(point[0] - points[i - 1][0]) > 180) {
            const east = points[i - 1][0] > 0 ? 180 : -180;
            const pole = point[1] < 0 ? -90 : 90;

            closed.push([east, points[i - 1][1]], [east, pole], [-east, pole], [-east, point[1]]);
        }

        closed.push(point);
    });

    return closed;
}

const polygons = topology.objects.land.geometries[0].arcs.map((polygon) => polygon.map((indices) => closeAroundThePole(ring(indices))));

const width = 360 * CELLS_PER_DEGREE;
const height = 180 * CELLS_PER_DEGREE;
const land = new Uint8Array(width * height);

// Each row of cells is filled between the points where the rings cross it, one in and one out (holes are the outs)
for (const rings of polygons) {
    for (let row = 0; row < height; row++) {
        const latitude = 90 - (row + 0.5) / CELLS_PER_DEGREE;
        const crossings = [];

        for (const points of rings) {
            for (let i = 1; i < points.length; i++) {
                const [x1, y1] = points[i - 1];
                const [x2, y2] = points[i];

                if ((y1 <= latitude) !== (y2 <= latitude)) crossings.push(x1 + ((latitude - y1) / (y2 - y1)) * (x2 - x1));
            }
        }

        crossings.sort((a, b) => a - b);

        for (let c = 0; c + 1 < crossings.length; c += 2) {
            const first = Math.max(0, Math.ceil((crossings[c] + 180) * CELLS_PER_DEGREE - 0.5));
            const last = Math.min(width - 1, Math.floor((crossings[c + 1] + 180) * CELLS_PER_DEGREE - 0.5));

            for (let column = first; column <= last; column++) land[row * width + column] = 1;
        }
    }
}

// A row is written as the lengths of its runs of cells, the sea first, each as two characters
const rows = [];

for (let row = 0; row < height; row++) {
    let text = '';
    let value = 0;
    let length = 0;

    const end = () => (text += BASE64[length >> 6] + BASE64[length & 63]);

    for (let column = 0; column < width; column++) {
        if (land[row * width + column] !== value) {
            end();
            value = 1 - value;
            length = 0;
        }
        length++;
    }

    end();
    rows.push(text);
}

console.log(`// The land of the Earth as a grid of cells, made by \`scripts/land-mask.mjs\` from the Natural Earth land (public domain): do not edit.
// There is a line of text for every row of cells, from the north to the south, which is a list of runs of cells, the sea
// first and then the land, one after the other. A run is two characters of the Base64 alphabet: its length in cells.

export const LAND_CELLS_PER_DEGREE = ${CELLS_PER_DEGREE};

export const LAND_ROWS = \`
${rows.join('\n')}
\`
    .trim()
    .split('\\n');`);

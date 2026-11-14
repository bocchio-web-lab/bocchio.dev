import type { LatLon } from './earth';

export const KM_PER_AU = 149_597_870.7;
export const KM_PER_LIGHT_YEAR = 9_460_730_472_580.8;
export const KM_PER_MILE = 1.609344;

/** The speed of light, in kilometres per second. */
export const LIGHT_SPEED = 299_792.458;

const SECONDS_PER_YEAR = 365.25 * 86_400;

/** A number with that many digits that count: 4.2465 is 4.25 and 26,670 is 26,700. */
function significant(value: number, digits: number): string {
    if (value === 0) return '0';

    let magnitude = Math.floor(Math.log10(Math.abs(value)));
    const step = 10 ** (magnitude - digits + 1);
    const rounded = Math.round(value / step) * step;

    // 9.996 is rounded up to 10, which has one digit less after the point
    if (Math.abs(rounded) >= 10 ** (magnitude + 1)) magnitude += 1;

    const decimals = Math.max(0, digits - 1 - magnitude);

    return rounded.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** A number of kilometres (or miles), whole, unless it is very small. */
export function kilometres(km: number): string {
    return km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString('en-US');
}

/** A distance on the Earth, in kilometres and in miles. */
export function formatEarth(km: number): string {
    return `${kilometres(km)} km · ${kilometres(km / KM_PER_MILE)} mi`;
}

/** A distance in space, in the unit that suits it: kilometres, astronomical units (the distance to the Sun) or light-years. */
export function formatDistance(km: number): string {
    if (km < 1e7) return `${significant(km, 4)} km`;
    if (km < 0.1 * KM_PER_LIGHT_YEAR) return `${significant(km / KM_PER_AU, 3)} AU`;

    const years = km / KM_PER_LIGHT_YEAR;

    return years < 1e6 ? `${significant(years, 3)} ly` : `${significant(years / 1e6, 3)} million ly`;
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** A long distance in kilometres, in words (million, billion...) and then as a power of ten. */
export function formatKilometres(km: number): string {
    if (km < 1e9) return `${significant(km / 1e6, 4)} million km`;
    if (km < 1e12) return `${significant(km / 1e9, 3)} billion km`;
    if (km < 1e15) return `${significant(km / 1e12, 3)} trillion km`;

    const exponent = Math.floor(Math.log10(km));
    const power = [...String(exponent)].map((digit) => SUPERSCRIPT[Number(digit)]).join('');

    return `${significant(km / 10 ** exponent, 2)} × 10${power} km`;
}

/** A time, in the unit that suits it, from seconds to millions of years. */
export function formatDuration(seconds: number): string {
    if (seconds < 59.5) return `${significant(seconds, 2)} s`;

    const total = Math.round(seconds);

    if (seconds < 3600) return `${Math.floor(total / 60)} min ${total % 60} s`;

    const minutes = Math.round(seconds / 60);

    if (seconds < 86_400) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
    if (seconds < SECONDS_PER_YEAR) return `${significant(seconds / 86_400, 3)} days`;

    const years = seconds / SECONDS_PER_YEAR;

    return years < 1e6 ? `${significant(years, 3)} years` : `${significant(years / 1e6, 3)} million years`;
}

/** 41.90° N, 12.50° E */
export function formatCoordinates({ lat, lon }: LatLon): string {
    return `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(2)}° ${lon < 0 ? 'W' : 'E'}`;
}

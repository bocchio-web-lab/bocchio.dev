import type { LatLon } from './earth';

export interface City extends LatLon {
    name: string;
}

/** Places that are easy to find on a map, to start a route from. */
export const CITIES: City[] = [
    // Europe
    { name: 'Athens', lat: 37.98, lon: 23.73 },
    { name: 'Berlin', lat: 52.52, lon: 13.4 },
    { name: 'Genoa', lat: 44.41, lon: 8.93 },
    { name: 'Istanbul', lat: 41.01, lon: 28.98 },
    { name: 'Lisbon', lat: 38.72, lon: -9.14 },
    { name: 'London', lat: 51.51, lon: -0.13 },
    { name: 'Madrid', lat: 40.42, lon: -3.7 },
    { name: 'Milan', lat: 45.46, lon: 9.19 },
    { name: 'Moscow', lat: 55.76, lon: 37.62 },
    { name: 'Paris', lat: 48.86, lon: 2.35 },
    { name: 'Reykjavik', lat: 64.15, lon: -21.94 },
    { name: 'Rome', lat: 41.9, lon: 12.5 },
    { name: 'Stockholm', lat: 59.33, lon: 18.07 },
    { name: 'Vienna', lat: 48.21, lon: 16.37 },

    // Africa
    { name: 'Addis Ababa', lat: 9.03, lon: 38.74 },
    { name: 'Cairo', lat: 30.04, lon: 31.24 },
    { name: 'Cape Town', lat: -33.92, lon: 18.42 },
    { name: 'Casablanca', lat: 33.57, lon: -7.59 },
    { name: 'Dakar', lat: 14.69, lon: -17.45 },
    { name: 'Johannesburg', lat: -26.2, lon: 28.05 },
    { name: 'Lagos', lat: 6.52, lon: 3.38 },
    { name: 'Nairobi', lat: -1.29, lon: 36.82 },

    // Asia
    { name: 'Bangkok', lat: 13.76, lon: 100.5 },
    { name: 'Beijing', lat: 39.9, lon: 116.41 },
    { name: 'Delhi', lat: 28.61, lon: 77.21 },
    { name: 'Dhaka', lat: 23.81, lon: 90.41 },
    { name: 'Dubai', lat: 25.2, lon: 55.27 },
    { name: 'Hong Kong', lat: 22.32, lon: 114.17 },
    { name: 'Jakarta', lat: -6.21, lon: 106.85 },
    { name: 'Karachi', lat: 24.86, lon: 67.01 },
    { name: 'Manila', lat: 14.6, lon: 120.98 },
    { name: 'Mumbai', lat: 19.08, lon: 72.88 },
    { name: 'Seoul', lat: 37.57, lon: 126.98 },
    { name: 'Shanghai', lat: 31.23, lon: 121.47 },
    { name: 'Singapore', lat: 1.35, lon: 103.82 },
    { name: 'Tehran', lat: 35.69, lon: 51.39 },
    { name: 'Tokyo', lat: 35.68, lon: 139.69 },
    { name: 'Ulaanbaatar', lat: 47.89, lon: 106.91 },

    // Oceania
    { name: 'Auckland', lat: -36.85, lon: 174.76 },
    { name: 'Melbourne', lat: -37.81, lon: 144.96 },
    { name: 'Perth', lat: -31.95, lon: 115.86 },
    { name: 'Sydney', lat: -33.87, lon: 151.21 },
    { name: 'Wellington', lat: -41.29, lon: 174.78 },

    // North America
    { name: 'Anchorage', lat: 61.22, lon: -149.9 },
    { name: 'Chicago', lat: 41.88, lon: -87.63 },
    { name: 'Havana', lat: 23.11, lon: -82.37 },
    { name: 'Honolulu', lat: 21.31, lon: -157.86 },
    { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
    { name: 'Mexico City', lat: 19.43, lon: -99.13 },
    { name: 'Miami', lat: 25.76, lon: -80.19 },
    { name: 'New York', lat: 40.71, lon: -74.01 },
    { name: 'San Francisco', lat: 37.77, lon: -122.42 },
    { name: 'Toronto', lat: 43.65, lon: -79.38 },
    { name: 'Vancouver', lat: 49.28, lon: -123.12 },
    { name: 'Washington', lat: 38.91, lon: -77.04 },

    // South America
    { name: 'Bogotá', lat: 4.71, lon: -74.07 },
    { name: 'Buenos Aires', lat: -34.6, lon: -58.38 },
    { name: 'Lima', lat: -12.05, lon: -77.04 },
    { name: 'Quito', lat: -0.18, lon: -78.47 },
    { name: 'Rio de Janeiro', lat: -22.91, lon: -43.17 },
    { name: 'Santiago', lat: -33.45, lon: -70.67 },
    { name: 'São Paulo', lat: -23.55, lon: -46.63 },
    { name: 'Ushuaia', lat: -54.8, lon: -68.3 },

    // The ends of the Earth
    { name: 'McMurdo Station', lat: -77.85, lon: 166.67 },
    { name: 'North Pole', lat: 90, lon: 0 },
    { name: 'South Pole', lat: -90, lon: 0 },
].sort((a, b) => a.name.localeCompare(b.name));

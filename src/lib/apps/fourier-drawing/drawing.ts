import { boundsOf, buildPath, orderStrokes } from './path';
import { analyze, type Spectrum } from './spectrum';
import type { Bounds, Raster, SampledPath } from './types';
import { extractStrokes, type AnalysisOptions } from './vision/pipeline';

/** A drawing ready to be played: the path to follow and the circles that make it. */
export interface Drawing {
    /** The samples that were analysed. */
    path: SampledPath;
    spectrum: Spectrum;
    bounds: Bounds;
    /** How many separate strokes make up the drawing. */
    strokes: number;
}

export function drawingFromPath(path: SampledPath, strokes: number): Drawing {
    return { path, spectrum: analyze(path), bounds: boundsOf(path.x, path.y), strokes };
}

/** Finds the lines of a picture and turns them into a drawing, or returns null when it has none. */
export function traceDrawing(raster: Raster, options: AnalysisOptions): Drawing | null {
    const strokes = extractStrokes(raster, options);

    if (strokes.length === 0) return null;

    return drawingFromPath(buildPath(orderStrokes(strokes)), strokes.length);
}

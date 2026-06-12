import type { LayoutLoad } from './$types';
import { getOptimizedOgImage } from '$lib/utils/app';

export const load: LayoutLoad = () => {
    return {
        title: 'Bocchio',
        description: 'The official personal website of Tommaso Bocchietti, a Mechatronics & Robotics Engineer.',
        keywords: 'Tommaso Bocchietti, Portfolio, Personal Website, Mechatronics Engineer',
        imageURL: getOptimizedOgImage(),
    };
};
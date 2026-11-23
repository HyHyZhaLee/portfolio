import { todo } from './placeholder';
import { profile } from './profile';

/** A repository the Open source section shows until live data arrives, or when the API cannot supply it (SITE-005). */
export interface FallbackRepo {
    name: string;
    url: string;
    description: string;
}

function repo(name: string, words: number): FallbackRepo {
    return { name, url: `${profile.links.github}/${name}`, description: todo(`${name} description`, words) };
}

/**
 * Six repositories, as many as the section shows live, so swapping in live data never changes its height (PF-007 D3).
 * Names and URLs are the owner's public repositories (Tier A), in the order the live rule gave on 2026-11-23: the two
 * featured ones, then the most recently pushed. Descriptions stay placeholders until PF-012 (PF-003 D2).
 */
export const fallbackRepos: readonly FallbackRepo[] = [
    repo('BK2023_Thesis_SmartPole', 14),
    repo('portfolio', 14),
    repo('Intelligent-Systems-Project', 12),
    repo('TrainningReactAndSpring', 12),
    repo('TrainningReactjsAndNextjs', 12),
    repo('TRAINING_WPF_and_WindowsApplications', 12),
];

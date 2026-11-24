import { profile } from './profile';

/** A repository the Open source section shows until live data arrives, or when the API cannot supply it (SITE-005). */
export interface FallbackRepo {
    name: string;
    url: string;
    description: string;
}

function repo(name: string, description: string): FallbackRepo {
    return { name, url: `${profile.links.github}/${name}`, description };
}

/**
 * Six repositories, as many as the section shows live, so swapping in live data never changes its height (PF-007 D3).
 * Names and URLs are the owner's public repositories (Tier A), in the order the live rule gave on 2026-11-23: the two
 * featured ones, then the most recently pushed. Descriptions are the owner-reviewed one-liners (PF-012).
 */
export const fallbackRepos: readonly FallbackRepo[] = [
    repo('BK2023_Thesis_SmartPole', 'Capstone smart pole prototype: ESP32 firmware, NB-IoT messaging, edge-AI traffic video and a Flutter monitoring app.'),
    repo('portfolio', 'Personal portfolio and live full-stack demo: React, Spring Boot and PostgreSQL on free tiers.'),
    repo(
        'Intelligent-Systems-Project',
        'Full-stack handwritten digit recognition web app: React frontend, FastAPI backend, SVM, Random Forest and neural network models.',
    ),
    repo('TrainningReactAndSpring', 'Training exercise in Java: a Spring Boot employee management backend.'),
    repo('TrainningReactjsAndNextjs', 'Training exercises in React and Next.js with TypeScript and JavaScript.'),
    repo('TRAINING_WPF_and_WindowsApplications', 'Training exercises in C#: a first WPF project and a Windows C++ desktop app.'),
];

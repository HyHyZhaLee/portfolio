import { todo } from './placeholder';

export interface Principle {
    title: string;
    body: string;
    example: string;
}

export const howIWorkIntro = todo('how I work intro', 9);

/** Six working habits, each with one example from real work (content plan §7.1). */
export const principles: readonly Principle[] = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: todo(`principle ${n} title`),
    body: todo(`principle ${n} body`, 25),
    example: todo(`principle ${n} example`, 16),
}));

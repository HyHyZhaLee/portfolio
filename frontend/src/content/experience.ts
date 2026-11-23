import { todo } from './placeholder';

export interface Role {
    organization: string;
    title: string;
    period: string;
    summary: string;
    current: boolean;
}

/** Three roles, newest first (content plan §7.1). */
export const roles: readonly Role[] = [1, 2, 3].map((n) => ({
    organization: todo(`role ${n} organization`),
    title: todo(`role ${n} title`, 7),
    period: todo(`role ${n} period`),
    summary: todo(`role ${n} summary`, 32),
    current: n === 1,
}));

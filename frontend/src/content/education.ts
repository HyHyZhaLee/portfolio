import { todo } from './placeholder';

export interface EducationItem {
    title: string;
    detail: string;
}

export const degrees: readonly EducationItem[] = [1, 2].map((n) => ({ title: todo(`degree ${n}`, 10), detail: todo(`degree ${n} detail`, 12) }));

export const awards: readonly EducationItem[] = [1, 2].map((n) => ({ title: todo(`award ${n}`, 8), detail: todo(`award ${n} detail`, 10) }));

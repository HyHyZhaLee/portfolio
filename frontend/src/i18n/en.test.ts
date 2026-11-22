import { describe, expect, it } from 'vitest';
import { t } from './en';

describe('t', () => {
    it('returns the plain string', () => {
        expect(t('notFound.heading')).toBe('Page not found');
    });

    it('fills placeholders and keeps unknown ones', () => {
        expect(t('notFound.body', { path: '/missing' })).toBe('The page /missing does not exist.');
        expect(t('notFound.body')).toBe('The page {path} does not exist.');
    });
});

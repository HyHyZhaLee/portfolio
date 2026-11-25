import { describe, expect, it } from 'vitest';
import { appVersion, versionLink } from './appVersion';

const repository = 'https://github.com/example/repo';

describe('appVersion', () => {
    it('is v plus the version in package.json', () => {
        expect(appVersion()).toMatch(/^v\d+\.\d+\.\d+$/);
    });
});

describe('versionLink', () => {
    it.each([
        ['v1.0.0', `${repository}/releases/tag/v1.0.0`],
        ['v12.3.45', `${repository}/releases/tag/v12.3.45`],
        ['v1.0.0-3-gabc1234', null],
        ['dev', null],
    ])('maps %s to %s', (version, expected) => {
        expect(versionLink(version, repository)).toBe(expected);
    });
});

import { describe, expect, it } from 'vitest';
import { versionLink } from './appVersion';

const repository = 'https://github.com/example/repo';

describe('versionLink', () => {
    it.each([
        ['v1.0.0', `${repository}/releases/tag/v1.0.0`],
        ['v1.0.0-3-gabc1234', `${repository}/compare/v1.0.0...abc1234`],
        ['abc1234', `${repository}/commit/abc1234`],
        ['dev', null],
    ])('maps %s to %s', (version, expected) => {
        expect(versionLink(version, repository)).toBe(expected);
    });
});

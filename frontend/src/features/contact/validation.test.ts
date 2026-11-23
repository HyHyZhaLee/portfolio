import { describe, expect, it } from 'vitest';
import { contactSchema } from './validation';

const VALID = { name: 'Ada Example', email: 'visitor@example.com', message: 'Hello from a test.', website: '' };
const emailOfLength = (length: number) => `${'a'.repeat(length - '@example.com'.length)}@example.com`;

describe('contactSchema', () => {
    it.each([
        ['a 100-character name', { name: 'a'.repeat(100) }, true],
        ['a 101-character name', { name: 'a'.repeat(101) }, false],
        ['a whitespace-only name', { name: '   ' }, false],
        ['a 254-character email', { email: emailOfLength(254) }, true],
        ['a 255-character email', { email: emailOfLength(255) }, false],
        ['an address without @', { email: 'visitor.example.com' }, false],
        ['a 9-character message', { message: '123456789' }, false],
        ['a 10-character message', { message: '1234567890' }, true],
        ['a 2000-character message', { message: 'm'.repeat(2000) }, true],
        ['a 2001-character message', { message: 'm'.repeat(2001) }, false],
        ['a filled honeypot', { website: 'https://spam.example' }, true],
    ])('%s gives success %s', (_case, change, success) => {
        expect(contactSchema.safeParse({ ...VALID, ...change }).success).toBe(success);
    });

    it('trims the visible fields and passes the honeypot through unchanged', () => {
        const parsed = contactSchema.parse({ name: ' Ada ', email: ' visitor@example.com ', message: '  Hello there!  ', website: ' x ' });

        expect(parsed).toEqual({ name: 'Ada', email: 'visitor@example.com', message: 'Hello there!', website: ' x ' });
    });
});

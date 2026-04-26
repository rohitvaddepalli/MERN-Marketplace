import test from 'node:test';
import assert from 'node:assert';
import { escapeRegex, sanitizeSearchInput, MAX_SEARCH_LENGTH } from '../utils/securityUtils.js';

test('escapeRegex', async (t) => {
    await t.test('should escape special regex characters', () => {
        const input = '.*+?^${}()|[\]\\';
        const expected = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\';
        assert.strictEqual(escapeRegex(input), expected);
    });

    await t.test('should return empty string for non-string inputs', () => {
        assert.strictEqual(escapeRegex(null), '');
        assert.strictEqual(escapeRegex(undefined), '');
        assert.strictEqual(escapeRegex(123), '');
        assert.strictEqual(escapeRegex({}), '');
    });

    await t.test('should return empty string for empty input', () => {
        assert.strictEqual(escapeRegex(''), '');
    });

    await t.test('should leave normal characters untouched', () => {
        const input = 'hello123';
        assert.strictEqual(escapeRegex(input), input);
    });
});

test('sanitizeSearchInput', async (t) => {
    await t.test('should trim and escape input', () => {
        const input = '  hello^world  ';
        const expected = 'hello\\^world';
        assert.strictEqual(sanitizeSearchInput(input), expected);
    });

    await t.test('should limit length to MAX_SEARCH_LENGTH', () => {
        const longString = 'a'.repeat(MAX_SEARCH_LENGTH + 10);
        const result = sanitizeSearchInput(longString);
        assert.strictEqual(result.length, MAX_SEARCH_LENGTH);
        assert.strictEqual(result, 'a'.repeat(MAX_SEARCH_LENGTH));
    });

    await t.test('should return null for invalid inputs', () => {
        assert.strictEqual(sanitizeSearchInput(null), null);
        assert.strictEqual(sanitizeSearchInput(undefined), null);
        assert.strictEqual(sanitizeSearchInput(123), null);
    });

    await t.test('should return null for empty string (after trim)', () => {
        assert.strictEqual(sanitizeSearchInput('   '), null);
        assert.strictEqual(sanitizeSearchInput(''), null);
    });
});

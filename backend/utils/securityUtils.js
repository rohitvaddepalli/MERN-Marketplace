// Maximum length for search/filter inputs to prevent abuse
export const MAX_SEARCH_LENGTH = 100;

/**
 * Escapes special regex characters in a string to prevent ReDoS attacks
 * @param {string} str - Input string
 * @returns {string} - Escaped string safe for use in RegExp
 */
export const escapeRegex = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitizes and limits search input
 * @param {string} input - User input
 * @returns {string|null} - Sanitized input or null if invalid
 */
export const sanitizeSearchInput = (input) => {
    if (!input || typeof input !== 'string') return null;
    // Trim and check if empty
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Limit length
    const limited = trimmed.slice(0, MAX_SEARCH_LENGTH);
    // Escape regex special characters
    return escapeRegex(limited);
};

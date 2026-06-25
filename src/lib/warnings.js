import { log } from "./logger.js"

export function deprecation(newObj, oldPath, newPath, dateStr) {
    const wrapped = {};
    for (const [key, val] of Object.entries(newObj)) {
        if (typeof val === 'function') {
            wrapped[key] = async function (...args) {
                log.warn(`Deprecation Warning: '${oldPath}.${key}' is deprecated and will be removed on ${dateStr}. Please update your call to use '${newPath}.${key}' instead.`);
                return val(...args);
            };
        } else {
            wrapped[key] = val;
        }
    }
    return wrapped;
}

export const warn = {
    deprecation,
}
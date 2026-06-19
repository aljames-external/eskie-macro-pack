/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits until a condition function returns true.
 * @param {Function} condition - A function that returns a boolean.
 * @param {object} [options] - Optional parameters.
 * @param {number} [options.timeout=2000] - The maximum time to wait in milliseconds.
 * @param {number} [options.interval=100] - The interval at which to check the condition in milliseconds.
 * @returns {Promise<number>} A promise that resolves with the time elapsed in milliseconds, or rejects if the timeout is reached.
 */
async function waitUntil(condition, {timeout=2000, interval=100}={}) {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        const check = () => {
            try {
                if (condition()) {
                    resolve(performance.now() - startTime);
                } else if (performance.now() - startTime > timeout) {
                    reject(new Error("Timeout waiting for condition."));
                } else {
                    setTimeout(check, interval);
                }
            } catch (error) {
                reject(error);
            }
        };
        check();
    });
}

export const time = {
    wait,
    waitUntil,
}
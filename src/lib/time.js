async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntil(condition, {timeout=2000, interval=100}={}) {
    return new Promise((resolve, reject) => {
        const startTime = game.time.serverTime;
        const check = () => {
            if (condition()) {
                resolve(game.time.serverTime - startTime);
            } else if (game.time.serverTime - startTime > timeout) {
                reject(new Error("Timeout waiting for condition."));
            } else {
                setTimeout(check, interval);
            }
        };
        check();
    });
}

export const time = {
    wait,
    waitUntil,
}
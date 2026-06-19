import { MODULE_ID } from "../../lib/constants.js"

/* To be registered in socketlib */
async function editDoor(id, updates = {}) {
    if (!canvas.walls) return;
    const door = canvas.walls.get(id);
    if (!door) return;
    return door.document.update(updates);
}

export const doorSockets = {
    editDoor
};

function initialized(socket) {
    if (!socket) { ui.notifications.error("Eskie Macros | socketlib is not initialized"); }
    return !!socket;
}

async function edit(id, updates = {}) {
    if (game.user.isGM) return editDoor(id, updates);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("editDoor", id, updates);
}

async function lock(id) {
    return edit(id, {ds: CONST.WALL_DOOR_STATES.LOCKED})
}

async function unlock(id) {
    return edit(id, {ds: CONST.WALL_DOOR_STATES.CLOSED})
}

export const door = {
    edit,
    lock,
    unlock,
}

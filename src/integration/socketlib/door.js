import { MODULE_ID } from "../../lib/constants.js"
import { socketlib } from "../socketlib.js"

/* To be registered in socketlib */
async function editDoor(id, updates = {}) {
    const door = canvas.walls.get(id);
    if (!door) return;
    return door.document.update(updates);
}

export const doorSockets = {
    editDoor
};

async function edit(id, updates = {}) {
    if (game.user.isGM) return editDoor(id, updates);
    return socketlib.executeAsGM("editDoor", id, updates);
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

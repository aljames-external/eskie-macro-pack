import { MODULE_ID } from "../../../lib/constants.js";
import { socketlib } from "./instance.js";

/* To be registered in socketlib */
async function editDoor(id: any, updates: any = {}) {
    const door = canvas.walls.get(id);
    if (!door) return;
    return door.document.update(updates);
}

export const doorSockets = {
    editDoor
};

async function edit(id: any, updates: any = {}) {
    if (game.user.isGM) return editDoor(id, updates);
    return socketlib.executeAsGM("editDoor", id, updates);
}

async function lock(id: any) {
    return edit(id, {ds: CONST.WALL_DOOR_STATES.LOCKED})
}

async function unlock(id: any) {
    return edit(id, {ds: CONST.WALL_DOOR_STATES.CLOSED})
}

export const door = {
    edit,
    lock,
    unlock,
}

import { MODULE_ID } from '../lib/constants.js';
import { door, doorSockets } from './socketlib/door.js';
import { tile, tileSockets } from './socketlib/tile.js';
import { token, tokenSockets } from './socketlib/token.js';
import { tokenMaskSockets } from './socketlib/token-mask.js';
import { object } from './socketlib/object.js';

async function register() {
    const socket = socketlib.registerModule(MODULE_ID);
    const socketAPI = {
        doorSockets,
        tileSockets,
        tokenSockets,
        tokenMaskSockets
    };

    Object.entries(socketAPI).forEach(([_, api]) => {
        Object.entries(api).forEach(([key, value]) => {
            socket.register(key, value);
        });
    });
    game.modules.get(MODULE_ID).socketlib = socket;
}

export const socketlibapi = {
    register,
};

export const socket = {
    door,
    tile,
    token,
    object
}
import { MODULE_ID } from '../lib/constants.js';
import { tile, tileSockets } from './socketlib/tile.js';
import { door, doorSockets } from './socketlib/door.js';

async function register() {
    const socket = socketlib.registerModule(MODULE_ID);
    const socketAPI = {
        tileSockets,
        doorSockets,
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
    tile
}
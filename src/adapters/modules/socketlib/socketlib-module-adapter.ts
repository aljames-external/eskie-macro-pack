import { BaseModuleAdapter } from "../base-module-adapter.js";
import { MODULE_ID } from '../../../lib/constants.js';
import { door, doorSockets } from './door.js';
import { tile, tileSockets } from './tile.js';
import { token, tokenSockets } from './token.js';
import { tokenMaskSockets } from './token-mask.js';
import { object } from './object.js';
import { setSocketlibInstance, socketlib, socketlibInstance } from './instance.js';

export { socketlibInstance };

/**
 * Socketlib Module Adapter.
 * Encapsulates cross-client socket RPC handlers, token/tile document synchronization,
 * and multi-client sequence coordinator functions.
 */
export class SocketlibModuleAdapter extends BaseModuleAdapter {
    door: any;
    tile: any;
    token: any;
    object: any;
    doorSockets: any;
    tileSockets: any;
    tokenSockets: any;
    tokenMaskSockets: any;
    _socket: any;

    constructor() {
        super("socketlib");
        this.door = door;
        this.tile = tile;
        this.token = token;
        this.object = object;
        this.doorSockets = doorSockets;
        this.tileSockets = tileSockets;
        this.tokenSockets = tokenSockets;
        this.tokenMaskSockets = tokenMaskSockets;
        this._socket = null;
    }

    /**
     * Active socket instance registered through socketlib.
     */
    get socketInstance() {
        return this._socket ?? socketlibInstance;
    }

    /**
     * Registers the module with socketlib and binds all socket RPC actions.
     * @returns {Promise<void>}
     */
    async register() {
        const socketlibApi = (globalThis as any).socketlib ?? socketlibInstance;
        if (!socketlibApi || typeof socketlibApi.registerModule !== 'function') return;
        const socket = socketlibApi.registerModule(MODULE_ID);
        const socketAPI = {
            doorSockets: this.doorSockets,
            tileSockets: this.tileSockets,
            tokenSockets: this.tokenSockets,
            tokenMaskSockets: this.tokenMaskSockets
        };

        Object.entries(socketAPI).forEach(([_, api]) => {
            Object.entries(api).forEach(([key, value]) => {
                socket.register(key, value);
            });
        });

        const mod = game?.modules?.get(MODULE_ID);
        if (mod) {
            (mod as any).socketlib = socket;
        }
        this._socket = socket;
        setSocketlibInstance(socket);
    }
}

export const socketlibAdapter = new SocketlibModuleAdapter();

export const socketlibapi = {
    register: () => socketlibAdapter.register(),
};

export const socket = {
    door,
    tile,
    token,
    object
};

export { socketlib };

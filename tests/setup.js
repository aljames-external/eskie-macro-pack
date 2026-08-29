/**
 * Global Foundry VTT environment mock/shim for zero-dependency Node.js unit tests.
 * Sets up globalThis.game and globalThis.foundry before importing adapters or utilities.
 */

globalThis.Item = class Item {};
globalThis.Actor = class Actor {};
globalThis.ChatMessage = class ChatMessage {};
globalThis.Token = class Token {};
globalThis.Tile = class Tile {};
globalThis.tokenAttacher = undefined;
globalThis.MassEdit = undefined;
globalThis.socketlib = undefined;
globalThis.adapter = undefined;

globalThis.ContextMenu = class ContextMenu {
    constructor(element, selector, menuItems, options = {}) {
        this.element = element;
        this.selector = selector;
        this.menuItems = menuItems;
        this.options = options;
    }
};

globalThis.TextEditor = {
    enrichHTML: async (content, _options = {}) => content ?? ""
};

globalThis.KeyboardManager = class KeyboardManager {};

globalThis.FilePicker = class FilePicker {
    static async browse(source, target, _options = {}) {
        return { target, files: [], dirs: [] };
    }
};

globalThis.CONST = {
    USER_ROLES: {
        NONE: 0,
        PLAYER: 1,
        TRUSTED: 2,
        ASSISTANT: 3,
        GAMEMASTER: 4
    },
    DOCUMENT_OWNERSHIP_LEVELS: {
        INHERIT: -1,
        NONE: 0,
        LIMITED: 1,
        OBSERVER: 2,
        OWNER: 3
    }
};

globalThis.foundry = {
    data: {
        operators: {
            ForcedDeletion: Symbol('ForcedDeletion')
        }
    },
    applications: {
        api: {
            ApplicationV2: class ApplicationV2 {
                constructor(options = {}) {
                    this.options = options;
                    this.rendered = false;
                    this.element = null;
                }
                async render(force = false, options = {}) {
                    this.rendered = true;
                    return this;
                }
                async close(options = {}) {
                    this.rendered = false;
                    return this;
                }
                async _prepareContext(options = {}) {
                    return {};
                }
                _onRender(context, options = {}) {}
            },
            HandlebarsApplicationMixin: (Base) => class extends Base {
                async _prepareContext(options = {}) {
                    return super._prepareContext ? await super._prepareContext(options) : {};
                }
            },
            DialogV2: class DialogV2 {
                static async wait(options = {}) {
                    return options.buttons?.[0]?.action ?? false;
                }
            }
        },
        ux: {
            ContextMenu: class ContextMenuV14 extends globalThis.ContextMenu {},
            TextEditor: {
                implementation: {
                    enrichHTML: async (content, _options = {}) => content ?? ""
                }
            }
        },
        apps: {
            FilePicker: {
                implementation: class FilePickerV14 extends globalThis.FilePicker {}
            }
        }
    },
    canvas: {
        placeables: {
            Token: class TokenV14 extends globalThis.Token {},
            Tile: class TileV14 extends globalThis.Tile {}
        }
    },
    helpers: {
        interaction: {
            KeyboardManager: class KeyboardManagerV14 extends globalThis.KeyboardManager {}
        }
    },
    utils: {
        mergeObject: (target, source = {}, options = {}) => {
            const inplace = options.inplace !== false;
            const dest = inplace ? target : { ...target };
            for (const key of Object.keys(source)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    dest[key] = globalThis.foundry.utils.mergeObject(dest[key] ?? {}, source[key], options);
                } else {
                    dest[key] = source[key];
                }
            }
            return dest;
        },
        duplicate: (obj) => JSON.parse(JSON.stringify(obj)),
        deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
        getProperty: (obj, path) => {
            if (!obj || !path) return undefined;
            return path.split('.').reduce((acc, part) => acc?.[part], obj);
        },
        setProperty: (obj, path, value) => {
            if (!obj || !path) return false;
            const parts = path.split('.');
            const last = parts.pop();
            let target = obj;
            for (const part of parts) {
                if (!(part in target)) target[part] = {};
                target = target[part];
            }
            target[last] = value;
            return true;
        },
        randomID: (length = 16) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },
        isEmpty: (obj) => {
            if (!obj) return true;
            if (Array.isArray(obj)) return obj.length === 0;
            if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
            return Object.keys(obj).length === 0;
        },
        isNewerVersion: (a, b) => {
            const partsA = String(a).split('.').map(n => parseInt(n, 10) || 0);
            const partsB = String(b).split('.').map(n => parseInt(n, 10) || 0);
            const len = Math.max(partsA.length, partsB.length);
            for (let i = 0; i < len; i++) {
                const valA = partsA[i] ?? 0;
                const valB = partsB[i] ?? 0;
                if (valA > valB) return true;
                if (valA < valB) return false;
            }
            return false;
        },
        slugify: (str) => String(str ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        hasProperty: (obj, path) => {
            if (!obj || !path) return false;
            return path.split('.').reduce((acc, part) => (acc && part in acc ? acc[part] : undefined), obj) !== undefined;
        },
        diffObject: (original, other) => {
            const diff = {};
            for (const key in other) {
                if (original[key] !== other[key]) diff[key] = other[key];
            }
            return diff;
        },
        flattenObject: (obj) => ({ ...obj }),
        expandObject: (obj) => ({ ...obj }),
        debounce: (fn, delay) => fn,
        fromUuidSync: (uuid) => null,
        fromUuid: async (uuid) => null,
        Collection: class Collection extends Map {
            get contents() {
                return Array.from(this.values());
            }
        }
    }
};

globalThis.Hooks = {
    events: new Map(),
    on(event, fn) {
        if (!this.events.has(event)) this.events.set(event, []);
        this.events.get(event).push(fn);
        return fn;
    },
    once(event, fn) {
        return this.on(event, fn);
    },
    off(event, fn) {
        if (!this.events.has(event)) return;
        const arr = this.events.get(event);
        const idx = arr.indexOf(fn);
        if (idx !== -1) arr.splice(idx, 1);
    },
    callAll(event, ...args) {
        const arr = this.events.get(event) ?? [];
        for (const fn of arr) fn(...args);
    }
};

globalThis.canvas = {
    ready: true,
    grid: {
        size: 100,
        distance: 5
    },
    scene: {
        grid: { distance: 5 },
        tiles: new Map(),
        width: 4000,
        height: 3000,
        background: { src: 'background.png', offsetX: 0, offsetY: 0 }
    },
    dimensions: {
        width: 4000,
        height: 3000,
        size: 100,
        distance: 5
    },
    tokens: {
        get: (id) => null,
        controlled: []
    },
    tiles: {
        get: (id) => null,
        controlled: []
    }
};

globalThis.game = {
    release: { generation: 12 },
    version: '12.331',
    system: { id: 'dnd5e', title: 'D&D 5e' },
    modules: new Map(),
    user: {
        id: 'gm-user-1',
        name: 'Game Master',
        isGM: true,
        role: 4
    },
    users: [
        {
            id: 'gm-user-1',
            name: 'Game Master',
            isGM: true,
            role: 4,
            active: true
        }
    ],
    settings: {
        get: (_module, _key) => ({}),
        set: async (_module, _key, val) => val
    },
    i18n: {
        localize: (key) => key
    }
};

globalThis.ui = {
    notifications: {
        info: () => {},
        warn: () => {},
        error: () => {}
    }
};

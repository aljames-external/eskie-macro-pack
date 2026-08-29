import { dependency } from '../../lib/dependency.js';
import { massEditAdapter } from '../modules/mass-edit/mass-edit-module-adapter.js';
import { tokenAttacherAdapter } from '../modules/token-attacher/token-attacher-module-adapter.js';

/**
 * User permission tiers for ownership priority evaluation.
 * Tier 1: Players (least permissions)
 * Tier 2: Trusted Players
 * Tier 3: GM / Co-GM (most permissions)
 * @type {Readonly<{ PLAYER: 1, TRUSTED: 2, GM: 3 }>}
 */
export const USER_PERMISSION_TIERS = Object.freeze({
    PLAYER: 1,
    TRUSTED: 2,
    GM: 3
});

/**
 * Baseline Foundry VTT platform adapter (Foundry V12 / V13).
 * Abstract interface for versioned Foundry Application, placeable, tile math, template, and utility operations.
 */
export class BaseFoundryAdapter {
    /**
     * @param {object|null} [adapter=null] Unified Adapter singleton reference
     */
    constructor(adapter = null) {
        this._adapter = adapter;
    }

    /**
     * Reference to parent unified adapter singleton.
     */
    get adapter() {
        return this._adapter ?? null;
    }

    set adapter(inst) {
        this._adapter = inst;
    }

    /**
     * Access the Mass Edit module adapter via parent adapter navigation, falling back to singleton.
     */
    get massEdit() {
        return this.adapter?.massEdit ?? massEditAdapter;
    }

    /**
     * Access the Token Attacher module adapter via parent adapter navigation, falling back to singleton.
     */
    get tokenAttacher() {
        return this.adapter?.tokenAttacher ?? tokenAttacherAdapter;
    }

    /**
     * The major generation version of Foundry VTT (e.g. 12, 13, 14).
     * @returns {number}
     */
    get generation() {
        const major = parseInt(String(game.release?.generation ?? game.version ?? "").split('.')[0], 10);
        return Number.isNaN(major) ? 12 : major;
    }

    /**
     * The active ContextMenu constructor (global in v12/v13 baseline).
     */
    get ContextMenu() {
        return ContextMenu;
    }

    /**
     * The active KeyboardManager constructor (global in v12/v13 baseline).
     */
    get KeyboardManager() {
        return KeyboardManager;
    }

    /**
     * The active Token placeable constructor (global in v12/v13 baseline).
     */
    get Token() {
        return Token;
    }

    /**
     * The active Tile placeable constructor (global in v12/v13 baseline).
     */
    get Tile() {
        return Tile;
    }

    /**
     * The active ApplicationV2 constructor (introduced in v12 under foundry.applications.api).
     */
    get ApplicationV2() {
        return foundry.applications?.api?.ApplicationV2 ?? class {};
    }

    /**
     * The active HandlebarsApplicationMixin wrapper (introduced in v12 under foundry.applications.api).
     */
    get HandlebarsApplicationMixin() {
        return foundry.applications?.api?.HandlebarsApplicationMixin ?? (Base => Base);
    }

    /**
     * The active DialogV2 constructor (introduced in v12 under foundry.applications.api).
     */
    get DialogV2() {
        return foundry.applications?.api?.DialogV2;
    }

    /**
     * Displays a button-choice dialog using Foundry's native DialogV2.
     * @param {{ buttons: {label: string, value: any}[], title?: string }} buttonData
     * @param {object} [options={}] Extra options forwarded to DialogV2.wait()
     * @returns {Promise<string|false>} The chosen button's value as a string, or false on cancel.
     */
    async buttonDialog(buttonData, options = {}) {
        const dialogCls = this.DialogV2;
        if (!dialogCls?.wait) {
            throw new Error("DialogV2 is not available in the current Foundry environment.");
        }
        const opt = this.mergeObject({ position: { width: 300 } }, options, { inplace: false });
        const buttons = (buttonData.buttons ?? []).map(btn => ({
            label: btn.label,
            action: String(btn.value),
            default: false
        }));

        const result = await dialogCls.wait({
            window: { title: buttonData.title ?? 'Choose an Option' },
            buttons,
            rejectClose: false,
            ...opt
        });

        if (result === null || result === undefined) return false;
        return result;
    }

    /**
     * The active FilePicker constructor / implementation (global in v12/v13 baseline).
     */
    get FilePicker() {
        return FilePicker?.implementation ?? FilePicker;
    }

    /**
     * The active TextEditor constructor / implementation (global in v12/v13 baseline).
     */
    get TextEditor() {
        return TextEditor?.implementation ?? TextEditor;
    }

    /**
     * Browse a directory using the active FilePicker implementation.
     * @param {string} source Storage source (e.g. 'data', 'public', 'client')
     * @param {string} target Directory target path
     * @param {Object} [options={}] Browse options
     * @returns {Promise<{ target: string, files: string[], dirs: string[] }>}
     */
    async browseDirectory(source, target, options = {}) {
        return this.FilePicker?.browse(source, target, options);
    }

    /**
     * Safely resolve a document from UUID synchronously.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    fromUuidSync(uuid, options = {}) {
        if (!uuid) return null;
        try {
            return foundry.utils?.fromUuidSync(uuid, options) ?? null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Safely resolve a document from UUID asynchronously.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    async fromUuid(uuid, options = {}) {
        if (!uuid) return null;
        try {
            return (await foundry.utils?.fromUuid(uuid, options)) ?? null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Merge two objects recursively.
     * @param {Object} original Target object
     * @param {Object} [other={}] Source object
     * @param {Object} [options={}] Merge options
     * @returns {Object}
     */
    mergeObject(original, other = {}, options = {}) {
        const mergedOptions = { inplace: false, ...options };
        return foundry.utils.mergeObject(original, other, mergedOptions);
    }

    /**
     * Deep duplicate an object.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    duplicate(obj) {
        return foundry.utils.duplicate(obj);
    }

    /**
     * Deep clone an object.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    deepClone(obj) {
        return foundry.utils.deepClone(obj);
    }

    /**
     * Retrieve a property from an object by dot-separated path.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @returns {*}
     */
    getProperty(obj, path) {
        return foundry.utils.getProperty(obj, path);
    }

    /**
     * Set a property on an object by dot-separated path.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @param {*} value Property value
     * @returns {boolean}
     */
    setProperty(obj, path, value) {
        return foundry.utils.setProperty(obj, path, value);
    }

    /**
     * Generate a random string identifier.
     * @param {number} [length=16] Length of the identifier
     * @returns {string}
     */
    randomID(length = 16) {
        return foundry.utils.randomID(length);
    }

    /**
     * Test whether an object is empty.
     * @param {Object} obj Target object
     * @returns {boolean}
     */
    isEmpty(obj) {
        return foundry.utils.isEmpty(obj);
    }

    /**
     * Test whether version a is strictly newer than version b.
     * @param {string} a Primary version string
     * @param {string} b Target version string to compare against
     * @returns {boolean}
     */
    isNewerVersion(a, b) {
        return foundry.utils.isNewerVersion(a, b);
    }

    /**
     * Test whether a target object has a property at a specified path.
     * @param {Object} obj Target object
     * @param {string} path Dot-separated property path
     * @returns {boolean}
     */
    hasProperty(obj, path) {
        if (typeof foundry !== 'undefined' && foundry.utils?.hasProperty) {
            return foundry.utils.hasProperty(obj, path);
        }
        return this.getProperty(obj, path) !== undefined;
    }

    /**
     * Slugify a string according to Foundry VTT standards.
     * @param {string} text Target text to slugify
     * @param {Object} [options={}] Slugify options
     * @returns {string} Slugified string
     */
    slugify(text, options = {}) {
        if (typeof foundry !== 'undefined' && foundry.utils?.slugify) {
            return foundry.utils.slugify(text, options);
        }
        const str = String(text ?? '').toLowerCase();
        return str.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    /**
     * Compute the difference between two objects.
     * @param {Object} original Original object
     * @param {Object} other Modified object
     * @param {Object} [options={}] Comparison options
     * @returns {Object} Difference object
     */
    diffObject(original, other, options = {}) {
        if (typeof foundry !== 'undefined' && foundry.utils?.diffObject) {
            return foundry.utils.diffObject(original, other, options);
        }
        return {};
    }

    /**
     * Flatten a nested object structure into dot-separated paths.
     * @param {Object} obj Object to flatten
     * @param {number} [d=0] Current recursion depth
     * @returns {Object} Flattened object
     */
    flattenObject(obj, d = 0) {
        if (typeof foundry !== 'undefined' && foundry.utils?.flattenObject) {
            return foundry.utils.flattenObject(obj, d);
        }
        return { ...obj };
    }

    /**
     * Expand a flattened object with dot-separated keys into a deeply nested structure.
     * @param {Object} obj Flattened object
     * @param {number} [d=0] Current recursion depth
     * @returns {Object} Expanded nested object
     */
    expandObject(obj, d = 0) {
        if (typeof foundry !== 'undefined' && foundry.utils?.expandObject) {
            return foundry.utils.expandObject(obj, d);
        }
        return { ...obj };
    }

    /**
     * Debounce a function call by a specified delay.
     * @param {Function} fn Function to debounce
     * @param {number} delay Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(fn, delay) {
        if (typeof foundry !== 'undefined' && foundry.utils?.debounce) {
            return foundry.utils.debounce(fn, delay);
        }
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Enrich an HTML string with Foundry enrichers, roll data, and document links.
     * @param {string} content HTML string to enrich
     * @param {Object} [options={}] Enrichment options (rollData, secrets, relativeTo, etc.)
     * @returns {Promise<string>}
     */
    async enrichHTML(content, options = {}) {
        if (!content) return '';
        if (this.TextEditor?.enrichHTML) {
            return this.TextEditor.enrichHTML(content, { secrets: false, async: true, ...options });
        }
        return content;
    }

    /* -------------------------------------------- */
    /*  Combat & Token Helpers                      */
    /* -------------------------------------------- */

    /**
     * Retrieve all combatants associated with a token in combat for baseline v12/v13.
     * @param {Combat} combat Target combat encounter
     * @param {string|TokenDocument|Token} token Token ID or Document or Placeable
     * @returns {Combatant[]}
     */
    getCombatantsByToken(combat, token) {
        if (!combat) return [];
        const tokenId = token?.id ?? token?.document?.id ?? token;
        if (!tokenId) return [];

        const single = combat.getCombatantByToken?.(tokenId);
        return single ? [single] : [];
    }

    /**
     * Retrieve the primary combatant associated with a token in combat for baseline v12/v13.
     * @param {Combat} combat Target combat encounter
     * @param {string|TokenDocument|Token} token Token ID or Document or Placeable
     * @returns {Combatant|null}
     */
    getCombatantByToken(combat, token) {
        if (!combat) return null;
        const tokenId = token?.id ?? token?.document?.id ?? token;
        if (!tokenId) return null;

        return combat.getCombatantByToken?.(tokenId) ?? null;
    }

    /* -------------------------------------------- */
    /*  User Ownership & Permission Helpers         */
    /* -------------------------------------------- */

    /**
     * User permission tiers for ownership priority evaluation.
     * @type {Readonly<{ PLAYER: 1, TRUSTED: 2, GM: 3 }>}
     */
    get USER_PERMISSION_TIERS() {
        return USER_PERMISSION_TIERS;
    }

    /**
     * Classify a Foundry User into a standard permission tier (1: Player, 2: Trusted Player, 3: GM / Co-GM).
     * @param {User} user Concrete User document
     * @returns {number|null} 1 for Player, 2 for Trusted, 3 for GM, or null if invalid/none
     */
    getUserPermissionTier(user) {
        if (!user) return null;
        const isGM = Boolean(user.isGM);
        const userRole = user.role ?? null;
        const assistantRole = CONST?.USER_ROLES?.ASSISTANT ?? 3;
        const trustedRole = CONST?.USER_ROLES?.TRUSTED ?? 2;
        const playerRole = CONST?.USER_ROLES?.PLAYER ?? 1;

        if (isGM || (userRole !== null && userRole >= assistantRole)) {
            return USER_PERMISSION_TIERS.GM;
        }
        if ((userRole !== null && userRole === trustedRole) || (Boolean(user.isTrusted) && !isGM)) {
            return USER_PERMISSION_TIERS.TRUSTED;
        }
        if ((userRole !== null && userRole === playerRole) || (!isGM && !user.isTrusted && userRole !== 0)) {
            return USER_PERMISSION_TIERS.PLAYER;
        }
        return null;
    }

    /**
     * Test whether a user possesses an ownership role for a given actor and token document.
     * @param {User} user Concrete User document
     * @param {Actor|null} actor Concrete Actor document
     * @param {Document|null} tokenDoc Concrete TokenDocument
     * @returns {boolean} True if the user has an ownership role
     */
    isUserDocumentOwner(user, actor, tokenDoc) {
        if (!user) return false;

        // GM / Co-GM always has ownership over all documents in Foundry
        if (this.getUserPermissionTier(user) === USER_PERMISSION_TIERS.GM) {
            return true;
        }

        const ownerLevel = CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;

        // Test actor document permissions
        if (actor) {
            if (actor.testUserPermission?.(user, 'OWNER')) return true;
            if (actor.getUserLevel?.(user) >= ownerLevel) return true;
            if (actor.ownership) {
                const level = actor.ownership[user.id] ?? actor.ownership.default ?? 0;
                if (level >= ownerLevel) return true;
            }
            if ((user.id === game?.user?.id || user === game?.user) && Boolean(actor.isOwner)) {
                return true;
            }
        }

        // Test token document permissions
        if (tokenDoc) {
            if (tokenDoc.testUserPermission?.(user, 'OWNER')) return true;
            if (tokenDoc.getUserLevel?.(user) >= ownerLevel) return true;
            if (tokenDoc.ownership) {
                const level = tokenDoc.ownership[user.id] ?? tokenDoc.ownership.default ?? 0;
                if (level >= ownerLevel) return true;
            }
            if ((user.id === game?.user?.id || user === game?.user) && Boolean(tokenDoc.isOwner)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a user is "in-charge" of a token.
     * A user is in-charge of a token if:
     * 1. The user has an ownership role of the token.
     * 2. There is no other currently connected user with fewer permissions (lower tier) who also has an ownership role of that token.
     *
     * @param {Token|TokenDocument} token Token placeable or TokenDocument
     * @param {User} [user=game.user] Target user to evaluate (defaults to active client user)
     * @returns {boolean} True if the user is in-charge of the token
     */
    isUserInCharge(token, user = game.user) {
        if (!token || !user) return false;

        const tokenDoc = token.document ?? token;
        const actor = token.actor ?? tokenDoc?.actor ?? null;

        if (!this.isUserDocumentOwner(user, actor, tokenDoc)) {
            return false;
        }

        const userTier = this.getUserPermissionTier(user);
        if (!userTier) return false;

        if (userTier === USER_PERMISSION_TIERS.PLAYER) {
            return true;
        }

        const usersCollection = game?.users;
        const allUsers = usersCollection?.contents
            ?? (usersCollection?.values ? Array.from(usersCollection.values()) : null)
            ?? (usersCollection ? Array.from(usersCollection) : [user]);

        const activeOtherUsers = allUsers.filter(otherUser => {
            if (otherUser.id === user.id || otherUser === user) return false;
            return Boolean(otherUser.active);
        });

        if (userTier === USER_PERMISSION_TIERS.TRUSTED) {
            const hasConnectedPlayerOwner = activeOtherUsers.some(otherUser => {
                return this.getUserPermissionTier(otherUser) === USER_PERMISSION_TIERS.PLAYER
                    && this.isUserDocumentOwner(otherUser, actor, tokenDoc);
            });
            return !hasConnectedPlayerOwner;
        }

        if (userTier === USER_PERMISSION_TIERS.GM) {
            const hasConnectedLowerTierOwner = activeOtherUsers.some(otherUser => {
                const otherTier = this.getUserPermissionTier(otherUser);
                return (otherTier === USER_PERMISSION_TIERS.PLAYER || otherTier === USER_PERMISSION_TIERS.TRUSTED)
                    && this.isUserDocumentOwner(otherUser, actor, tokenDoc);
            });
            return !hasConnectedLowerTierOwner;
        }

        return false;
    }

    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math (V12 / V13)   */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset for Foundry V12 / V13 (legacy top-left anchor (0, 0)).
     * Compares token/tile size and scale to offset top-left origin.
     *
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @param {number} [scale=1] Additional scale multiplier
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getRevealOffset(object, scale = 1) {
        if (!object) return { x: 0, y: 0 };
        const doc = object.document ?? object;
        const isToken = (doc.documentName === 'Token' || object.documentName === 'Token');
        const widthAdjustment = isToken ? (canvas?.grid?.size ?? 100) : 1;
        const scaleXY = doc.texture?.scaleX ?? 1;
        const totalScale = scaleXY * scale;
        const objX = object.x ?? doc.x ?? 0;
        const objY = object.y ?? doc.y ?? 0;
        const docWidth = doc.width ?? 1;
        const docHeight = doc.height ?? 1;

        return {
            x: objX - (widthAdjustment * docWidth * (totalScale - 1) / 2),
            y: objY - (widthAdjustment * docHeight * (totalScale - 1) / 2)
        };
    }

    /**
     * Calculate shape tile placement offset for Foundry V12 / V13 (legacy top-left anchor (0, 0)).
     *
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getShapeOffset(object) {
        if (!object) return { x: 0, y: 0 };
        const doc = object.document ?? object;
        return {
            x: object.x ?? doc.x ?? 0,
            y: object.y ?? doc.y ?? 0
        };
    }

    /**
     * Unified tile offset resolver for Foundry V12 / V13.
     *
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @param {'reveal'|'shape'} type Offset type
     * @param {number} [scale=1] Scale multiplier
     * @returns {{x: number, y: number}} Resolved coordinates
     */
    getTileOffset(object, type, scale = 1) {
        if (type === 'reveal') return this.getRevealOffset(object, scale);
        if (type === 'shape') return this.getShapeOffset(object);
        throw new Error(`Invalid offset type: ${type}`);
    }

    /* -------------------------------------------- */
    /*  Template Position Extraction (V12 / V13)    */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a legacy MeasuredTemplate document or placeable.
     *
     * @param {Document|PlaceableObject} template The MeasuredTemplate document or placeable
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    getTemplatePosition(template, config = {}) {
        if (!template) return [];

        const farpoint = template.object?.ray?.B ?? template.ray?.B;
        const secondary = {
            x: farpoint?.x ?? template.x ?? 0,
            y: farpoint?.y ?? template.y ?? 0
        };
        const primary = {
            x: template.x ?? 0,
            y: template.y ?? 0
        };

        const gridSize = canvas?.grid?.size ?? 100;
        const gridDistance = canvas?.grid?.distance ?? canvas?.scene?.grid?.distance ?? 5;
        const distance = template.distance ?? 0;
        const width = template.width ?? 0;
        const height = Math.sqrt(Math.max(0, distance * distance - width * width));

        const center = {
            x: primary.x + (width / 2) * (gridSize / gridDistance),
            y: primary.y + (height / 2) * (gridSize / gridDistance)
        };

        return [primary, secondary, center];
    }

    /* -------------------------------------------- */
    /*  Scene & Environment Background (V12 / V13)  */
    /* -------------------------------------------- */

    /**
     * Retrieve the background texture and offsets for a scene on Foundry V12 / V13 (Scene#background).
     * @param {Scene} [scene=canvas.scene] Target scene document
     * @param {Level|null} [_level=null] Unused in V12/V13
     * @returns {{ src: string|null, offsetX: number, offsetY: number }}
     */
    getSceneBackground(scene = canvas?.scene, _level = null) {
        if (!scene) return { src: null, offsetX: 0, offsetY: 0 };
        const bg = scene.background;
        const src = typeof bg?.src === 'string' ? bg.src : (typeof bg === 'string' ? bg : null);
        return {
            src,
            offsetX: Number(bg?.offsetX ?? 0),
            offsetY: Number(bg?.offsetY ?? 0)
        };
    }

    /* -------------------------------------------- */
    /*  Document Inspection & Placeable Lookup      */
    /* -------------------------------------------- */

    /**
     * Gets the native Foundry VTT document name of a placeable object or document.
     * @param {PlaceableObject|Document|null} target Target document or placeable
     * @returns {string|undefined} Document name (e.g. 'Token', 'Tile')
     */
    getDocumentName(target) {
        if (!target) return undefined;
        return target.documentName ?? target.document?.documentName ?? undefined;
    }

    /**
     * Test whether a target document or placeable matches a specific document type.
     * @param {PlaceableObject|Document|null} target Target document or placeable
     * @param {string} type Target document name ('Token', 'Tile', 'MeasuredTemplate', 'Region')
     * @returns {boolean}
     */
    isDocumentOfType(target, type) {
        return this.getDocumentName(target) === type;
    }

    /**
     * Resolve a PlaceableObject by its unique identifier across primary canvas layers.
     * @param {string} id Target placeable ID
     * @returns {PlaceableObject|null}
     */
    getPlaceable(id) {
        if (!id) return null;
        return canvas?.tokens?.get(id)
            ?? canvas?.tiles?.get(id)
            ?? canvas?.walls?.get(id)
            ?? null;
    }

    /* -------------------------------------------- */
    /*  Speaker Resolution                          */
    /* -------------------------------------------- */

    /**
     * Pinpoints the active rolling or speaker token for a chat message or active user.
     * @param {ChatMessage|object|null} message Chat message or speaker context
     * @param {string|null} [extractedTokenId=null] Optional pre-extracted token ID
     * @returns {Token|null}
     */
    getSpeakerToken(message, extractedTokenId = null) {
        const canvasObj = canvas;
        if (!canvasObj?.ready || !canvasObj.tokens) return null;

        if (extractedTokenId) {
            const htmlTarget = canvasObj.tokens.get(extractedTokenId);
            if (htmlTarget) return htmlTarget;
        }

        const speakerTokenId = message?.speaker?.token;
        if (speakerTokenId) {
            const speakerTarget = canvasObj.tokens.get(speakerTokenId);
            if (speakerTarget) return speakerTarget;
        }

        return canvasObj.tokens.controlled?.[0]
            ?? game?.user?.character?.getActiveTokens?.()?.[0]
            ?? null;
    }

    /**
     * Resolves the actor associated with a chat message speaker.
     * @param {ChatMessage|object|null} message Chat message or speaker context
     * @returns {Actor|null}
     */
    getSpeakerActor(message) {
        const speaker = message?.speaker ?? message;
        if (speaker && ChatMessage?.getSpeakerActor) {
            const actor = ChatMessage.getSpeakerActor(speaker);
            if (actor) return actor;
        }
        const speakerToken = this.getSpeakerToken(message);
        return speakerToken?.actor ?? game?.user?.character ?? null;
    }

    /* -------------------------------------------- */
    /*  Token Distance & Grid Centering Math        */
    /* -------------------------------------------- */

    /**
     * Calculates the 3D distance between two tokens in scene units (e.g. feet/meters), rounded up.
     * @param {Token} t1 The source token
     * @param {Token} t2 The target token
     * @returns {number} Distance in scene units, rounded up
     */
    getDistance(t1, t2) {
        if (!t1 || !t2) return 0;
        const p1 = t1.center ?? { x: t1.x ?? 0, y: t1.y ?? 0 };
        const p2 = t2.center ?? { x: t2.x ?? 0, y: t2.y ?? 0 };
        const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        const gridSize = canvas?.grid?.size ?? 100;
        const gridDistance = canvas?.scene?.grid?.distance ?? canvas?.grid?.distance ?? 5;
        const dist2DUnits = (dist2DPx / gridSize) * gridDistance;

        const el1 = t1.document?.elevation ?? 0;
        const el2 = t2.document?.elevation ?? 0;
        const elDiff = el1 - el2;

        const dist3DUnits = Math.hypot(dist2DUnits, elDiff);
        return Math.ceil(dist3DUnits);
    }

    /**
     * Finds the center coordinate of the grid square on a target token nearest to a source token.
     * @param {Token} token The source token
     * @param {Token} target The target token
     * @returns {{x: number, y: number}|null} Coordinate of nearest square center
     */
    getNearestSquareCenter(token, target) {
        if (!token || !target) return null;
        const gs = canvas?.grid?.size ?? 100;
        const srcCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };

        const w = target.document?.width ?? target.width ?? 1;
        const h = target.document?.height ?? target.height ?? 1;

        let bestPoint = null;
        let bestDist2 = Infinity;

        for (let gx = 0; gx < w; gx++) {
            for (let gy = 0; gy < h; gy++) {
                const cx = (target.x ?? 0) + (gx + 0.5) * gs;
                const cy = (target.y ?? 0) + (gy + 0.5) * gs;

                const dx = cx - srcCenter.x;
                const dy = cy - srcCenter.y;
                const d2 = dx * dx + dy * dy;

                if (d2 < bestDist2) {
                    bestDist2 = d2;
                    bestPoint = { x: cx, y: cy };
                }
            }
        }

        return bestPoint;
    }

    /**
     * Returns an array of users who are owners of a given token.
     * Evaluates document ownership permissions via user permission tiers and ownership levels.
     * @param {Token|TokenDocument} token Token placeable or document
     * @param {object} [config={}] Configuration options
     * @param {boolean} [config.applyPC=true] Whether to include player characters
     * @param {boolean} [config.applyGM=true] Whether to include Game Masters
     * @returns {User[]} Array of User objects
     */
    getTokenOwners(token, config = {}) {
        if (!token) return [];
        const applyPC = config.applyPC !== false;
        const applyGM = config.applyGM !== false;
        const doc = token.document ?? token;
        const actor = token.actor ?? doc?.actor ?? null;

        const usersCollection = game?.users;
        const allUsers = usersCollection?.contents
            ?? (usersCollection?.values ? Array.from(usersCollection.values()) : null)
            ?? (usersCollection ? Array.from(usersCollection) : []);

        let matched = allUsers.filter(user => this.isUserDocumentOwner(user, actor, doc));
        if (!applyPC) matched = matched.filter(user => Boolean(user.isGM));
        if (!applyGM) matched = matched.filter(user => !user.isGM);
        return matched;
    }

    /* -------------------------------------------- */
    /*  Placeable Element Attachment Operations     */
    /* -------------------------------------------- */

    /**
     * Attaches elements to a target PlaceableObject (Token or Tile).
     * If the target is a Tile, uses Baileywiki Mass Edit if active.
     * If the target is a Token, falls back to Token Attacher or Mass Edit.
     * @param {Array} elements Elements to attach
     * @param {PlaceableObject|Document} target Target Token or Tile
     * @returns {Promise<unknown>}
     */
    async attachPlaceableElements(elements, target) {
        const isTile = this.isDocumentOfType(target, 'Tile');

        if (isTile) {
            dependency.required([
                { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
            ]);
            return this.massEdit?.link(elements, target);
        }

        // Default Token behavior
        if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
            return this.tokenAttacher?.attachElementsToToken(elements, target, true);
        } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            return this.massEdit?.link(elements, target);
        }

        dependency.someRequired([
            { id: 'token-attacher', ref: "Token Attacher" },
            { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
        ]);
    }

    /**
     * Detaches elements from a target PlaceableObject (Token or Tile).
     * @param {Array} elements Elements to detach
     * @param {PlaceableObject|Document} target Target Token or Tile
     * @returns {Promise<unknown>}
     */
    async detachPlaceableElements(elements, target) {
        const isTile = this.isDocumentOfType(target, 'Tile');

        if (isTile) {
            dependency.required([
                { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
            ]);
            return this.massEdit?.removeLinks(elements, target);
        }

        // Default Token behavior
        if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
            return this.tokenAttacher?.detachElementsFromToken(elements, target, true);
        } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            return this.massEdit?.removeLinks(elements, target);
        }

        dependency.someRequired([
            { id: 'token-attacher', ref: "Token Attacher" },
            { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
        ]);
    }

    /**
     * Format a document update payload to delete/remove a specific property key.
     * In Foundry V12/V13, formats using legacy "-=<keyId>" deletion syntax.
     *
     * @param {string} path Dot-delimited parent property path (e.g. "flags.eskie-macros.token-masks")
     * @param {string} keyId The property key to delete
     * @returns {Record<string, *>} Update dictionary
     */
    formatDeletionUpdate(path, keyId) {
        const fullKey = path ? `${path}.-=${keyId}` : `-=${keyId}`;
        return { [fullKey]: null };
    }
}

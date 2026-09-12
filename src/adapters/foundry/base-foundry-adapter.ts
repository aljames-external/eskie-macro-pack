import { dependency } from '../../lib/dependency.js';
import { log } from '../../lib/logger.js';

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
 * Base abstract class for all Foundry platform adapters in Eskie Macro Pack.
 * Defines strict contracts and encapsulates version-agnostic Application, interaction,
 * permission, placeable lookup, and utility operations.
 */
export class BaseFoundryAdapter {
    _adapter: any;

    /**
     * @param {object|null} [adapter=null] Unified Adapter singleton reference
     */
    constructor(adapter: any = null) {
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
     * Access the Mass Edit module adapter via parent adapter navigation or ambient API.
     */
    get massEdit(): any {
        if (this.adapter?.massEdit) return this.adapter.massEdit;
        const globalMassEdit = (globalThis as any).MassEdit;
        if (globalMassEdit?.linker) return globalMassEdit.linker;
        return null;
    }

    /**
     * Access the Token Attacher module adapter via parent adapter navigation or ambient API.
     */
    get tokenAttacher(): any {
        if (this.adapter?.tokenAttacher) return this.adapter.tokenAttacher;
        const globalTA = (globalThis as any).tokenAttacher;
        if (globalTA) return globalTA;
        return null;
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
     * The active ContextMenu constructor.
     */
    get ContextMenu(): any {
        throw new Error('BaseFoundryAdapter.ContextMenu must be implemented by version subclass');
    }

    /**
     * The active KeyboardManager constructor.
     */
    get KeyboardManager(): any {
        throw new Error('BaseFoundryAdapter.KeyboardManager must be implemented by version subclass');
    }

    /**
     * The active Token placeable constructor.
     */
    get Token(): any {
        throw new Error('BaseFoundryAdapter.Token must be implemented by version subclass');
    }

    /**
     * The active Tile placeable constructor.
     */
    get Tile(): any {
        throw new Error('BaseFoundryAdapter.Tile must be implemented by version subclass');
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
    async buttonDialog(buttonData: any, options = {}) {
        const dialogCls = this.DialogV2;
        if (!dialogCls?.wait) {
            throw new Error("DialogV2 is not available in the current Foundry environment.");
        }
        const opt = this.mergeObject({ position: { width: 300 } }, options, { inplace: false });
        const buttons = (buttonData.buttons ?? []).map((btn: any) => ({
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
     * The active FilePicker constructor / implementation.
     */
    get FilePicker(): any {
        throw new Error('BaseFoundryAdapter.FilePicker must be implemented by version subclass');
    }

    /**
     * The active TextEditor constructor / implementation.
     */
    get TextEditor(): any {
        throw new Error('BaseFoundryAdapter.TextEditor must be implemented by version subclass');
    }

    /**
     * Browse a directory using the active FilePicker implementation.
     * @param {string} source Storage source (e.g. 'data', 'public', 'client')
     * @param {string} target Directory target path
     * @param {Object} [options={}] Browse options
     * @returns {Promise<{ target: string, files: string[], dirs: string[] }>}
     */
    async browseDirectory(source: any, target: any, options = {}) {
        return this.FilePicker.browse(source, target, options);
    }

    /**
     * Preload Handlebars templates across Foundry generations.
     * @abstract
     * @param {string[]} paths Array of template paths
     * @returns {Promise<Function[]>}
     */
    async loadTemplates(paths: string[]): Promise<Function[]> {
        throw new Error('BaseFoundryAdapter.loadTemplates must be implemented by version subclass');
    }

    /**
     * Safely resolve a document from UUID synchronously.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    fromUuidSync(uuid: string, options: any = {}): any {
        throw new Error('BaseFoundryAdapter.fromUuidSync must be implemented by version subclass');
    }

    /**
     * Safely resolve a document from UUID asynchronously.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    async fromUuid(uuid: string, options: any = {}): Promise<any> {
        throw new Error('BaseFoundryAdapter.fromUuid must be implemented by version subclass');
    }

    /**
     * Merge two objects recursively.
     * @param {Object} original Target object
     * @param {Object} [other={}] Source object
     * @param {Object} [options={}] Merge options
     * @returns {Object}
     */
    mergeObject(original: any, other = {}, options = {}) {
        const mergedOptions = { inplace: false, ...options };
        return foundry.utils.mergeObject(original, other, mergedOptions);
    }

    /**
     * Deep duplicate an object.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    duplicate(obj: any) {
        return foundry.utils.duplicate(obj);
    }

    /**
     * Deep clone an object.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    deepClone(obj: any) {
        return foundry.utils.deepClone(obj);
    }

    /**
     * Retrieve a property from an object by dot-separated path.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @returns {*}
     */
    getProperty(obj: any, path: any) {
        return foundry.utils.getProperty(obj, path);
    }

    /**
     * Set a property on an object by dot-separated path.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @param {*} value Property value
     * @returns {boolean}
     */
    setProperty(obj: any, path: any, value: any) {
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
    isEmpty(obj: any) {
        return foundry.utils.isEmpty(obj);
    }

    /**
     * Test whether version v1 is strictly newer than version v0.
     * @param {string|number} v1 Target version
     * @param {string|number} v0 Reference version to compare against
     * @param {object} [options] Comparison options
     * @returns {boolean}
     */
    isNewerVersion(v1: string | number, v0: string | number, options?: { majorOnly?: boolean }): boolean {
        return foundry.utils.isNewerVersion(v1, v0, options);
    }

    /**
     * Test whether a target object has a property at a specified path.
     * @param {Object} obj Target object
     * @param {string} path Dot-separated property path
     * @returns {boolean}
     */
    hasProperty(obj: any, path: any) {
        return foundry.utils.hasProperty(obj, path);
    }

    /**
     * Convert a string to a URL-friendly slug.
     * @param {string} text Text to slugify
     * @param {Object} [options={}] Slugify options
     * @returns {string} Slugified string
     */
    slugify(text: any, options: any = {}): string {
        const str = String(text ?? '');
        if (typeof (str as any).slugify === 'function') {
            return (str as any).slugify(options);
        }
        const replacement = options.replacement ?? '-';
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, replacement)
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Compute the difference between two objects.
     * @param {Object} original Original object
     * @param {Object} other Modified object
     * @param {Object} [options={}] Comparison options
     * @returns {Object} Difference object
     */
    diffObject(original: any, other: any, options: any = {}): any {
        return foundry.utils.diffObject(original, other, options);
    }

    /**
     * Flatten a nested object structure into dot-separated paths.
     * @param {Object} obj Object to flatten
     * @param {number} [d=0] Current recursion depth
     * @returns {Object} Flattened object
     */
    flattenObject(obj: any, d: number = 0): any {
        return foundry.utils.flattenObject(obj, d);
    }

    /**
     * Expand a flattened object with dot-separated keys into a deeply nested structure.
     * @param {Object} obj Flattened object
     * @param {number} [_d=0] Current recursion depth
     * @returns {Object} Expanded nested object
     */
    expandObject(obj: any, _d: number = 0): any {
        return (foundry.utils as any).expandObject(obj);
    }

    /**
     * Debounce a function call by a specified delay.
     * @param {Function} fn Function to debounce
     * @param {number} delay Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(fn: any, delay: number): any {
        return foundry.utils.debounce(fn, delay);
    }

    /**
     * Enrich an HTML string with Foundry enrichers, roll data, and document links.
     * @param {string} content HTML string to enrich
     * @param {Object} [options={}] Enrichment options (rollData, secrets, relativeTo, etc.)
     * @returns {Promise<string>}
     */
    async enrichHTML(content: any, options = {}) {
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
     * Retrieve all combatants associated with a token in combat.
     * @param {Combat} combat Target combat encounter
     * @param {Token} token Target Token placeable
     * @returns {Combatant[]}
     */
    getCombatantsByToken(combat: Combat, token: Token): Combatant[] {
        throw new Error('BaseFoundryAdapter.getCombatantsByToken must be implemented by version subclass');
    }

    /**
     * Retrieve the primary combatant associated with a token in combat.
     * @param {Combat} combat Target combat encounter
     * @param {Token} token Target Token placeable
     * @returns {Combatant|null}
     */
    getCombatantByToken(combat: Combat, token: Token): Combatant | null {
        const combatants = this.getCombatantsByToken(combat, token);
        return combatants?.[0] ?? null;
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
    getUserPermissionTier(user: User): number | null {
        if (!user) return null;
        if (user.isGM) return USER_PERMISSION_TIERS.GM;

        const userRole = user.role;
        if (userRole === 0) return null;

        const assistantRole = CONST.USER_ROLES.ASSISTANT;
        const trustedRole = CONST.USER_ROLES.TRUSTED;
        const playerRole = CONST.USER_ROLES.PLAYER;

        if (userRole != null && userRole >= assistantRole) {
            return USER_PERMISSION_TIERS.GM;
        }
        if (userRole === trustedRole || Boolean((user as any).isTrusted)) {
            return USER_PERMISSION_TIERS.TRUSTED;
        }
        if (userRole === playerRole || !(user as any).isTrusted) {
            return USER_PERMISSION_TIERS.PLAYER;
        }
        return null;
    }

    /**
     * Test whether a user possesses an ownership role for a given document (Actor or TokenDocument).
     * @param {User} user Concrete User document
     * @param {Document|null} doc Concrete Document (Actor or TokenDocument)
     * @returns {boolean} True if the user has an ownership role
     */
    isUserDocumentOwner(user: User, doc: any): boolean {
        if (!user || !doc) return false;

        // GM / Co-GM always has ownership over all documents in Foundry
        if (this.getUserPermissionTier(user) === USER_PERMISSION_TIERS.GM) {
            return true;
        }

        const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        if (doc.testUserPermission) {
            return Boolean(doc.testUserPermission(user, 'OWNER'));
        }
        if (doc.getUserLevel) {
            return doc.getUserLevel(user) >= ownerLevel;
        }
        if (doc.ownership) {
            const level = (user.id ? doc.ownership[user.id] : undefined) ?? doc.ownership.default ?? 0;
            return level >= ownerLevel;
        }
        return (user.id === game.user?.id || user === game.user) && Boolean(doc.isOwner);
    }

    /**
     * Determine if a user is "in-charge" of a token.
     * A user is in-charge of a token if:
     * 1. The user has an ownership role of the token.
     * 2. There is no other currently connected user with fewer permissions (lower tier) who also has an ownership role of that token.
     *
     * @param {Token} token Target token placeable
     * @param {User} [user=game.user] Target user to evaluate (defaults to active client user)
     * @returns {boolean} True if the user is in-charge of the token
     */
    isUserInCharge(token: Token, user: User = game.user): boolean {
        if (!token || !user) return false;

        const isOwner = (u: any) => this.isUserDocumentOwner(u, token.actor) || this.isUserDocumentOwner(u, token.document);

        if (!isOwner(user)) {
            return false;
        }

        const userTier = this.getUserPermissionTier(user);
        if (!userTier) return false;

        // Tier 1 (Player) is the lowest permission tier; if they own it, they are in-charge.
        if (userTier === USER_PERMISSION_TIERS.PLAYER) {
            return true;
        }

        const usersCollection = game?.users;
        const allUsers = usersCollection?.contents
            ?? (usersCollection?.values ? Array.from(usersCollection.values()) : null)
            ?? (usersCollection ? Array.from(usersCollection) : [user]);

        // Filter to only currently connected (active) other users
        const activeOtherUsers = allUsers.filter(otherUser => {
            if (otherUser.id === user.id || otherUser === user) return false;
            return Boolean(otherUser.active);
        });

        // Tier 2 (Trusted Player): in-charge only if NO connected Tier 1 (Player) owns it
        if (userTier === USER_PERMISSION_TIERS.TRUSTED) {
            const hasConnectedPlayerOwner = activeOtherUsers.some(otherUser => {
                return this.getUserPermissionTier(otherUser) === USER_PERMISSION_TIERS.PLAYER
                    && isOwner(otherUser);
            });
            return !hasConnectedPlayerOwner;
        }

        // Tier 3 (GM / Co-GM): in-charge only if NO connected Tier 1 (Player) and NO connected Tier 2 (Trusted Player) owns it
        if (userTier === USER_PERMISSION_TIERS.GM) {
            const hasConnectedLowerTierOwner = activeOtherUsers.some(otherUser => {
                const otherTier = this.getUserPermissionTier(otherUser);
                return (otherTier === USER_PERMISSION_TIERS.PLAYER || otherTier === USER_PERMISSION_TIERS.TRUSTED)
                    && isOwner(otherUser);
            });
            return !hasConnectedLowerTierOwner;
        }

        return false;
    }

    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math               */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset.
     * @param {PlaceableObject} object Token or Tile placeable
     * @param {number} [scale=1] Additional scale multiplier
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getRevealOffset(object: any, scale: number = 1): any {
        throw new Error('BaseFoundryAdapter.getRevealOffset must be implemented by version subclass');
    }

    /**
     * Calculate shape tile placement offset.
     * @param {PlaceableObject} object Token or Tile placeable
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getShapeOffset(object: any): any {
        throw new Error('BaseFoundryAdapter.getShapeOffset must be implemented by version subclass');
    }

    /**
     * Unified tile offset resolver.
     * @param {PlaceableObject} object Token or Tile placeable
     * @param {'reveal'|'shape'} type Offset type
     * @param {number} [scale=1] Scale multiplier
     * @returns {{x: number, y: number}} Resolved coordinates
     */
    getTileOffset(object: any, type: string, scale: number = 1): any {
        if (type === 'reveal') return this.getRevealOffset(object, scale);
        if (type === 'shape') return this.getShapeOffset(object);
        throw new Error(`Invalid offset type: ${type}`);
    }

    /* -------------------------------------------- */
    /*  Template Position Extraction                */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a template or region document.
     * @param {MeasuredTemplate|Region} template The template or region placeable or document
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    getTemplatePosition(template: any, config: any = {}): any {
        throw new Error('BaseFoundryAdapter.getTemplatePosition must be implemented by version subclass');
    }

    /**
     * Resolves position coordinates from an interactive crosshair placement result.
     * @param {object} position The raw coordinates returned by Sequencer.Crosshair.show
     * @param {object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center]
     */
    getCrosshairPosition(position: any, config: any = {}): any[] {
        if (!position) return [];

        let primary = { x: position.x ?? 0, y: position.y ?? 0 };
        const token = config.token ?? config.sourceToken;
        const tokenCenter = token ? this.getCenter(token) : null;

        const { size: gridSize, distance: gridDistance } = this.getSceneDimensions();

        const dir = position.direction ?? config.direction ?? (token ? this.getTokenRotation(token) : 0);
        const isRayOrCone = position.t === 'ray' || position.t === 'cone' || position.type === 'ray' || position.type === 'cone' || config.type === 'ray' || config.type === 'cone';
        const isAttached = Boolean(position.sticky || config.sticky || config.stickToToken || isRayOrCone);

        const dist = position.distance ?? config.distance ?? (isAttached ? (config.max ?? 100) : 0);
        const distancePx = (dist / gridDistance) * gridSize;
        const rad = (dir * Math.PI) / 180;

        let secondary;
        if (distancePx > 0) {
            secondary = {
                x: primary.x + Math.cos(rad) * distancePx,
                y: primary.y + Math.sin(rad) * distancePx
            };
        } else if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
            secondary = primary;
            primary = { x: tokenCenter.x, y: tokenCenter.y };
        }

        return this.resolveDistinctPositions([primary, secondary, primary], config);
    }

    /**
     * Validates that primary and secondary coordinates are distinct (distance >= 1px).
     * @param {Array} positions Coordinates array [primary, secondary, center]
     * @param {object} [config={}] Configuration options
     * @param {Document|object|null} [template=null] Original template or region document
     * @returns {Array} Validated positions or error array
     */
    resolveDistinctPositions(positions: any, config: any = {}, template: any = null): any[] {
        if (!positions || positions.length === 0 || positions.error || positions[0]?.error) {
            return positions;
        }
        const [primary, secondary, center] = positions;
        if (!primary) return positions;

        const distancePx = secondary ? Math.hypot(secondary.x - primary.x, secondary.y - primary.y) : 0;
        if (secondary && distancePx < 1) {
            log.error('BaseFoundryAdapter | Unable to resolve distinct non-zero positions for animation.', { template, config, primary, secondary });
            ui.notifications.error('Eskie Macro Pack | Unable to resolve coordinates for animation.');
            const err = new Error('Unable to resolve distinct coordinates for template animation');
            const errResult: any = [{ error: err, cancelled: true }, undefined, undefined];
            errResult.error = err;
            return errResult;
        }

        return [primary, secondary, center ?? primary];
    }

    /* -------------------------------------------- */
    /*  Scene & Environment Background              */
    /* -------------------------------------------- */

    /**
     * Retrieve the background texture and offsets for a scene.
     * @param {Scene} [scene=canvas.scene] Target scene document
     * @param {Level|null} [level=null] Target level document or placeable
     * @returns {{ src: string|null, offsetX: number, offsetY: number }}
     */
    getSceneBackground(scene: any = canvas?.scene, level: any = null): any {
        throw new Error('BaseFoundryAdapter.getSceneBackground must be implemented by version subclass');
    }

    /**
     * Retrieves normalized scene dimension metrics with safe canvas and document fallbacks.
     * @param {Scene|null} [scene=canvas?.scene] Target scene
     * @returns {{ width: number, height: number, size: number, distance: number, maxRayDistance: number, sceneRect: { x: number, y: number, width: number, height: number } }}
     */
    getSceneDimensions(scene: any = canvas?.scene): any {
        const isCurrentScene = !scene || scene === canvas?.scene;
        const dims: any = isCurrentScene ? canvas?.dimensions : null;
        const sceneDoc = scene?.document ? scene.document : scene;
        const width = dims?.width ?? sceneDoc?.width ?? 4000;
        const height = dims?.height ?? sceneDoc?.height ?? 4000;
        const size = sceneDoc?.grid?.size ?? sceneDoc?.gridSize ?? dims?.size ?? canvas?.grid?.size ?? 100;
        const distance = sceneDoc?.grid?.distance ?? sceneDoc?.gridDistance ?? dims?.distance ?? canvas?.grid?.distance ?? 5;
        const maxRayDistance = dims?.maxRayDistance ?? Math.hypot(width, height);
        const sceneRect = dims?.sceneRect ?? {
            x: dims?.sceneX ?? 0,
            y: dims?.sceneY ?? 0,
            width: dims?.sceneWidth ?? width,
            height: dims?.sceneHeight ?? height
        };
        return {
            width,
            height,
            size,
            distance,
            maxRayDistance,
            sceneRect
        };
    }

    /**
     * Retrieves all AmbientLight documents on the scene.
     * Normalizes across Foundry Collection, Map, or Array structures.
     * @param {any} [scene=canvas?.scene] Target scene
     * @returns {any[]} Array of AmbientLight documents
     */
    getSceneLights(scene: any = canvas?.scene): any[] {
        if (!scene) return [];
        const lightsCollection = scene.lights;
        if (!lightsCollection) return [];
        if (lightsCollection.contents) return lightsCollection.contents;
        if (typeof lightsCollection.values === 'function') return Array.from(lightsCollection.values());
        if (Array.isArray(lightsCollection)) return lightsCollection;
        return [];
    }

    /**
     * Retrieve the grid size in pixels for the current scene.
     * @param {Scene|null} [scene=canvas?.scene] Target scene
     * @returns {number} Grid size in pixels (default 100)
     */
    getGridSize(scene: any = canvas?.scene): number {
        return this.getSceneDimensions(scene).size;
    }

    /**
     * Retrieve the grid distance unit value for the current scene.
     * @param {Scene|null} [scene=canvas?.scene] Target scene
     * @returns {number} Grid distance in scene units (default 5)
     */
    getGridDistance(scene: any = canvas?.scene): number {
        return this.getSceneDimensions(scene).distance;
    }

    /**
     * Converts a distance in grid units (e.g., feet, meters) into canvas pixels.
     * @param {number} units Distance in grid units
     * @param {Scene|null} [scene=canvas?.scene] Target scene
     * @returns {number} Distance in canvas pixels
     */
    unitsToPixels(units: number, scene: any = canvas?.scene): number {
        if (!units) return 0;
        const { size, distance } = this.getSceneDimensions(scene);
        return (units / distance) * size;
    }

    /**
     * Converts a distance in canvas pixels into grid units (e.g., feet, meters).
     * @param {number} pixels Distance in canvas pixels
     * @param {Scene|null} [scene=canvas?.scene] Target scene
     * @returns {number} Distance in grid units
     */
    pixelsToUnits(pixels: number, scene: any = canvas?.scene): number {
        if (!pixels) return 0;
        const { size, distance } = this.getSceneDimensions(scene);
        return (pixels / size) * distance;
    }

    /**
     * Computes the center coordinates of the scene with safe canvas and document fallbacks.
     * @param {Scene|null} [scene=canvas?.scene] Target scene
     * @returns {{ x: number, y: number }} Center coordinates
     */
    getSceneCenter(scene: any = canvas?.scene): { x: number, y: number } {
        const dims = this.getSceneDimensions(scene);
        return {
            x: dims.width / 2,
            y: dims.height / 2
        };
    }

    /* -------------------------------------------- */
    /*  Geometry, Coordinates & Center Extraction   */
    /* -------------------------------------------- */

    /**
     * Retrieve the documentName for a placeable or document across Foundry versions.
     * @param {PlaceableObject|Document|null} target Target placeable or document
     * @returns {string|undefined} Canonical document name (e.g., "Token", "Tile", "Region")
     */
    getDocumentName(target: any): string | undefined {
        if (!target) return undefined;
        const doc = target.document ? target.document : target;
        return doc.documentName;
    }

    /**
     * Tests whether a placeable or document matches a specific Document type name.
     * @param {PlaceableObject|Document|null} target Target placeable or document
     * @param {string} type Expected document type name (e.g. "Token", "Tile", "Region")
     * @returns {boolean}
     */
    isDocumentType(target: any, type: string): boolean {
        return this.getDocumentName(target) === type;
    }

    /**
     * Backward-compatible alias for isDocumentType.
     * @param {PlaceableObject|Document|null} target Target placeable or document
     * @param {string} type Expected document type name
     * @returns {boolean}
     */
    isDocumentOfType(target: any, type: string): boolean {
        return this.isDocumentType(target, type);
    }

    /**
     * Checks whether a target is a Token placeable or Token document.
     * @param {unknown} target Target placeable or document
     * @returns {boolean}
     */
    isToken(target: unknown): target is Token {
        if (!target || typeof target !== 'object') return false;
        const docName = this.getDocumentName(target);
        if (docName) return docName === 'Token';
        if ('bounds' in target && !('center' in target)) return false;
        return 'document' in target || 'center' in target;
    }

    /**
     * Checks whether a target is an Actor document.
     * @param {unknown} target Target document or object
     * @returns {boolean}
     */
    isActor(target: unknown): target is Actor {
        if (!target || typeof target !== 'object') return false;
        const docName = this.getDocumentName(target);
        if (docName) return docName === 'Actor';
        return 'items' in target && !('document' in target) && 'uuid' in target;
    }

    /**
     * Checks whether a target is a Tile placeable or Tile document.
     * @param {unknown} target Target placeable or document
     * @returns {boolean}
     */
    isTile(target: unknown): target is Tile {
        if (!target || typeof target !== 'object') return false;
        const docName = this.getDocumentName(target);
        if (docName) return docName === 'Tile';
        return 'bounds' in target && !('center' in target);
    }

    /**
     * Resolve a PlaceableObject by its unique identifier across primary canvas layers.
     * @param {string} id Target placeable ID
     * @returns {PlaceableObject|null}
     */
    getPlaceable(id: string): any {
        if (!id) return null;
        return (canvas as any)?.tokens?.get(id)
            ?? (canvas as any)?.tiles?.get(id)
            ?? (canvas as any)?.walls?.get(id)
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
    getSpeakerToken(message: ChatMessage | null | undefined, extractedTokenId: string | null = null): Token | null {
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
    getSpeakerActor(message: ChatMessage | null | undefined): Actor | null {
        const speaker = (message as any)?.speaker ?? message;
        if (speaker && (ChatMessage as any)?.getSpeakerActor) {
            const actor = (ChatMessage as any).getSpeakerActor(speaker);
            if (actor) return actor;
        }
        const speakerToken = this.getSpeakerToken(message);
        return speakerToken?.actor ?? game?.user?.character ?? null;
    }

    /* -------------------------------------------- */
    /*  Token Distance & Grid Centering Math        */
    /* -------------------------------------------- */

    /**
     * Resolves the { x, y } center coordinates of a placeable, document, or coordinate object.
     * @param {PlaceableObject|Document|{x: number, y: number}|null} target Target placeable, document, or coordinate point
     * @returns {{ x: number, y: number }} Center coordinates
     */
    getCenter(target: any) {
        if (!target) return null;
        if (target.center && typeof target.center.x === 'number' && typeof target.center.y === 'number') {
            return { x: target.center.x, y: target.center.y };
        }
        if (target.object?.center && typeof target.object.center.x === 'number' && typeof target.object.center.y === 'number') {
            return { x: target.object.center.x, y: target.object.center.y };
        }
        if (typeof target.x === 'number' && typeof target.y === 'number' && !target.document && !target.object && target.width === undefined && target.height === undefined) {
            return { x: target.x, y: target.y };
        }
        const doc = target.document ? target.document : target;
        const isRegion = doc.documentName === 'Region' || Boolean(doc.shapes) || Boolean(target.shapes) || (Boolean(doc.bounds) && !doc.texture);
        if (isRegion) {
            return this.getRegionBounds(target).center;
        }
        const gridSize = this.getGridSize();
        const width = (doc.width ?? 1) * gridSize;
        const height = (doc.height ?? 1) * gridSize;
        return {
            x: (doc.x ?? 0) + width / 2,
            y: (doc.y ?? 0) + height / 2
        };
    }

    /**
     * Extracts normalized pixel dimensions, grid unit spans, and pixel radius for a token placeable.
     * @param {Token} token Target token placeable
     * @returns {{ widthPx: number, heightPx: number, widthUnits: number, heightUnits: number, radiusPx: number }}
     */
    getTokenDimensions(token: Token) {
        if (!token) return { widthPx: 0, heightPx: 0, widthUnits: 1, heightUnits: 1, radiusPx: 0 };
        const gridSize = this.getGridSize();
        const widthUnits = token.document.width ?? 1;
        const heightUnits = token.document.height ?? 1;
        const widthPx = token.w ?? (widthUnits * gridSize);
        const heightPx = token.h ?? (heightUnits * gridSize);
        const radiusPx = Math.max(widthPx, heightPx) / 2;
        return {
            widthPx,
            heightPx,
            widthUnits,
            heightUnits,
            radiusPx
        };
    }

    /**
     * Extracts the authoritative rotation in degrees for a token placeable.
     * @param {Token|null|undefined} token Target token placeable
     * @returns {number} Rotation angle in degrees (0 to 360)
     */
    getTokenRotation(token: Token | null | undefined): number {
        if (!token) return 0;
        return token.document.rotation ?? 0;
    }

    /**
     * Extracts the authoritative rotation in degrees for a tile placeable.
     * @param {Tile|null|undefined} tile Target tile placeable
     * @returns {number} Rotation angle in degrees (0 to 360)
     */
    getTileRotation(tile: Tile | null | undefined): number {
        if (!tile) return 0;
        return tile.document.rotation ?? 0;
    }

    /**
     * Calculates the 3D distance between two tokens in scene units (e.g. feet/meters), rounded up.
     * @param {Token} t1 The source token placeable
     * @param {Token} t2 The target token placeable
     * @returns {number} Distance in scene units, rounded up
     */
    getDistance(t1: Token, t2: Token): number {
        if (!t1 || !t2) return 0;
        const p1 = this.getCenter(t1);
        const p2 = this.getCenter(t2);
        if (!p1 || !p2) return 0;
        const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        const { size: gridSize, distance: gridDistance } = this.getSceneDimensions();
        const dist2DUnits = (dist2DPx / gridSize) * gridDistance;

        const el1 = t1.document.elevation ?? 0;
        const el2 = t2.document.elevation ?? 0;
        const elDiff = el1 - el2;

        const dist3DUnits = Math.hypot(dist2DUnits, elDiff);
        return Math.ceil(dist3DUnits);
    }

    /**
     * Calculates an array of linearly interpolated { x, y } coordinates between two points.
     * @param {{ x: number, y: number }} point1 Starting point
     * @param {{ x: number, y: number }} point2 Ending point
     * @param {number} [stepDistancePx=100] Distance in pixels between each interpolated point
     * @returns {Array<{ x: number, y: number }>} Array of interpolated points including start and end
     */
    getInterpolatedPoints(point1: any, point2: any, stepDistancePx: number = 100): Array<{ x: number, y: number }> {
        const p1 = this.getCenter(point1);
        const p2 = this.getCenter(point2);
        if (!p1 || !p2) return p1 ? [p1] : (p2 ? [p2] : []);
        const totalDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (totalDistance === 0 || stepDistancePx <= 0) return [p1];

        const steps = Math.max(1, Math.round(totalDistance / stepDistancePx));
        const points: Array<{ x: number, y: number }> = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            });
        }
        return points;
    }

    /**
     * Finds the center coordinate of the grid square on a target token nearest to a source token.
     * @param {Token} token The source token placeable
     * @param {Token} target The target token placeable
     * @returns {{x: number, y: number}|null} Coordinate of nearest square center
     */
    getNearestSquareCenter(token: Token, target: Token): { x: number, y: number } | null {
        if (!token || !target) return null;
        const gs = this.getGridSize();
        const srcCenter = this.getCenter(token);
        if (!srcCenter) return null;

        const w = target.document.width ?? 1;
        const h = target.document.height ?? 1;

        let bestPoint: { x: number, y: number } | null = null;
        let bestDist2 = Infinity;

        for (let gx = 0; gx < w; gx++) {
            for (let gy = 0; gy < h; gy++) {
                const cx = target.x + (gx + 0.5) * gs;
                const cy = target.y + (gy + 0.5) * gs;

                const dx = cx - srcCenter.x;
                const dy = cy - srcCenter.y;
                const d2 = dx * dx + dy * dy;

                if (d2 < bestDist2) {
                    bestDist2 = d2;
                    bestPoint = { x: cx, y: cy };
                }
            }
        }

        return bestPoint ?? this.getCenter(target);
    }

    /**
     * Finds the center point of the adjacent grid cell with the minimal perpendicular distance
     * to the line between two tokens.
     * @param {Token} token The reference token placeable
     * @param {Token} target The target token placeable
     * @returns {{ x: number, y: number }|null} The center point { x, y } of the best adjacent grid cell
     */
    getBestAdjacentLocation(token: Token, target: Token): { x: number, y: number } | null {
        const p1 = this.getCenter(token);
        const p2 = this.getCenter(target);
        if (!p1 || !p2) return null;

        // Line: ax + by + c = 0 where (x1, y1) is p1 and (x2, y2) is p2
        const a = p1.y - p2.y;
        const b = p2.x - p1.x;
        const c = p1.x * p2.y - p2.x * p1.y;
        const denominator = Math.hypot(a, b);

        const getDistance = (p: { x: number, y: number }) => {
            if (denominator === 0) return 0;
            return Math.abs(a * p.x + b * p.y + c) / denominator;
        };

        const gridSize = this.getGridSize();
        const tWidth = token.document.width ?? 1;
        const tHeight = token.document.height ?? 1;
        const tX = token.document.x ?? token.x;
        const tY = token.document.y ?? token.y;

        const getCenterPoint = (pt: { x: number, y: number }) => {
            if ((canvas as any)?.grid?.getCenterPoint) return (canvas as any).grid.getCenterPoint(pt);
            return { x: pt.x + gridSize / 2, y: pt.y + gridSize / 2 };
        };

        const candidates: Array<{ x: number, y: number }> = [];
        // Iterate around the token's footprint to find all adjacent grid centers
        for (let i = -1; i <= tWidth; i++) {
            for (let j = -1; j <= tHeight; j++) {
                // Skip the cells actually occupied by the token
                if (i >= 0 && i < tWidth && j >= 0 && j < tHeight) continue;

                const cellX = tX + (i * gridSize);
                const cellY = tY + (j * gridSize);
                candidates.push(getCenterPoint({ x: cellX, y: cellY }));
            }
        }

        if (candidates.length === 0) return p1;

        let location = candidates[0];
        let minDistance = Infinity;

        for (const cand of candidates) {
            const d = getDistance(cand);
            if (d < minDistance) {
                minDistance = d;
                location = cand;
            } else if (Math.abs(d - minDistance) < 0.1) {
                // Tie-breaker: choose the one closer to the target's current position
                const distToTargetCurr = Math.hypot(cand.x - p2.x, cand.y - p2.y);
                const distToTargetBest = Math.hypot(location.x - p2.x, location.y - p2.y);
                if (distToTargetCurr < distToTargetBest) {
                    location = cand;
                }
            }
        }

        return location;
    }

    /**
     * Returns an array of users who are owners of a given token.
     * Evaluates document ownership permissions via user permission tiers and ownership levels.
     * @param {Token} token Target token placeable
     * @param {object} [config={}] Configuration options
     * @param {boolean} [config.applyPC=true] Whether to include player characters
     * @param {boolean} [config.applyGM=true] Whether to include Game Masters
     * @returns {User[]} Array of User objects
     */
    getTokenOwners(token: Token, config: any = {}): any[] {
        if (!token) return [];
        const applyPC = config.applyPC !== false;
        const applyGM = config.applyGM !== false;

        const isOwner = (u: any) => this.isUserDocumentOwner(u, token.actor) || this.isUserDocumentOwner(u, token.document);

        const usersCollection = game?.users;
        const allUsers = usersCollection?.contents
            ?? (usersCollection?.values ? Array.from(usersCollection.values()) : null)
            ?? (usersCollection ? Array.from(usersCollection) : []);

        let matched = allUsers.filter(user => isOwner(user));
        if (!applyPC) matched = matched.filter(user => Boolean(user.isGM));
        if (!applyGM) matched = matched.filter(user => !user.isGM);
        return matched;
    }

    /* -------------------------------------------- */
    /*  Tile & Token Containment Operations         */
    /* -------------------------------------------- */

    /**
     * Calculate bounding box and center for a Tile.
     * In V12/V13 baseline, tile origin (x, y) is top-left (0, 0).
     * @param {Tile} tile Target tile placeable
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number, center: {x: number, y: number}, width: number, height: number, anchor: {x: number, y: number} }}
     */
    getTileBounds(tile: Tile) {
        if (!tile) return { minX: 0, maxX: 0, minY: 0, maxY: 0, center: { x: 0, y: 0 }, width: 0, height: 0, anchor: { x: 0, y: 0 } };
        const doc = tile.document;
        const x = doc.x;
        const y = doc.y;
        const width = doc.width;
        const height = doc.height;
        const center = tile.center ?? { x: x + width / 2, y: y + height / 2 };
        return {
            minX: x,
            maxX: x + width,
            minY: y,
            maxY: y + height,
            center,
            width,
            height,
            anchor: { x: 0, y: 0 }
        };
    }

    /**
     * Retrieve all tokens overlapping or contained within a tile.
     * @param {Tile} tile Target Tile placeable
     * @returns {Token[]} Array of matching Token placeables
     */
    getTokensInTile(tile: Tile): Token[] {
        if (!tile) return [];
        const { minX: tileMinX, maxX: tileMaxX, minY: tileMinY, maxY: tileMaxY } = this.getTileBounds(tile);

        const gridSize = this.getGridSize();
        const tokens = canvas?.tokens?.placeables ?? [];

        return tokens.filter(token => {
            const tDoc = token.document;
            const tWidth = (tDoc.width ?? 1) * gridSize;
            const tHeight = (tDoc.height ?? 1) * gridSize;

            // Check authoritative document bounds (where the token is logically placed in the database)
            const docMinX = tDoc.x;
            const docMaxX = docMinX + tWidth;
            const docMinY = tDoc.y;
            const docMaxY = docMinY + tHeight;
            const docOverlaps = !(docMaxX <= tileMinX || docMinX >= tileMaxX || docMaxY <= tileMinY || docMinY >= tileMaxY);

            if (docOverlaps) return true;

            // Also check canvas placeable bounds if animating or rendering at a distinct location
            if (token.x !== undefined && token.y !== undefined) {
                const objWidth = token.w ?? tWidth;
                const objHeight = token.h ?? tHeight;
                const objMinX = token.x;
                const objMaxX = objMinX + objWidth;
                const objMinY = token.y;
                const objMaxY = objMinY + objHeight;
                return !(objMaxX <= tileMinX || objMinX >= tileMaxX || objMaxY <= tileMinY || objMinY >= tileMaxY);
            }

            return false;
        });
    }

    /* -------------------------------------------- */
    /*  Placeable Element Attachment Operations     */
    /* -------------------------------------------- */

    /**
     * Attaches elements to a target PlaceableObject (Token or Tile).
     * If the target is a Tile, uses Baileywiki Mass Edit if active.
     * If the target is a Token, falls back to Token Attacher or Mass Edit.
     * @param {Array<PlaceableObject>|PlaceableObject} elements Elements to attach
     * @param {PlaceableObject} target Target Token or Tile placeable
     * @returns {Promise<unknown>}
     */
    async attachPlaceableElements(elements: any, target: any) {
        const isTile = this.isDocumentOfType(target, 'Tile');

        if (isTile) {
            dependency.required([
                { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
            ]);
            if (this.massEdit?.link) return this.massEdit.link(elements, target);
            return null;
        }

        // Default Token behavior
        if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
            if (this.tokenAttacher?.attachElementsToToken) {
                return this.tokenAttacher.attachElementsToToken(elements, target, true);
            }
        } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            if (this.massEdit?.link) return this.massEdit.link(elements, target);
        }

        dependency.someRequired([
            { id: 'token-attacher', ref: "Token Attacher" },
            { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
        ]);
    }

    /**
     * Detaches elements from a target PlaceableObject (Token or Tile).
     * @param {Array<PlaceableObject>|PlaceableObject} elements Elements to detach
     * @param {PlaceableObject} target Target Token or Tile placeable
     * @returns {Promise<unknown>}
     */
    async detachPlaceableElements(elements: any, target: any) {
        const isTile = this.isDocumentOfType(target, 'Tile');

        if (isTile) {
            dependency.required([
                { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
            ]);
            if (this.massEdit?.removeLinks) return this.massEdit.removeLinks(elements, target);
            return null;
        }

        // Default Token behavior
        if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
            if (this.tokenAttacher?.detachElementsFromToken) {
                return this.tokenAttacher.detachElementsFromToken(elements, target, true);
            }
        } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            if (this.massEdit?.removeLinks) return this.massEdit.removeLinks(elements, target);
        }

        dependency.someRequired([
            { id: 'token-attacher', ref: "Token Attacher" },
            { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
        ]);
    }

    /**
     * Format a document update payload to delete/remove a specific property key.
     * @param {string} path Dot-delimited parent property path (e.g. "flags.eskie-macros.token-masks")
     * @param {string} keyId The property key to delete
     * @returns {Record<string, *>} Update dictionary
     */
    formatDeletionUpdate(path: string, keyId: string): Record<string, any> {
        throw new Error('BaseFoundryAdapter.formatDeletionUpdate must be implemented by version subclass');
    }

    /* -------------------------------------------- */
    /*  Region & Region Behavior Operations (V14+)  */
    /* -------------------------------------------- */

    /**
     * Whether the active Foundry platform version supports native RegionBehaviors (V14+).
     * @type {boolean}
     */
    get supportsRegionBehaviors(): boolean {
        return false;
    }

    /**
     * Retrieve currently controlled Region documents or placeables.
     * Legacy baseline returns an empty array.
     * @returns {RegionDocument[]}
     */
    getControlledRegions(): any[] {
        return [];
    }

    /**
     * Calculate bounding box and center for a Region.
     * Legacy baseline evaluates center if present, otherwise returns default zero-bound structure.
     * @param {Region|RegionDocument} region Target Region
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number, center: {x: number, y: number}, width: number, height: number, anchor: {x: number, y: number} }}
     */
    getRegionBounds(region: any): any {
        if (!region) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, center: { x: 0, y: 0 }, width: 0, height: 0, anchor: { x: 0.5, y: 0.5 } };
        }
        const doc = region.document ? region.document : region;
        const placeable = region.document ? region : (region.object ? region.object : region);
        const center = placeable?.center ?? doc.center;
        if (center && typeof center.x === 'number' && typeof center.y === 'number') {
            return { minX: center.x, maxX: center.x, minY: center.y, maxY: center.y, center: { x: center.x, y: center.y }, width: 0, height: 0, anchor: { x: 0.5, y: 0.5 } };
        }
        return {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0,
            center: { x: 0, y: 0 },
            width: 0,
            height: 0,
            anchor: { x: 0.5, y: 0.5 }
        };
    }

    /**
     * Retrieve all tokens overlapping or contained within a Region.
     * Legacy baseline returns an empty array.
     * @param {Region|RegionDocument} _region Target Region
     * @returns {Token[]}
     */
    getTokensInRegion(_region: any): any[] {
        return [];
    }

    /**
     * Create an embedded RegionBehavior on a RegionDocument.
     * Legacy baseline NOP returning null.
     * @param {Region|RegionDocument} _region Target Region
     * @param {object} _behaviorData Behavior configuration data
     * @returns {Promise<RegionBehavior|null>}
     */
    async createRegionBehavior(_region: any, _behaviorData: any) {
        return null;
    }

    /**
     * Format a RegionBehavior data payload for creation.
     * Legacy baseline returns an empty object.
     * @param {object} _config Behavior creation options
     * @returns {object}
     */
    formatRegionBehaviorData(_config: any) {
        return {};
    }

    /**
     * Extract the active image texture filepath from a placeable or document.
     * @param {PlaceableObject|Document|null} placeable Target placeable or document
     * @returns {string|null}
     */
    getPlaceableTexture(placeable: any) {
        if (!placeable) return null;
        const doc = placeable.document ? placeable.document : placeable;
        return doc.texture?.src ?? doc.src ?? null;
    }

    /**
     * Resolve the bounding box and center coordinates for a placeable or document (Tile or Region).
     * Inspects whether the target is a Tile or Region and delegates to the appropriate bound checking method.
     * @param {PlaceableObject|Document|null} object Target placeable or document
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number, center: {x: number, y: number}, width: number, height: number, anchor: {x: number, y: number} }}
     */
    getBounds(object: any) {
        if (!object) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, center: { x: 0, y: 0 }, width: 0, height: 0, anchor: { x: 0.5, y: 0.5 } };
        }
        const doc = object.document ? object.document : object;
        const isRegion = doc.documentName === 'Region' || Boolean(doc.shapes) || Boolean(object.shapes) || (Boolean(doc.bounds) && !doc.texture);
        if (isRegion) {
            return this.getRegionBounds(object);
        }
        return this.getTileBounds(object);
    }

    /**
     * Retrieve all tokens overlapping or contained within a placeable or document (Tile or Region).
     * Inspects whether the target is a Tile or Region and delegates to the appropriate token query method.
     * @param {PlaceableObject|Document|null} object Target placeable or document
     * @returns {Token[]} Array of matching Token placeables
     */
    getTokensInPlaceable(object: any) {
        if (!object) return [];
        const doc = object.document ? object.document : object;
        const isRegion = doc.documentName === 'Region' || Boolean(doc.shapes) || Boolean(object.shapes) || (Boolean(doc.bounds) && !doc.texture);
        if (isRegion) {
            return this.getTokensInRegion(object);
        }
        return this.getTokensInTile(object);
    }

    /**
     * Test whether a 2D point is contained within a placeable or document (Tile or Region).
     * Baseline performs bounding-box containment.
     * @param {PlaceableObject|Document|null} object Target placeable or document
     * @param {{ x: number, y: number }} point Point coordinates
     * @returns {boolean}
     */
    containsPoint(object: any, point: any) {
        if (!object || !point) return false;
        const { minX, maxX, minY, maxY } = this.getBounds(object);
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }

    /**
     * Resolves the origin point { x, y } for a Region placeable or document.
     * If an explicit origin point is defined on the document or placeable, returns that point.
     * Otherwise delegates to the Region's center coordinates.
     * @param {Region|RegionDocument|null} region Target Region
     * @returns {{ x: number, y: number }} Origin coordinates
     */
    getRegionOrigin(region: any) {
        if (!region) return { x: 0, y: 0 };
        const doc = region.document ? region.document : region;
        if (doc.origin && typeof doc.origin.x === 'number' && typeof doc.origin.y === 'number') {
            return { x: doc.origin.x, y: doc.origin.y };
        }
        if (region.origin && typeof region.origin.x === 'number' && typeof region.origin.y === 'number') {
            return { x: region.origin.x, y: region.origin.y };
        }
        return this.getCenter(region);
    }

    /**
     * Resolves the target location { x, y } for a placeable, document, or coordinate point.
     * For regions, tiles, and tokens: resolves the center point { x, y } (or explicit origin if defined).
     * @param {PlaceableObject|Document|{x: number, y: number}|null} target Target placeable, document, or coordinate point
     * @returns {{ x: number, y: number }|null} Target location coordinates
     */
    getTargetLocation(target: any) {
        if (!target) return null;
        if (typeof target.x === 'number' && typeof target.y === 'number' && !target.document && !target.object && target.width === undefined && target.height === undefined && !target.shapes) {
            return { x: target.x, y: target.y };
        }
        const doc = target.document ? target.document : target;
        if (doc.origin && typeof doc.origin.x === 'number' && typeof doc.origin.y === 'number') {
            return { x: doc.origin.x, y: doc.origin.y };
        }
        if (target.origin && typeof target.origin.x === 'number' && typeof target.origin.y === 'number') {
            return { x: target.origin.x, y: target.origin.y };
        }
        return this.getCenter(target);
    }
}

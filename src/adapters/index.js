import { initializeFoundryAdapter, BaseFoundryAdapter, FoundryCurrentAdapter, USER_PERMISSION_TIERS } from './foundry/index.js';
import { initializeSystemAdapter, BaseSystemAdapter, Dnd5eSystemAdapter, Pf2eSystemAdapter, GenericSystemAdapter, parseAndNormalizeAbility, BASE_ABILITY_MAP } from './system/index.js';
import { initializeModuleAdapters, hasActiveModuleAdapters, MODULE_ADAPTERS, BaseModuleAdapter, MidiQolModuleAdapter, midiQolAdapter, AutoanimationsModuleAdapter, autoanimationsAdapter, autoanimations, EMP_AA_Menu, BlfxModuleAdapter, blfxAdapter, blfx, EMP_BLFX_Registry, buildBlfxPayload, mergeBlfxCustomAutoRec, SocketlibModuleAdapter, socketlibAdapter, socketlibapi, socket, socketlib, AutorecManager, autorecManager, autorec, promptDestinationDialog, CONCENTRATING, MassEditModuleAdapter, massEditAdapter, massEdit, TokenAttacherModuleAdapter, tokenAttacherAdapter, tokenAttacher } from './modules/index.js';
import { log } from '../lib/logger.js';

/**
 * Unified Adapter Singleton for Eskie Macro Pack.
 * Centralizes and abstracts Foundry platform generations (V12, V13, V14+), Game Systems, and Third-Party Modules.
 */
export class Adapter {
    constructor() {
        this.foundry = new BaseFoundryAdapter(this);
        this.system = new GenericSystemAdapter(this.foundry);
        this.modules = new Map();
        this._initialized = false;
    }

    /**
     * Backward-compatible getter for active system adapter.
     * @type {BaseSystemAdapter}
     */
    get activeSystemAdapter() {
        return this.system;
    }

    set activeSystemAdapter(sys) {
        this.system = sys;
    }

    /**
     * Initialize all adapter layers (Foundry, System, Module).
     * @returns {Promise<void>}
     */
    async init() {
        this.foundry = initializeFoundryAdapter(this);
        this.system = await initializeSystemAdapter(game?.system?.id, this.foundry);
        this.modules = initializeModuleAdapters();
        this._initialized = true;
        const systemLabel = this.system.isSupported ? this.system.systemId : `${this.system.systemId} (unsupported)`;
        log.info(`Unified Adapter initialized [Foundry: v${this.foundry.generation}, System: ${systemLabel}, Modules: ${this.modules.size}]`);
    }

    /* -------------------------------------------- */
    /*  Module Adapter Layer Accessors              */
    /* -------------------------------------------- */

    /**
     * Retrieve a specific instantiated module adapter by module ID.
     * @param {string} moduleId Unique module identifier
     * @returns {BaseModuleAdapter|undefined}
     */
    getModule(moduleId) {
        return this.modules.get(moduleId);
    }

    /**
     * Check whether an active module adapter exists for a given module ID.
     * @param {string} moduleId Unique module identifier
     * @returns {boolean}
     */
    hasModule(moduleId) {
        return this.modules.has(moduleId);
    }

    get autoanimations() {
        return this.modules.get('autoanimations') ?? autoanimationsAdapter;
    }

    get blfx() {
        return this.modules.get('blfx')
            ?? this.modules.get('boss-loot-assets-premium')
            ?? this.modules.get('boss-loot-assets-free')
            ?? blfxAdapter;
    }

    get socketlib() {
        return this.modules.get('socketlib') ?? socketlibAdapter;
    }

    get midiQol() {
        return this.modules.get('midi-qol') ?? midiQolAdapter;
    }

    get autorec() {
        return autorecManager;
    }

    get massEdit() {
        return this.modules.get('multi-token-edit')
            ?? this.modules.get('mass-edit')
            ?? massEditAdapter;
    }

    get tokenAttacher() {
        return this.modules.get('token-attacher') ?? tokenAttacherAdapter;
    }

    /* -------------------------------------------- */
    /*  Foundry Platform Delegates                  */
    /* -------------------------------------------- */

    get generation() {
        return this.foundry.generation;
    }

    isNewerVersion(a, b) {
        return this.foundry.isNewerVersion(a, b);
    }

    fromUuidSync(uuid, options = {}) {
        return this.foundry.fromUuidSync(uuid, options);
    }

    async fromUuid(uuid, options = {}) {
        return this.foundry.fromUuid(uuid, options);
    }

    mergeObject(original, other = {}, options = {}) {
        return this.foundry.mergeObject(original, other, options);
    }

    duplicate(obj) {
        return this.foundry.duplicate(obj);
    }

    deepClone(obj) {
        return this.foundry.deepClone(obj);
    }

    getProperty(obj, path) {
        return this.foundry.getProperty(obj, path);
    }

    setProperty(obj, path, value) {
        return this.foundry.setProperty(obj, path, value);
    }

    randomID(length = 16) {
        return this.foundry.randomID(length);
    }

    isEmpty(obj) {
        return this.foundry.isEmpty(obj);
    }

    isNewerVersion(a, b) {
        return this.foundry.isNewerVersion(a, b);
    }

    hasProperty(obj, path) {
        return this.foundry.hasProperty(obj, path);
    }

    slugify(text, options = {}) {
        return this.foundry.slugify(text, options);
    }

    diffObject(original, other, options = {}) {
        return this.foundry.diffObject(original, other, options);
    }

    flattenObject(obj, d = 0) {
        return this.foundry.flattenObject(obj, d);
    }

    expandObject(obj, d = 0) {
        return this.foundry.expandObject(obj, d);
    }

    debounce(fn, delay) {
        return this.foundry.debounce(fn, delay);
    }

    async enrichHTML(content, options = {}) {
        return this.foundry.enrichHTML(content, options);
    }

    getCombatantsByToken(combat, token) {
        return this.foundry.getCombatantsByToken(combat, token);
    }

    getCombatantByToken(combat, token) {
        return this.foundry.getCombatantByToken(combat, token);
    }

    getUserPermissionTier(user) {
        return this.foundry.getUserPermissionTier(user);
    }

    isUserDocumentOwner(user, actor, tokenDoc) {
        return this.foundry.isUserDocumentOwner(user, actor, tokenDoc);
    }

    isUserInCharge(token, user = game?.user) {
        return this.foundry.isUserInCharge(token, user);
    }

    /* -------------------------------------------- */
    /*  Tile & Placeable Geometric Operations       */
    /* -------------------------------------------- */

    getRevealOffset(object, scale = 1) {
        return this.foundry.getRevealOffset(object, scale);
    }

    getShapeOffset(object) {
        return this.foundry.getShapeOffset(object);
    }

    getTileOffset(object, type, scale = 1) {
        return this.foundry.getTileOffset(object, type, scale);
    }

    getTemplatePosition(template, config = {}) {
        return this.foundry.getTemplatePosition(template, config);
    }

    getSceneBackground(scene = canvas?.scene, level = null) {
        return this.foundry.getSceneBackground(scene, level);
    }

    buttonDialog(buttonData, options = {}) {
        return this.foundry.buttonDialog(buttonData, options);
    }

    getDocumentName(target) {
        return this.foundry.getDocumentName(target);
    }

    isDocumentOfType(target, type) {
        return this.foundry.isDocumentOfType(target, type);
    }

    getPlaceable(id) {
        return this.foundry.getPlaceable(id);
    }

    getSpeakerToken(message, extractedTokenId = null) {
        return this.foundry.getSpeakerToken(message, extractedTokenId);
    }

    getSpeakerActor(message) {
        return this.foundry.getSpeakerActor(message);
    }

    getDistance(t1, t2) {
        return this.foundry.getDistance(t1, t2);
    }

    getNearestSquareCenter(token, target) {
        return this.foundry.getNearestSquareCenter(token, target);
    }

    getTokenOwners(token, config = {}) {
        return this.foundry.getTokenOwners(token, config);
    }

    attachPlaceableElements(elements, target) {
        return this.foundry.attachPlaceableElements(elements, target);
    }

    detachPlaceableElements(elements, target) {
        return this.foundry.detachPlaceableElements(elements, target);
    }

    formatDeletionUpdate(path, keyId) {
        return this.foundry.formatDeletionUpdate(path, keyId);
    }

    /* -------------------------------------------- */
    /*  System Layer Delegates                      */
    /* -------------------------------------------- */

    qualifyMessage(message) {
        return this.system.qualifyMessage(message);
    }

    extractRolls(message) {
        return this.system.extractRolls(message);
    }

    normalizeAbility(rawAbility, combinedText = "", customMap = {}) {
        return this.system.normalizeAbility(rawAbility, combinedText, customMap);
    }

    getSpellLevel(config = {}) {
        return this.system.getSpellLevel(config);
    }

    getCreatureType(actor) {
        return this.system.getCreatureType(actor);
    }
}

export const adapter = new Adapter();

export {
    BaseFoundryAdapter,
    FoundryCurrentAdapter,
    USER_PERMISSION_TIERS,
    BaseSystemAdapter,
    Dnd5eSystemAdapter,
    Pf2eSystemAdapter,
    GenericSystemAdapter,
    parseAndNormalizeAbility,
    BASE_ABILITY_MAP,
    MODULE_ADAPTERS,
    initializeModuleAdapters,
    hasActiveModuleAdapters,
    BaseModuleAdapter,
    MidiQolModuleAdapter,
    midiQolAdapter,
    AutoanimationsModuleAdapter,
    autoanimationsAdapter,
    autoanimations,
    EMP_AA_Menu,
    CONCENTRATING,
    AutorecManager,
    autorecManager,
    autorec,
    promptDestinationDialog,
    BlfxModuleAdapter,
    blfxAdapter,
    blfx,
    EMP_BLFX_Registry,
    buildBlfxPayload,
    mergeBlfxCustomAutoRec,
    SocketlibModuleAdapter,
    socketlibAdapter,
    socketlibapi,
    socket,
    socketlib,
    MassEditModuleAdapter,
    massEditAdapter,
    massEdit,
    TokenAttacherModuleAdapter,
    tokenAttacherAdapter,
    tokenAttacher
};

import { initializeFoundryAdapter, BaseFoundryAdapter } from './foundry/index.js';
import { initializeSystemAdapter, BaseSystemAdapter } from './system/index.js';
import { GenericSystemAdapter } from './system/generic-system-adapter.js';
import { initializeModuleAdapters, BaseModuleAdapter } from './modules/index.js';
import { autoanimationsAdapter } from './modules/autoanimations/autoanimations-module-adapter.js';
import { blfxAdapter } from './modules/blfx/blfx-module-adapter.js';
import { socketlibAdapter } from './modules/socketlib/socketlib-module-adapter.js';
import { midiQolAdapter } from './modules/midi-qol/midi-qol-module-adapter.js';
import { autorecManager } from './modules/autorec/autorec-module-adapter.js';
import { massEditAdapter } from './modules/mass-edit/mass-edit-module-adapter.js';
import { tokenAttacherAdapter } from './modules/token-attacher/token-attacher-module-adapter.js';
import { FoundrySummonsModuleAdapter } from './modules/foundry-summons/foundry-summons-module-adapter.js';
import { crosshair } from '../lib/crosshairs.js';
import { template } from '../lib/templates.js';
import { file } from '../lib/filemanager.js';
import { log } from '../lib/logger.js';

const foundrySummonsAdapter = new FoundrySummonsModuleAdapter();

/**
 * Unified Adapter Singleton for Eskie Macro Pack.
 * Centralizes and abstracts Foundry platform generations (V12, V13, V14+), Game Systems, and Third-Party Modules.
 */
class Adapter {
    foundry: BaseFoundryAdapter;
    system: BaseSystemAdapter;
    modules: Map<string, BaseModuleAdapter>;
    private _initialized: boolean;

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
    getModule(moduleId: string) {
        return this.modules.get(moduleId);
    }

    /**
     * Check whether an active module adapter exists for a given module ID.
     * @param {string} moduleId Unique module identifier
     * @returns {boolean}
     */
    hasModule(moduleId: string): boolean {
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

    get summons() {
        return (this.modules.get('foundry-summons') as FoundrySummonsModuleAdapter) ?? foundrySummonsAdapter;
    }

    get foundrySummons() {
        return this.summons;
    }

    get crosshair() {
        return crosshair;
    }

    get template() {
        return template;
    }

    get file() {
        return file;
    }

    /* -------------------------------------------- */
    /*  Foundry Platform Delegates                  */
    /* -------------------------------------------- */

    get generation() {
        return this.foundry.generation;
    }

    isNewerVersion(v1: string | number, v0: string | number, options?: { majorOnly?: boolean }): boolean {
        return this.foundry.isNewerVersion(v1, v0, options);
    }

    fromUuidSync(uuid: string, options = {}) {
        return this.foundry.fromUuidSync(uuid, options);
    }

    async fromUuid(uuid: string, options = {}) {
        return this.foundry.fromUuid(uuid, options);
    }

    mergeObject(original: any, other = {}, options = {}) {
        return this.foundry.mergeObject(original, other, options);
    }

    duplicate(obj: any) {
        return this.foundry.duplicate(obj);
    }

    deepClone(obj: any) {
        return this.foundry.deepClone(obj);
    }

    getProperty(obj: any, path: any) {
        return this.foundry.getProperty(obj, path);
    }

    setProperty(obj: any, path: any, value: any) {
        return this.foundry.setProperty(obj, path, value);
    }

    randomID(length = 16) {
        return this.foundry.randomID(length);
    }

    isEmpty(obj: any) {
        return this.foundry.isEmpty(obj);
    }

    hasProperty(obj: any, path: any) {
        return this.foundry.hasProperty(obj, path);
    }

    slugify(text: any, options = {}) {
        return this.foundry.slugify(text, options);
    }

    diffObject(original: any, other: any, options = {}) {
        return this.foundry.diffObject(original, other, options);
    }

    flattenObject(obj: any, d = 0) {
        return this.foundry.flattenObject(obj, d);
    }

    expandObject(obj: any, d = 0) {
        return this.foundry.expandObject(obj, d);
    }

    debounce(fn: any, delay: any) {
        return this.foundry.debounce(fn, delay);
    }

    async enrichHTML(content: any, options = {}) {
        return this.foundry.enrichHTML(content, options);
    }

    getCombatantsByToken(combat: Combat, token: Token): Combatant[] {
        return this.foundry.getCombatantsByToken(combat, token);
    }

    getCombatantByToken(combat: Combat, token: Token): Combatant | null {
        return this.foundry.getCombatantByToken(combat, token);
    }

    getUserPermissionTier(user: User): number | null {
        return this.foundry.getUserPermissionTier(user);
    }

    isUserDocumentOwner(user: User, doc: any): boolean {
        return this.foundry.isUserDocumentOwner(user, doc);
    }

    isUserInCharge(token: Token, user: User = game.user): boolean {
        return this.foundry.isUserInCharge(token, user);
    }

    /* -------------------------------------------- */
    /*  Tile & Placeable Geometric Operations       */
    /* -------------------------------------------- */

    getRevealOffset(object: any, scale = 1) {
        return this.foundry.getRevealOffset(object, scale);
    }

    getShapeOffset(object: any) {
        return this.foundry.getShapeOffset(object);
    }

    getTileOffset(object: any, type: any, scale = 1) {
        return this.foundry.getTileOffset(object, type, scale);
    }

    getTemplatePosition(template: any, config = {}) {
        return this.foundry.getTemplatePosition(template, config);
    }

    getCrosshairPosition(position: any, config = {}) {
        return this.foundry.getCrosshairPosition(position, config);
    }

    resolveDistinctPositions(positions: any, config = {}, template = null) {
        return this.foundry.resolveDistinctPositions(positions, config, template);
    }

    getSceneBackground(scene = canvas?.scene, level = null) {
        return this.foundry.getSceneBackground(scene, level);
    }

    getSceneDimensions(scene = canvas?.scene) {
        return this.foundry.getSceneDimensions(scene);
    }

    getSceneLights(scene = canvas?.scene) {
        return this.foundry.getSceneLights(scene);
    }

    getGridSize(scene = canvas?.scene) {
        return this.foundry.getGridSize(scene);
    }

    getSceneCenter(scene = canvas?.scene) {
        return this.foundry.getSceneCenter(scene);
    }

    getCenter(target: any) {
        return this.foundry.getCenter(target);
    }

    getTokenDimensions(token: Token) {
        return this.foundry.getTokenDimensions(token);
    }

    getTokenRotation(token: Token | null | undefined): number {
        return this.foundry.getTokenRotation(token);
    }

    getTileRotation(tile: Tile | null | undefined): number {
        return this.foundry.getTileRotation(tile);
    }

    getInterpolatedPoints(point1: any, point2: any, stepDistancePx = 100) {
        return this.foundry.getInterpolatedPoints(point1, point2, stepDistancePx);
    }

    getBestAdjacentLocation(token: Token, target: Token): { x: number, y: number } | null {
        return this.foundry.getBestAdjacentLocation(token, target);
    }

    buttonDialog(buttonData: any, options = {}) {
        return this.foundry.buttonDialog(buttonData, options);
    }

    getDocumentName(target: any) {
        return this.foundry.getDocumentName(target);
    }

    isDocumentOfType(target: any, type: string): boolean {
        return this.foundry.isDocumentOfType(target, type);
    }

    isToken(target: unknown): target is Token {
        return this.foundry.isToken(target);
    }

    isActor(target: unknown): target is Actor {
        return this.foundry.isActor(target);
    }

    isTile(target: unknown): target is Tile {
        return this.foundry.isTile(target);
    }

    getPlaceable(id: string) {
        return this.foundry.getPlaceable(id);
    }

    async loadTemplates(paths: string[]): Promise<Function[]> {
        return this.foundry.loadTemplates(paths);
    }

    getSpeakerToken(message: ChatMessage | null | undefined, extractedTokenId: string | null = null): Token | null {
        return this.foundry.getSpeakerToken(message, extractedTokenId);
    }

    getSpeakerActor(message: ChatMessage | null | undefined): Actor | null {
        return this.foundry.getSpeakerActor(message);
    }

    getDistance(t1: Token, t2: Token): number {
        return this.foundry.getDistance(t1, t2);
    }

    getNearestSquareCenter(token: Token, target: Token): { x: number, y: number } | null {
        return this.foundry.getNearestSquareCenter(token, target);
    }

    getTokenOwners(token: Token, config: Record<string, unknown> = {}): User[] {
        return this.foundry.getTokenOwners(token, config);
    }

    getTileBounds(tile: Tile) {
        return this.foundry.getTileBounds(tile);
    }

    getTokensInTile(tile: Tile): Token[] {
        return this.foundry.getTokensInTile(tile);
    }

    attachPlaceableElements(elements: any, target: any) {
        return this.foundry.attachPlaceableElements(elements, target);
    }

    detachPlaceableElements(elements: any, target: any) {
        return this.foundry.detachPlaceableElements(elements, target);
    }

    formatDeletionUpdate(path: string, keyId: string): Record<string, any> {
        return this.foundry.formatDeletionUpdate(path, keyId);
    }

    /* -------------------------------------------- */
    /*  Region & Region Behavior Delegates          */
    /* -------------------------------------------- */

    get supportsRegionBehaviors() {
        return this.foundry.supportsRegionBehaviors;
    }

    getControlledRegions() {
        return this.foundry.getControlledRegions();
    }

    getRegionBounds(region: any) {
        return this.foundry.getRegionBounds(region);
    }

    getTokensInRegion(region: any) {
        return this.foundry.getTokensInRegion(region);
    }

    createRegionBehavior(region: any, behaviorData: any) {
        return this.foundry.createRegionBehavior(region, behaviorData);
    }

    formatRegionBehaviorData(config: any) {
        return this.foundry.formatRegionBehaviorData(config);
    }

    getPlaceableTexture(placeable: any) {
        return this.foundry.getPlaceableTexture(placeable);
    }

    getBounds(object: any) {
        return this.foundry.getBounds(object);
    }

    getTokensInPlaceable(object: any) {
        return this.foundry.getTokensInPlaceable(object);
    }

    containsPoint(object: any, point: any) {
        return this.foundry.containsPoint(object, point);
    }

    getRegionOrigin(region: any) {
        return this.foundry.getRegionOrigin(region);
    }

    getTargetLocation(target: any) {
        return this.foundry.getTargetLocation(target);
    }

    /* -------------------------------------------- */
    /*  System Layer Delegates                      */
    /* -------------------------------------------- */

    qualifyMessage(message: any) {
        return this.system.qualifyMessage(message);
    }

    extractRolls(message: any) {
        return this.system.extractRolls(message);
    }

    normalizeAbility(rawAbility: any, combinedText = "", customMap = {}) {
        return this.system.normalizeAbility(rawAbility, combinedText, customMap);
    }

    getSpellLevel(config = {}) {
        return this.system.getSpellLevel(config);
    }

    getCreatureType(actor: any) {
        return this.system.getCreatureType(actor);
    }
}

export const adapter = new Adapter();

export {
    Adapter,
    BaseFoundryAdapter,
    BaseSystemAdapter,
    BaseModuleAdapter
};

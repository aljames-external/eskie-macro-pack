import { BaseFoundryAdapter } from './base-foundry-adapter.js';

/**
 * Modern Foundry VTT platform adapter (Foundry V14+).
 * Overrides platform constructors, token combat helpers, tile anchor offsets, and Region geometry calculations.
 */
export class FoundryCurrentAdapter extends BaseFoundryAdapter {
    /**
     * The active ContextMenu constructor in v14+.
     */
    get ContextMenu() {
        return foundry.applications?.ux?.ContextMenu ?? super.ContextMenu;
    }

    /**
     * The active KeyboardManager constructor in v14+.
     */
    get KeyboardManager() {
        return foundry.helpers?.interaction?.KeyboardManager ?? super.KeyboardManager;
    }

    /**
     * The active Token placeable constructor in v14+.
     */
    get Token() {
        return foundry.canvas?.placeables?.Token ?? super.Token;
    }

    /**
     * The active Tile placeable constructor in v14+.
     */
    get Tile() {
        return foundry.canvas?.placeables?.Tile ?? super.Tile;
    }

    /**
     * The active FilePicker constructor / implementation in v14+.
     */
    get FilePicker() {
        return foundry.applications?.apps?.FilePicker?.implementation ?? super.FilePicker;
    }

    /**
     * The active TextEditor constructor / implementation in v14+.
     */
    get TextEditor() {
        return foundry.applications?.ux?.TextEditor?.implementation ?? super.TextEditor;
    }

    /**
     * Retrieve all combatants associated with a token in combat using v14+ Combat#getCombatantsByToken.
     * @param {Combat} combat Target combat encounter
     * @param {string|TokenDocument|Token} token Token ID or Document or Placeable
     * @returns {Combatant[]}
     */
    getCombatantsByToken(combat, token) {
        if (!combat) return [];
        const tokenId = token?.id ?? token?.document?.id ?? token;
        if (!tokenId) return [];

        return combat.getCombatantsByToken?.(tokenId) ?? super.getCombatantsByToken(combat, token);
    }

    /**
     * Retrieve the primary combatant associated with a token in combat using v14+ Combat#getCombatantsByToken.
     * @param {Combat} combat Target combat encounter
     * @param {string|TokenDocument|Token} token Token ID or Document or Placeable
     * @returns {Combatant|null}
     */
    getCombatantByToken(combat, token) {
        return this.getCombatantsByToken(combat, token)[0] ?? null;
    }

    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math (V14+)        */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset for Foundry V14+ (centered anchor (0.5, 0.5)).
     * Centered origin matches token center directly.
     *
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @param {number} [_scale=1] Additional scale multiplier (unused in V14 centered origin)
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getRevealOffset(object, _scale = 1) {
        if (!object) return { x: 0, y: 0 };
        const center = object.center;
        if (center?.x !== undefined && center?.y !== undefined) {
            return { x: center.x, y: center.y };
        }
        const doc = object.document ?? object;
        const objX = object.x ?? doc.x ?? 0;
        const objY = object.y ?? doc.y ?? 0;
        return { x: objX, y: objY };
    }

    /**
     * Calculate shape tile placement offset for Foundry V14+ (centered anchor (0.5, 0.5)).
     *
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getShapeOffset(object) {
        if (!object) return { x: 0, y: 0 };
        const center = object.center;
        if (center?.x !== undefined && center?.y !== undefined) {
            return { x: center.x, y: center.y };
        }
        const doc = object.document ?? object;
        const objX = object.x ?? doc.x ?? 0;
        const objY = object.y ?? doc.y ?? 0;
        return { x: objX, y: objY };
    }

    /**
     * Unified tile offset resolver for Foundry V14+.
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
    /*  Template Position Extraction (V14+ Regions) */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a Region or MeasuredTemplate document.
     *
     * @param {Document|PlaceableObject} template The Region or MeasuredTemplate document or placeable
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    getTemplatePosition(template, config = {}) {
        if (!template) return [];

        const doc = template.document ?? template;
        const isRegion = doc.documentName === 'Region' || Boolean(doc.shapes) || Boolean(template.shapes);

        if (isRegion) {
            const shapes = doc.shapes?.contents ?? doc.shapes ?? template.shapes ?? [];
            const shape = shapes[0] ?? doc.toObject?.()?.shapes?.[0] ?? null;

            const primary = {
                x: shape?.x ?? doc.x ?? template.x ?? 0,
                y: shape?.y ?? doc.y ?? template.y ?? 0
            };
            const center = {
                x: shape?.center?.x ?? doc.center?.x ?? template.center?.x ?? primary.x,
                y: shape?.center?.y ?? doc.center?.y ?? template.center?.y ?? primary.y
            };

            const distance = shape?.radius ?? shape?.distance ?? 0;
            let secondary;

            if (shape?.rotation !== undefined && distance > 0) {
                const rad = (shape.rotation * Math.PI) / 180;
                secondary = {
                    x: primary.x + Math.cos(rad) * distance,
                    y: primary.y + Math.sin(rad) * distance
                };
            } else {
                secondary = { x: primary.x, y: primary.y };
            }

            return [primary, secondary, center];
        }

        return super.getTemplatePosition(template, config);
    }

    /* -------------------------------------------- */
    /*  Scene & Level Background (V14+ Levels)      */
    /* -------------------------------------------- */

    /**
     * Resolves the texture image filepath from a V14 background or texture structure.
     * In V14, texture objects wrap the source string inside a TextureConfiguration object:
     * e.g. entry.src = { src: string|null, color, tint, alphaThreshold, ... }
     * @param {*} target The background or texture container
     * @returns {string|null}
     * @private
     */
    _extractTextureSource(target) {
        if (!target) return null;
        if (typeof target === 'string') return target;
        if (typeof target.src === 'string') return target.src;
        if (target.src && typeof target.src === 'object') {
            if (typeof target.src.src === 'string') return target.src.src;
            return null;
        }
        return null;
    }

    /**
     * Retrieve the background image source and offset for a scene on modern V14+ Foundry.
     * Evaluates active level textures or scene environment background.
     * Avoids accessing deprecated Scene#background.
     *
     * @param {Scene} [scene=canvas.scene] Target scene document
     * @param {Level|null} [level=null] Target level document or placeable (defaults to active level)
     * @returns {{ src: string|null, offsetX: number, offsetY: number }}
     */
    getSceneBackground(scene = canvas?.scene, level = null) {
        if (!scene) return { src: null, offsetX: 0, offsetY: 0 };

        const activeLevel = level
            ?? canvas?.level
            ?? scene.levels?.get?.(scene.activeLevel)
            ?? scene.levels?.contents?.[0]
            ?? scene.levels?.[0]
            ?? null;

        if (activeLevel) {
            const levelBg = activeLevel.background ?? activeLevel.textures?.background ?? activeLevel.texture ?? null;
            if (levelBg) {
                const src = this._extractTextureSource(levelBg);
                const offsetX = Number(levelBg.offsetX ?? activeLevel.offsetX ?? 0);
                const offsetY = Number(levelBg.offsetY ?? activeLevel.offsetY ?? 0);
                return { src, offsetX, offsetY };
            }
        }

        const envBg = scene.environment?.background ?? null;
        if (envBg) {
            const src = this._extractTextureSource(envBg);
            return {
                src,
                offsetX: Number(envBg.offsetX ?? 0),
                offsetY: Number(envBg.offsetY ?? 0)
            };
        }

        // Unmigrated legacy fallback if levels are not present
        const rawBg = scene.background;
        const src = this._extractTextureSource(rawBg);
        return {
            src,
            offsetX: Number(rawBg?.offsetX ?? 0),
            offsetY: Number(rawBg?.offsetY ?? 0)
        };
    }

    /**
     * Format a document update payload to delete/remove a specific property key.
     * In Foundry V14+, formats using foundry.data.operators.ForcedDeletion.
     *
     * @param {string} path Dot-delimited parent property path (e.g. "flags.eskie-macros.token-masks")
     * @param {string} keyId The property key to delete
     * @returns {Record<string, *>} Update dictionary
     */
    formatDeletionUpdate(path, keyId) {
        const fullKey = path ? `${path}.${keyId}` : keyId;
        const operator = foundry.data?.operators?.ForcedDeletion;
        return { [fullKey]: operator };
    }
}

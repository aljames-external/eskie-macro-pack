import { FoundryV13Adapter } from './foundry-v13-adapter.js';
import { MODULE_ID } from '../../lib/constants.js';

/**
 * Modern Foundry VTT platform adapter (Foundry V14+).
 * Extends FoundryV13Adapter and overrides centered tile anchor offsets, Region geometry calculations,
 * Level/Environment background extraction, and ForcedDeletion operators.
 */
export class FoundryV14Adapter extends FoundryV13Adapter {
    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math (V14+)        */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset for Foundry V14+ (centered anchor (0.5, 0.5)).
     * Centered origin matches token center directly.
     *
     * @param {PlaceableObject} object Token or Tile placeable
     * @param {number} [_scale=1] Additional scale multiplier (unused in V14 centered origin)
     * @returns {{x: number, y: number}} Offset coordinates
     */
    override getRevealOffset(object: any, _scale = 1) {
        if (!object) return { x: 0, y: 0 };
        return object.center ?? { x: object.x, y: object.y };
    }

    /**
     * Calculate shape tile placement offset for Foundry V14+ (centered anchor (0.5, 0.5)).
     *
     * @param {PlaceableObject} object Token or Tile placeable
     * @returns {{x: number, y: number}} Offset coordinates
     */
    override getShapeOffset(object: any) {
        if (!object) return { x: 0, y: 0 };
        return object.center ?? { x: object.x, y: object.y };
    }

    /**
     * Calculate bounding box and center for a Tile on Foundry V14+.
     * Evaluates V14 tile anchor configuration (defaulting to centered (0.5, 0.5)).
     * @override
     * @param {Tile} tile Target tile placeable
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number, center: {x: number, y: number}, width: number, height: number, anchor: {x: number, y: number} }}
     */
    override getTileBounds(tile: any) {
        if (!tile) return { minX: 0, maxX: 0, minY: 0, maxY: 0, center: { x: 0, y: 0 }, width: 0, height: 0, anchor: { x: 0.5, y: 0.5 } };
        const doc = tile.document;
        const x = doc.x ?? 0;
        const y = doc.y ?? 0;
        const width = doc.width ?? 0;
        const height = doc.height ?? 0;

        const anchorX = doc.anchor?.x ?? tile.anchor?.x ?? doc.texture?.anchorX ?? 0.5;
        const anchorY = doc.anchor?.y ?? tile.anchor?.y ?? doc.texture?.anchorY ?? 0.5;

        const minX = x - (anchorX * width);
        const maxX = minX + width;
        const minY = y - (anchorY * height);
        const maxY = minY + height;
        const center = { x: minX + width / 2, y: minY + height / 2 };

        return {
            minX,
            maxX,
            minY,
            maxY,
            center,
            width,
            height,
            anchor: { x: anchorX, y: anchorY }
        };
    }

    /* -------------------------------------------- */
    /*  Template Position Extraction (V14+ Regions) */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a Region or MeasuredTemplate document.
     *
     * @param {Region|MeasuredTemplate} template The Region or MeasuredTemplate placeable or document
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    override getTemplatePosition(template: any, config: any = {}): any {
        if (!template) return [];

        const doc = template.document ? template.document : template;
        const isRegion = doc?.documentName === 'Region' || Boolean(doc?.shapes) || Boolean(template.shapes);

        if (isRegion) {
            const shapes = doc.shapes?.contents ?? doc.shapes ?? template.shapes ?? [];
            const shape = shapes[0] ?? doc.toObject?.()?.shapes?.[0] ?? null;

            let primary = {
                x: shape?.x ?? doc.x ?? template.x ?? 0,
                y: shape?.y ?? doc.y ?? template.y ?? 0
            };
            const center = {
                x: shape?.center?.x ?? doc.center?.x ?? template.center?.x ?? primary.x,
                y: shape?.center?.y ?? doc.center?.y ?? template.center?.y ?? primary.y
            };

            const { size: gridSize, distance: gridDistance } = this.getSceneDimensions(canvas?.scene);

            // Grid distance (feet) converted to canvas pixels when provided
            const gridUnits = (config as any).distance ?? doc.distance ?? shape?.distance;
            const distancePx = gridUnits !== undefined && gridUnits > 0
                ? (gridUnits / gridDistance) * gridSize
                : (shape?.radius ?? shape?.height ?? shape?.width ?? 0);

            const rotation = shape?.rotation ?? doc.rotation ?? (config as any).direction ?? 0;
            const rad = (rotation * Math.PI) / 180;

            let secondary;
            if (distancePx > 0) {
                secondary = { x: primary.x + Math.cos(rad) * distancePx, y: primary.y + Math.sin(rad) * distancePx };
            } else {
                const token = (config as any).token ?? (config as any).sourceToken;
                const tokenCenter = token ? this.getCenter(token) : null;
                if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
                    secondary = primary;
                    primary = { x: tokenCenter.x, y: tokenCenter.y };
                }
            }

            return this.resolveDistinctPositions([primary, secondary, center], config, template);
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
    _extractTextureSource(target: any): string | null {
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
    override getSceneBackground(scene: any = canvas?.scene, level: any = null): any {
        if (!scene) return { src: null, offsetX: 0, offsetY: 0 };

        const activeLevel: any = level
            ?? (canvas as any)?.level
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

        const envBg = (scene as any).environment?.background ?? null;
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
    override formatDeletionUpdate(path: string, keyId: string): Record<string, any> {
        const fullKey = path ? `${path}.${keyId}` : keyId;
        const operator = (foundry.data as any)?.operators?.ForcedDeletion;
        return { [fullKey]: operator };
    }

    /* -------------------------------------------- */
    /*  Region & Region Behavior Operations (V14+)  */
    /* -------------------------------------------- */

    /**
     * Whether the active Foundry platform version supports native RegionBehaviors (V14+).
     * @override
     * @type {boolean}
     */
    override get supportsRegionBehaviors() {
        return true;
    }

    /**
     * Retrieve currently controlled Region documents or placeables on Foundry V14+.
     * @override
     * @returns {RegionDocument[]}
     */
    override getControlledRegions(): any[] {
        const controlled = (canvas as any)?.regions?.controlled ?? [];
        return controlled.map((r: any) => r.document);
    }

    /**
     * Calculate bounding box and center for a Region on Foundry V14+.
     * Handles arbitrary non-square geometries (polygons, circles, ellipses, rectangles, and compound shapes).
     * @override
     * @param {Region|RegionDocument} region Target Region placeable or document
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number, center: {x: number, y: number}, width: number, height: number, anchor: {x: number, y: number} }}
     */
    override getRegionBounds(region: any): any {
        if (!region) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, center: { x: 0, y: 0 }, width: 0, height: 0, anchor: { x: 0.5, y: 0.5 } };
        }

        const doc = region.document ? region.document : region;
        const placeable = region.document ? region : (region.object ? region.object : region);

        // Authoritative PIXI.Rectangle bounding box computed by Foundry canvas
        const bounds = placeable.bounds ?? doc.bounds;
        if (bounds && (bounds.width > 0 || bounds.height > 0 || bounds.right !== undefined)) {
            const minX = bounds.x ?? bounds.left ?? 0;
            const minY = bounds.y ?? bounds.top ?? 0;
            const width = bounds.width ?? ((bounds.right !== undefined) ? (bounds.right - minX) : 0);
            const height = bounds.height ?? ((bounds.bottom !== undefined) ? (bounds.bottom - minY) : 0);
            const maxX = minX + width;
            const maxY = minY + height;
            const center = placeable.center ?? doc.center ?? { x: minX + width / 2, y: minY + height / 2 };
            return { minX, maxX, minY, maxY, center, width, height, anchor: { x: 0.5, y: 0.5 } };
        }

        // Fallback: Compute bounding box from all Region shapes (polygons, circles, ellipses, rectangles)
        const shapes = doc.shapes?.contents ?? doc.shapes ?? placeable.shapes ?? [];
        const shapeList = Array.isArray(shapes) ? shapes : (shapes.values ? Array.from(shapes.values()) : []);

        if (shapeList.length > 0) {
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            for (const shape of shapeList) {
                if (shape.hole) continue;
                const type = shape.type;

                if (type === 'polygon' || Array.isArray(shape.points)) {
                    const points = shape.points ?? [];
                    if (points.length > 0) {
                        if (typeof points[0] === 'number') {
                            for (let i = 0; i < points.length; i += 2) {
                                const px = points[i];
                                const py = points[i + 1];
                                if (px < minX) minX = px;
                                if (px > maxX) maxX = px;
                                if (py < minY) minY = py;
                                if (py > maxY) maxY = py;
                            }
                        } else {
                            for (const pt of points) {
                                if (!pt) continue;
                                const px = pt.x ?? 0;
                                const py = pt.y ?? 0;
                                if (px < minX) minX = px;
                                if (px > maxX) maxX = px;
                                if (py < minY) minY = py;
                                if (py > maxY) maxY = py;
                            }
                        }
                    }
                } else if (type === 'circle' || (shape.radius !== undefined && shape.width === undefined)) {
                    const cx = shape.x ?? 0;
                    const cy = shape.y ?? 0;
                    const r = shape.radius ?? 0;
                    minX = Math.min(minX, cx - r);
                    maxX = Math.max(maxX, cx + r);
                    minY = Math.min(minY, cy - r);
                    maxY = Math.max(maxY, cy + r);
                } else if (type === 'ellipse' || shape.radiusX !== undefined) {
                    const cx = shape.x ?? 0;
                    const cy = shape.y ?? 0;
                    const rx = shape.radiusX ?? shape.radius ?? 0;
                    const ry = shape.radiusY ?? shape.radius ?? 0;
                    minX = Math.min(minX, cx - rx);
                    maxX = Math.max(maxX, cx + rx);
                    minY = Math.min(minY, cy - ry);
                    maxY = Math.max(maxY, cy + ry);
                } else {
                    const sx = shape.x ?? 0;
                    const sy = shape.y ?? 0;
                    const sw = shape.width ?? 0;
                    const sh = shape.height ?? 0;
                    minX = Math.min(minX, sx);
                    maxX = Math.max(maxX, sx + sw);
                    minY = Math.min(minY, sy);
                    maxY = Math.max(maxY, sy + sh);
                }
            }

            if (minX !== Infinity && maxX !== -Infinity && minY !== Infinity && maxY !== -Infinity) {
                const width = maxX - minX;
                const height = maxY - minY;
                const center = { x: minX + width / 2, y: minY + height / 2 };
                return { minX, maxX, minY, maxY, center, width, height, anchor: { x: 0.5, y: 0.5 } };
            }
        }

        const center = placeable.center ?? doc.center;
        if (center && typeof center.x === 'number' && typeof center.y === 'number') {
            return {
                minX: center.x,
                maxX: center.x,
                minY: center.y,
                maxY: center.y,
                center: { x: center.x, y: center.y },
                width: 0,
                height: 0,
                anchor: { x: 0.5, y: 0.5 }
            };
        }

        const fallbackX = typeof doc.x === 'number' ? doc.x : (typeof placeable.x === 'number' && placeable.x !== 0 ? placeable.x : 0);
        const fallbackY = typeof doc.y === 'number' ? doc.y : (typeof placeable.y === 'number' && placeable.y !== 0 ? placeable.y : 0);
        return {
            minX: fallbackX,
            maxX: fallbackX,
            minY: fallbackY,
            maxY: fallbackY,
            center: { x: fallbackX, y: fallbackY },
            width: 0,
            height: 0,
            anchor: { x: 0.5, y: 0.5 }
        };
    }

    /**
     * Retrieve all tokens contained within or overlapping a Region on Foundry V14+.
     * Resolves token placeables directly from the RegionDocument's tokens collection.
     * @override
     * @param {Region|RegionDocument} region Target Region placeable or document
     * @returns {Token[]}
     */
    override getTokensInRegion(region: any): any[] {
        if (!region) return [];
        const doc = region.document ? region.document : region;
        const tokens = doc.tokens ?? region.tokens ?? [];
        return Array.from(tokens, (t: any) => (t.object ? t.object : t)).filter(Boolean);
    }

    /**
     * Create an embedded RegionBehavior on a RegionDocument in Foundry V14+.
     * @override
     * @param {Region|RegionDocument} region Target Region placeable or document
     * @param {object} behaviorData Formatted behavior configuration data
     * @returns {Promise<RegionBehavior|null>}
     */
    override async createRegionBehavior(region: any, behaviorData: any): Promise<any> {
        if (!region) return null;
        const doc = region.document ? region.document : region;
        if (!doc.createEmbeddedDocuments) return null;
        const [created] = await doc.createEmbeddedDocuments('RegionBehavior', [behaviorData]);
        return created ?? null;
    }

    /**
     * Format a RegionBehavior data payload for Foundry V14+ executeScript behaviors.
     * Conforms strictly to ExecuteScriptRegionBehaviorType schema.
     * @override
     * @param {object} config Behavior creation options
     * @param {string} config.name Display name of the behavior
     * @param {string|string[]} [config.events=['tokenEnter']] Triggering event names
     * @param {string} config.source Script source code
     * @param {boolean} [config.disabled=false] Initial disabled state
     * @param {object} [config.flags={}] Custom flags
     * @returns {object} Formatted RegionBehavior creation payload
     */
    override formatRegionBehaviorData({ name, events = ['tokenEnter'], source, disabled = false, flags = {} }: any): any {
        return {
            name,
            type: 'executeScript',
            system: {
                events: Array.isArray(events) ? events : [events],
                source,
            },
            disabled: Boolean(disabled),
            flags,
        };
    }

    /**
     * Resolve a PlaceableObject by its unique identifier across primary canvas layers (including regions).
     * @override
     * @param {string} id Target placeable ID
     * @returns {PlaceableObject|null}
     */
    override getPlaceable(id: string): any {
        if (!id) return null;
        return super.getPlaceable(id)
            ?? (canvas as any)?.regions?.get?.(id)
            ?? (canvas as any)?.scene?.regions?.get?.(id)?.object
            ?? (canvas as any)?.scene?.regions?.get?.(id)
            ?? null;
    }

    /**
     * Extract the active image texture filepath from a placeable or document on Foundry V14+.
     * If placeable is a Region, evaluates linked tile flags if present.
     * @override
     * @param {PlaceableObject|Document|null} placeable Target placeable or document
     * @returns {string|null}
     */
    override getPlaceableTexture(placeable: any): string | null {
        if (!placeable) return null;
        const directTexture = super.getPlaceableTexture(placeable);
        if (directTexture) return directTexture;

        const doc = placeable.document ? placeable.document : placeable;
        const isRegion = doc.documentName === 'Region' || placeable.documentName === 'Region' || Boolean(doc.shapes) || Boolean(placeable.shapes);
        if (isRegion) {
            const tileId = doc.getFlag?.(MODULE_ID, 'trap.tileId')
                ?? doc.flags?.[MODULE_ID]?.trap?.tileId
                ?? doc.getFlag?.(MODULE_ID, 'trap.tileIds')?.[0]
                ?? doc.flags?.[MODULE_ID]?.trap?.tileIds?.[0];
            if (tileId) {
                const linkedTile = canvas?.tiles?.get?.(tileId);
                if (linkedTile) return super.getPlaceableTexture(linkedTile);
            }
        }
        return null;
    }
}

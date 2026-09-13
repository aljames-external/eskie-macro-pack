import { BaseFoundryAdapter } from './base-foundry-adapter.js';

/**
 * Foundry VTT V12 platform baseline adapter.
 * Extends BaseFoundryAdapter and provides global constructors, legacy UUID resolution,
 * singular combatant lookup, top-left tile math, and -= deletion syntax for Foundry V12.
 */
export class FoundryV12Adapter extends BaseFoundryAdapter {
    /**
     * The active ContextMenu constructor in v12.
     */
    override get ContextMenu(): any {
        return ContextMenu;
    }

    /**
     * The active KeyboardManager constructor in v12.
     */
    override get KeyboardManager(): any {
        return KeyboardManager;
    }

    /**
     * The active Token placeable constructor in v12.
     */
    override get Token(): any {
        return Token;
    }

    /**
     * The active Tile placeable constructor in v12.
     */
    override get Tile(): any {
        return Tile;
    }

    /**
     * The active FilePicker constructor / implementation in v12.
     */
    override get FilePicker(): any {
        return FilePicker;
    }

    /**
     * The active TextEditor constructor / implementation in v12.
     */
    override get TextEditor(): any {
        return TextEditor;
    }

    /**
     * Safely resolve a document from UUID synchronously in Foundry V12.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    override fromUuidSync(uuid: string, options: any = {}): any {
        return fromUuidSync(uuid, options);
    }

    /**
     * Safely resolve a document from UUID asynchronously in Foundry V12.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    override async fromUuid(uuid: string, options: any = {}): Promise<any> {
        return fromUuid(uuid, options);
    }

    /**
     * Retrieve all combatants associated with a token in combat using legacy V12 Combat#getCombatantByToken.
     * @param {Combat} combat Target combat encounter
     * @param {Token} token Target Token placeable
     * @returns {Combatant[]}
     */
    override getCombatantsByToken(combat: Combat, token: Token): Combatant[] {
        if (!combat || !token?.id) return [];
        const single = (combat as any).getCombatantByToken(token.id);
        return single ? [single] : [];
    }

    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math (V12)         */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset for Foundry V12 (legacy top-left anchor (0, 0)).
     * Compares token/tile size and scale to offset top-left origin.
     *
     * @param {PlaceableObject} object Token or Tile placeable
     * @param {number} [scale=1] Additional scale multiplier
     * @returns {{x: number, y: number}} Offset coordinates
     */
    override getRevealOffset(object: any, scale = 1) {
        if (!object) return { x: 0, y: 0 };
        const doc = object.document;
        const isToken = this.isDocumentOfType(object, 'Token');
        const widthAdjustment = isToken ? this.getGridSize() : 1;
        const scaleXY = doc.texture?.scaleX ?? 1;
        const totalScale = scaleXY * scale;
        const objX = object.x;
        const objY = object.y;
        const docWidth = doc.width ?? 1;
        const docHeight = doc.height ?? 1;

        return {
            x: objX - (widthAdjustment * docWidth * (totalScale - 1) / 2),
            y: objY - (widthAdjustment * docHeight * (totalScale - 1) / 2)
        };
    }

    /**
     * Calculate shape tile placement offset for Foundry V12 (legacy top-left anchor (0, 0)).
     *
     * @param {PlaceableObject} object Token or Tile placeable
     * @returns {{x: number, y: number}} Offset coordinates
     */
    override getShapeOffset(object: any) {
        if (!object) return { x: 0, y: 0 };
        return {
            x: object.x,
            y: object.y
        };
    }

    /* -------------------------------------------- */
    /*  Template Position Extraction (V12)          */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a legacy MeasuredTemplate document or placeable.
     *
     * @param {MeasuredTemplate} template The MeasuredTemplate placeable or document
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    override getTemplatePosition(template: any, config: any = {}): any {
        if (!template || typeof template !== 'object') return [];

        const doc = template.document ? template.document : template;
        const placeable = template.object ? template.object : (template.document ? template : null);

        const isTile = this.isDocumentOfType(template, 'Tile') || doc?.documentName === 'Tile' || Boolean(doc?.texture && !doc?.shapes);
        if (isTile) {
            const center = this.getCenter(template);
            const token = config.token ?? config.sourceToken;
            const tokenCenter = token ? this.getCenter(token) : null;
            let primary = tokenCenter ?? { x: doc.x ?? 0, y: doc.y ?? 0 };
            let secondary = center;
            if (tokenCenter && Math.hypot(secondary.x - primary.x, secondary.y - primary.y) < 1) {
                secondary = { x: primary.x + this.getGridSize(), y: primary.y };
            }
            return this.resolveDistinctPositions([primary, secondary, center], config, template);
        }

        const farpoint = placeable?.ray?.B ?? doc?.ray?.B ?? template.ray?.B;

        let primary = {
            x: doc.x ?? placeable?.x ?? 0,
            y: doc.y ?? placeable?.y ?? 0
        };

        const distance = (doc.distance !== undefined && doc.distance > 0)
            ? doc.distance
            : ((placeable?.distance !== undefined && placeable.distance > 0) ? placeable.distance : (config.distance ?? 0));
        const direction = doc.direction ?? placeable?.direction ?? config.direction ?? 0;
        const { size: gridSize, distance: gridDistance } = this.getSceneDimensions(canvas?.scene);
        const distancePx = (distance / gridDistance) * gridSize;
        const rad = (direction * Math.PI) / 180;

        let secondary;
        if (farpoint && (farpoint.x !== primary.x || farpoint.y !== primary.y)) {
            secondary = { x: farpoint.x, y: farpoint.y };
        } else if (distancePx > 0) {
            secondary = {
                x: primary.x + Math.cos(rad) * distancePx,
                y: primary.y + Math.sin(rad) * distancePx
            };
        } else {
            const token = config.token ?? config.sourceToken;
            const tokenCenter = token ? this.getCenter(token) : null;
            if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
                secondary = primary;
                primary = { x: tokenCenter.x, y: tokenCenter.y };
            }
        }

        const width = doc.width ?? placeable?.width ?? 0;
        const height = Math.sqrt(Math.max(0, distance * distance - width * width));

        const center = {
            x: primary.x + (width / 2) * (gridSize / gridDistance),
            y: primary.y + (height / 2) * (gridSize / gridDistance)
        };

        return [primary, secondary, center];
    }

    /* -------------------------------------------- */
    /*  Scene Background (V12)                      */
    /* -------------------------------------------- */

    /**
     * Retrieve the background texture and offsets for a scene on Foundry V12 (Scene#background).
     * @param {Scene} [scene=canvas.scene] Target scene document
     * @param {Level|null} [_level=null] Unused in V12
     * @returns {{ src: string|null, offsetX: number, offsetY: number }}
     */
    override getSceneBackground(scene: any = canvas?.scene, _level: any = null): any {
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
    /*  Document Deletion Format (V12)              */
    /* -------------------------------------------- */

    /**
     * Format a document update payload to delete/remove a specific property key.
     * In Foundry V12, formats using legacy "-=<keyId>" deletion syntax.
     *
     * @param {string} path Dot-delimited parent property path (e.g. "flags.eskie-macros.token-masks")
     * @param {string} keyId The property key to delete
     * @returns {Record<string, *>} Update dictionary
     */
    override formatDeletionUpdate(path: string, keyId: string): Record<string, any> {
        const fullKey = path ? `${path}.-=${keyId}` : `-=${keyId}`;
        return { [fullKey]: null };
    }

    /**
     * Preload Handlebars templates in Foundry V12 using global loadTemplates.
     * @override
     * @param {string[]} paths Array of template paths
     * @returns {Promise<Function[]>}
     */
    override async loadTemplates(paths: string[]): Promise<Function[]> {
        return loadTemplates(paths);
    }
}

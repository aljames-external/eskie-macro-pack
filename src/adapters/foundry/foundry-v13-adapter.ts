import { FoundryV12Adapter } from './foundry-v12-adapter.js';

/**
 * Foundry VTT V13 platform adapter.
 * Extends FoundryV12Adapter and encapsulates capabilities and API changes introduced in Foundry V13,
 * including namespaced constructors, modern UUID resolution, and plural combatant lookup.
 */
export class FoundryV13Adapter extends FoundryV12Adapter {
    /**
     * The active ContextMenu constructor in v13+.
     */
    override get ContextMenu(): any {
        return foundry.applications.ux.ContextMenu.implementation;
    }

    /**
     * The active KeyboardManager constructor in v13+.
     */
    override get KeyboardManager(): any {
        return (foundry.helpers as any)?.interaction?.KeyboardManager?.implementation ?? KeyboardManager;
    }

    /**
     * The active Token placeable constructor in v13+.
     */
    override get Token(): any {
        return foundry.canvas.placeables.Token.implementation;
    }

    /**
     * The active Tile placeable constructor in v13+.
     */
    override get Tile(): any {
        return foundry.canvas.placeables.Tile.implementation;
    }

    /**
     * The active FilePicker constructor / implementation in v13+.
     */
    override get FilePicker(): any {
        return foundry.applications.apps.FilePicker.implementation;
    }

    /**
     * The active TextEditor constructor / implementation in v13+.
     */
    override get TextEditor(): any {
        return foundry.applications.ux.TextEditor.implementation;
    }

    /**
     * Safely resolve a document from UUID synchronously using standard V13+ foundry.utils.fromUuidSync.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    override fromUuidSync(uuid: string, options: any = {}): any {
        return foundry.utils.fromUuidSync(uuid, options);
    }

    /**
     * Safely resolve a document from UUID asynchronously using standard V13+ foundry.utils.fromUuid.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    override async fromUuid(uuid: string, options: any = {}): Promise<any> {
        return foundry.utils.fromUuid(uuid, options);
    }

    /**
     * Retrieve all combatants associated with a token in combat using native V13+ Combat#getCombatantsByToken.
     * @param {Combat} combat Target combat encounter
     * @param {Token} token Target Token placeable
     * @returns {Combatant[]}
     */
    override getCombatantsByToken(combat: Combat, token: Token): Combatant[] {
        if (!combat || !token) return [];
        return (combat as any).getCombatantsByToken(token);
    }

    /**
     * Preload Handlebars templates in Foundry V13+ using namespaced foundry.applications.handlebars.loadTemplates.
     * @override
     * @param {string[]} paths Array of template paths
     * @returns {Promise<Function[]>}
     */
    override async loadTemplates(paths: string[]): Promise<Function[]> {
        return foundry.applications.handlebars.loadTemplates(paths);
    }

    /**
     * Test whether a 2D/3D point is contained within a placeable or document on Foundry V13+.
     * Leverages native RegionDocument#testPoint(point: ElevatedPoint) for exact polygonal containment.
     * Note: Region#testPoint was deprecated in Version 13 in favor of RegionDocument#testPoint.
     * @override
     * @param {PlaceableObject|Document|null} object Target placeable or document
     * @param {{ x: number, y: number, elevation?: number }} point Point coordinates
     * @returns {boolean}
     */
    override containsPoint(object: any, point: any): boolean {
        if (!object || !point) return false;
        const doc = object.document ? object.document : object;
        const isRegion = doc.documentName === 'Region' || Boolean(doc.shapes) || Boolean(object.shapes);
        if (isRegion) {
            const elevatedPoint = point.elevation !== undefined
                ? point
                : (typeof point.x === 'number' && typeof point.y === 'number' ? { ...point, elevation: 0 } : point);

            if (typeof doc.testPoint === 'function') {
                return Boolean(doc.testPoint(elevatedPoint));
            }

            const placeable = object.object ?? doc.object ?? object;
            if (typeof placeable?.testPoint === 'function') {
                return Boolean(placeable.testPoint(point, point.elevation));
            }
        }
        return super.containsPoint(object, point);
    }
}

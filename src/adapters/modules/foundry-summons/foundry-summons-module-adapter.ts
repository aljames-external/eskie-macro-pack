import { BaseModuleAdapter } from "../base-module-adapter.js";
import { log } from "../../../lib/logger.js";

export interface FoundrySummonsPickOptions {
    uuid?: string;
    actor?: Actor | string | null;
    location?: { x: number; y: number } | null;
    crosshairParameters?: Record<string, unknown>;
    crosshairCallbacks?: Record<string, unknown>;
    tokenData?: Record<string, unknown>;
    updates?: Record<string, unknown>;
    drawPing?: boolean;
    [key: string]: unknown;
}

/**
 * Foundry Summons (foundry-summons) Module Adapter.
 * Encapsulates summoning dialogs, actor resolution, and token placement via the Foundry Summons API.
 */
export class FoundrySummonsModuleAdapter extends BaseModuleAdapter {
    /**
     * @param {string} [moduleId='foundry-summons'] Unique module identifier
     */
    constructor(moduleId = 'foundry-summons') {
        super(moduleId);
    }

    /**
     * Access the active external foundrySummons library API instance.
     */
    get api(): any {
        if (!this.isActive()) return null;
        const modApi = game?.modules?.get(this.moduleId)?.api;
        if (modApi) return modApi;
        return (typeof foundrySummons !== 'undefined' ? foundrySummons : null);
    }

    /**
     * Whether the module is active and its API is available.
     * @returns {boolean}
     */
    isAvailable(): boolean {
        return this.isActive() && Boolean(this.api);
    }

    /**
     * Resolve actor UUID from an Actor instance, UUID string, or actor name.
     * @param {Actor | string | null} [actorOrNameOrUuid] Actor document, name, or UUID
     * @returns {string | null}
     */
    resolveActorUuid(actorOrNameOrUuid?: Actor | string | null): string | null {
        if (!actorOrNameOrUuid) return null;

        if (typeof actorOrNameOrUuid === 'string') {
            if (actorOrNameOrUuid.includes('.')) {
                return actorOrNameOrUuid;
            }
            const actorDoc = game?.actors?.getName?.(actorOrNameOrUuid);
            return actorDoc?.uuid ?? actorOrNameOrUuid;
        }

        const doc = actorOrNameOrUuid as Actor;
        return doc.uuid ?? null;
    }

    /**
     * Spawns a token onto the canvas at a specific location without interactive crosshairs.
     * @param {{ x: number; y: number }} location Canvas coordinates
     * @param {FoundrySummonsPickOptions} options Configuration options
     * @returns {Promise<Token | null>}
     */
    async spawnAtLocation(location: { x: number; y: number }, options: FoundrySummonsPickOptions = {}): Promise<Token | null> {
        if (!canvas.scene) return null;

        let actor: Actor | null = null;
        if (options.actor && typeof options.actor !== 'string' && 'getTokenDocument' in options.actor) {
            actor = options.actor as Actor;
        } else {
            const uuid = options.uuid ?? (typeof options.actor === 'string' ? options.actor : null);
            if (uuid) {
                actor = (game.actors?.get?.(uuid) ?? game.actors?.getName?.(uuid) ?? (typeof fromUuid !== 'undefined' ? await fromUuid(uuid) : null)) as Actor | null;
            }
        }

        if (!actor) {
            log.warn("FoundrySummonsModuleAdapter.spawnAtLocation | Could not resolve actor.");
            return null;
        }

        const tokenData: Record<string, unknown> = {
            ...(options.tokenData ?? options.updates ?? {}),
            x: location.x,
            y: location.y
        };

        const tokenDoc = await actor.getTokenDocument(tokenData);
        const [createdDoc] = await (canvas.scene as any).createEmbeddedDocuments('Token', [tokenDoc.toObject()]);
        return createdDoc.object as Token;
    }

    /**
     * Spawns or picks a token onto the canvas via Foundry Summons.
     * If a location is provided, places the token directly at that location.
     * @param {FoundrySummonsPickOptions} options Configuration options for foundrySummons.pick
     * @returns {Promise<Token | null>} The created Token placeable or null
     */
    async pick(options: FoundrySummonsPickOptions = {}): Promise<Token | null> {
        if (options.location) {
            return this.spawnAtLocation(options.location, options);
        }

        if (!this.isActive()) {
            log.warn("FoundrySummonsModuleAdapter.pick | Foundry Summons module is not active.");
            ui.notifications.warn("This macro requires the Foundry Summons module to be active.");
            return null;
        }

        const api = this.api;
        if (!api?.pick) {
            log.warn("FoundrySummonsModuleAdapter.pick | foundrySummons.pick API is unavailable.");
            ui.notifications.warn("Foundry Summons API is not accessible.");
            return null;
        }

        // Resolve UUID if actor was passed instead of uuid
        const pickOptions: Record<string, unknown> = { ...options };
        if (!pickOptions.uuid && options.actor) {
            const resolvedUuid = this.resolveActorUuid(options.actor);
            if (resolvedUuid) pickOptions.uuid = resolvedUuid;
        }
        delete pickOptions.actor;

        try {
            const result = await api.pick(pickOptions);
            if (!result) return null;

            // Handle array of tokens
            const rawToken = Array.isArray(result) ? result[0] : result;
            if (!rawToken) return null;

            // Normalize to Token placeable if TokenDocument was returned
            const tokenPlaceable = (rawToken.object ?? rawToken) as Token;
            return tokenPlaceable;
        } catch (err) {
            log.error("FoundrySummonsModuleAdapter.pick | Error executing summon:", err);
            return null;
        }
    }

    /**
     * Spawns a token onto the canvas via direct location placement or Foundry Summons.
     * @param {FoundrySummonsPickOptions} options Configuration options
     * @returns {Promise<Token | null>}
     */
    async spawn(options: FoundrySummonsPickOptions = {}): Promise<Token | null> {
        if (options.location) {
            return this.spawnAtLocation(options.location, options);
        }
        return this.pick(options);
    }

    /**
     * Opens the Foundry Summons menu.
     */
    openMenu(): void {
        const api = this.api;
        if (api?.SummonMenu?.start) {
            api.SummonMenu.start();
        } else {
            log.warn("FoundrySummonsModuleAdapter.openMenu | SummonMenu is unavailable.");
        }
    }
}

import { adapter } from '../../adapters/index.js';
import { matt } from '../utils/matt-tiles.js';
import { MODULE_ID } from '../../lib/constants.js';
import { log, notify } from '../../lib/logger.js';
import { localize, format } from '../../lib/utils.js';

/**
 * Configure and register a trap using Foundry V14+ Regions.
 * Supports linking Regions as triggers and Tiles as visual animation placeables.
 *
 * @param {string} animation Global animation path (e.g. 'eskie.traps.pitfall')
 * @param {object} [config={}] Setup configuration options
 * @returns {Promise<{ triggerRegions: RegionDocument[], originElements: PlaceableObject[], targetElements: PlaceableObject[] }|void>}
 */
export async function setupRegionTrap(animation: string, config: Record<string, any> = {}): Promise<{ triggerRegions: any[], originElements: any[], targetElements: any[] } | void> {
    if (!game.user?.isGM) {
        return notify.error(localize('EMP.traps.setup.onlyGm'));
    }

    const pathParts = animation.split('.');
    const trapKey = pathParts[pathParts.length - 1];
    const isEskieTrap = animation.startsWith('eskie.traps.');
    const tileCount = config.tileCount ?? (isEskieTrap ? 2 : 3);

    // Step 1: Prompt user to select trigger regions
    const step1Title = localize(
        `EMP.traps.${trapKey}.step1Title`,
        format('EMP.traps.setup.step1RegionTitle', { name: trapKey })
    );
    const step1Content = localize(
        `EMP.traps.${trapKey}.step1Content`,
        localize('EMP.traps.setup.step1RegionContent')
    );

    const triggerResult = await adapter.buttonDialog({
        title: step1Title,
        buttons: [
            { label: localize('EMP.traps.common.continue'), value: 'continue' },
            { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
        ],
    }, {
        content: step1Content
    });

    if (triggerResult !== 'continue') return;

    const triggerRegions = adapter.getControlledRegions();
    if (triggerRegions.length === 0) {
        return notify.warn(localize('EMP.traps.setup.noTriggerRegions'));
    }

    let originElements: any[] = [];
    let targetElements: any[] = [];

    if (tileCount === 1) {
        // Pure single-region trap (e.g. Electric Door): Trigger region IS the animation region
        originElements = triggerRegions;
    } else if (tileCount === 3) {
        // Step 2: Prompt user to select trap origin/launcher placeables (Tile or Region)
        const originTitle = localize(
            `EMP.traps.${trapKey}.step2Title`,
            format('EMP.traps.setup.step2OriginRegionTitle', { name: trapKey })
        );
        const originContent = localize(
            `EMP.traps.${trapKey}.step2Content`,
            localize('EMP.traps.setup.step2OriginRegionContent')
        );

        const originResult = await adapter.buttonDialog({
            title: originTitle,
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: originContent
        });

        if (originResult !== 'continue') return;

        const controlledTiles = canvas.tiles.controlled.map(t => t.document);
        const controlledRegions = adapter.getControlledRegions();

        // Enforce Tile requirement when mandatory (e.g. Bull Rush Statue)
        const requiresTile = Boolean(config.requiresTile || trapKey === 'bullRushStatue');
        if (requiresTile && controlledTiles.length === 0) {
            const warningMsg = localize(
                `EMP.traps.${trapKey}.noTile`,
                localize('EMP.traps.setup.noOriginTiles')
            );
            return notify.warn(warningMsg);
        }

        originElements = controlledTiles.length > 0 ? controlledTiles : controlledRegions;

        if (originElements.length === 0) {
            return notify.warn(localize('EMP.traps.setup.noOriginTiles'));
        }

        // Step 3: Prompt user to select trap target/landing placeables (Tile or Region)
        const targetTitle = localize(
            `EMP.traps.${trapKey}.step3Title`,
            format('EMP.traps.setup.step3TargetRegionTitle', { name: trapKey })
        );
        const targetContent = localize(
            `EMP.traps.${trapKey}.step3Content`,
            localize('EMP.traps.setup.step3TargetRegionContent')
        );

        const targetResult = await adapter.buttonDialog({
            title: targetTitle,
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: targetContent
        });

        if (targetResult === 'cancel' || targetResult === false) return;

        const targetTiles = canvas.tiles.controlled.map(t => t.document);
        const targetRegions = adapter.getControlledRegions();
        targetElements = targetTiles.length > 0 ? targetTiles : targetRegions;

        if (targetElements.length === 0) {
            notify.warn(localize('EMP.traps.setup.noTargetTiles'));
            targetElements = triggerRegions;
        }
    } else {
        // Step 2: Prompt user to select trap animation placeables (Tile or Region)
        const animTitle = localize(
            `EMP.traps.${trapKey}.step2Title`,
            format('EMP.traps.setup.step2AnimRegionTitle', { name: trapKey })
        );
        const animContent = localize(
            `EMP.traps.${trapKey}.step2Content`,
            localize('EMP.traps.setup.step2AnimRegionContent')
        );

        const animResult = await adapter.buttonDialog({
            title: animTitle,
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: animContent
        });

        if (animResult !== 'continue') return;

        const controlledTiles = canvas.tiles.controlled.map(t => t.document);
        const controlledRegions = adapter.getControlledRegions();

        // Enforce Tile requirement when mandatory (e.g. Flooding Room)
        const requiresTile = Boolean(config.requiresTile || trapKey === 'floodingRoom');
        if (requiresTile && controlledTiles.length === 0) {
            const warningMsg = localize(
                `EMP.traps.${trapKey}.noTile`,
                `${trapKey} requires a Tile placeable on the canvas. Trap setup cancelled.`
            );
            return notify.warn(warningMsg);
        }

        originElements = controlledTiles.length > 0 ? controlledTiles : (controlledRegions.length > 0 ? controlledRegions : triggerRegions);
    }

    const extraResults: Record<string, any> = {};
    if (config.extraTiles) {
        for (const extra of config.extraTiles) {
            const extraResult = await adapter.buttonDialog({
                title: format('EMP.traps.setup.extraTitle', { name: extra.label }),
                buttons: [
                    { label: localize('EMP.traps.common.continue'), value: 'continue' },
                    { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
                ],
            }, {
                content: `<p>${extra.prompt}</p><p>Click <strong>Continue</strong> once selected.</p>`
            });

            if (extraResult !== 'continue') return;

            const selectedTiles = canvas.tiles.controlled.map(t => t.id);
            const selectedRegions = adapter.getControlledRegions().map(r => r.id);
            const selected = selectedTiles.length > 0 ? selectedTiles : selectedRegions;

            if (selected.length === 0) {
                return notify.warn(format('EMP.traps.setup.noExtraTiles', { name: extra.label }));
            }
            extraResults[extra.key] = selected;
        }
    }

    const { tileCount: _tc, extraFlags: _ef, extraTiles: _et, trigger: _tr, controlled: _co, playPath: _pp, mode: _md, events: _ev, ...trapOptions } = config;

    const targetId = tileCount === 3 ? (targetElements[0]?.id ?? null) : null;
    const originIds = originElements.map(e => e.id);
    const tileIds = originElements.filter(e => adapter.isDocumentOfType(e, 'Tile')).map(e => e.id);

    const hasOptions = Object.keys(trapOptions).length > 0;
    const optionsStr = targetId
        ? (hasOptions ? `{ ...${JSON.stringify(trapOptions)}, targetLocation }` : '{ targetLocation }')
        : (hasOptions ? JSON.stringify(trapOptions) : '{}');

    const regionActionCode = `
// Resolve the unified adapter from Eskie Macro Pack
const adapter = game.modules.get('${MODULE_ID}').api.adapter;

// Activating token from Region trigger event
const token = event.data?.token?.object;
if (!token) return;
${targetId ? `
// Target placeable (Region or Tile) and coordinate location
const targetPlaceable = adapter.getPlaceable('${targetId}');
if (!targetPlaceable) return;
const targetLocation = adapter.getTargetLocation(targetPlaceable);
` : ''}
// Origin / launcher placeables (Regions or Tiles)
const animPlaceables = ${JSON.stringify(originIds)}.map(id => adapter.getPlaceable(id)).filter(Boolean);
if (animPlaceables.length === 0) return;

// Execute the trap animation for all launcher placeables simultaneously
const animPromises = animPlaceables.map(placeable => {
    const trapZone = ${targetId ? 'targetPlaceable ?? placeable' : 'placeable'};
    let targets = adapter.getTokensInPlaceable(trapZone);
    const isTarget = adapter.isTokenInOrMovingIntoPlaceable(token, trapZone, {
        triggerRegionId: event.region?.id,
        movement: event.data?.movement ?? (event.data?.segments ? { segments: event.data.segments } : null)
    });

    if (isTarget && token.id && !targets.some(t => t.id === token.id)) {
        targets.push(token);
    }

    ${isEskieTrap
        ? `return ${animation}.play(placeable, targets, ${optionsStr});`
        : `return adapter.executeTrapEffect('${animation}', placeable, ${targetId ? 'targetPlaceable' : 'null'}, targets, ${optionsStr});`
    }
});
${tileIds.length > 0 ? `
// Trigger any linked external MATT tiles concurrently
for (const id of ${JSON.stringify(tileIds)}) {
    if (id === event.region?.id) continue;
    const tile = canvas.tiles.get(id);
    if (tile?.document?.trigger) {
        animPromises.push(tile.document.trigger({ token }));
    }
}
` : ''}
await Promise.all(animPromises);`

    const behaviorName = `${trapKey.charAt(0).toUpperCase() + trapKey.slice(1)} Trap (${MODULE_ID})`;
    const events = config.events ?? ['tokenEnter'];

    for (const triggerRegion of triggerRegions) {
        const behaviorData = adapter.formatRegionBehaviorData({
            name: behaviorName,
            events,
            source: regionActionCode,
        });
        await adapter.createRegionBehavior(triggerRegion, behaviorData);
    }

    notify.info(`Successfully setup ${trapKey} trap using Regions for ${triggerRegions.length} trigger region(s) and ${originElements.length} placeable(s).`);
    return { triggerRegions, originElements, targetElements };
}

/**
 * Universal trap setup orchestrator.
 * Dynamically routes to native Foundry V14+ Regions or Monk's Active Tile Triggers (MATT).
 * On Foundry V14+, MATT is optional; if MATT is active, prompts the user to select the preferred trigger engine.
 *
 * @param {string} animation Global animation path (e.g. 'eskie.traps.pitfall')
 * @param {object} [config={}] Setup configuration options
 * @returns {Promise<object|void>}
 */
export async function setupTrap(animation: string, config: Record<string, any> = {}): Promise<any> {
    if (!game.user?.isGM) {
        return notify.error(localize('EMP.traps.setup.onlyGm'));
    }

    let mode = config.mode;
    const isV14 = adapter.generation >= 14;

    if (!mode) {
        if (!isV14) {
            mode = 'matt';
        } else {
            const hasMatt = Boolean(game.modules.get('monks-active-tiles')?.active);
            if (!hasMatt) {
                mode = 'region';
            } else {
                mode = await adapter.buttonDialog({
                    title: localize('EMP.traps.setup.modeDialogTitle'),
                    buttons: [
                        { label: localize('EMP.traps.setup.modeRegion'), value: 'region' },
                        { label: localize('EMP.traps.setup.modeMatt'), value: 'matt' },
                    ],
                }, {
                    content: localize('EMP.traps.setup.modeDialogContent'),
                });
                if (!mode) return;
            }
        }
    }

    if (mode === 'matt') {
        return matt.trap.setup(animation, config);
    }

    return setupRegionTrap(animation, config);
}

/**
 * Constructs a Token-compatible proxy object from a Tile, Region, or Document.
 * Stands in for a caster token in animation routines (e.g. template or targeted spells fired from traps).
 *
 * @param {PlaceableObject|Document|null} placeable Origin Tile, Region, or Token
 * @param {{ x: number, y: number }|null} [targetLocation=null] Optional destination coordinates to orient rotation towards
 * @returns {CasterProxy|Token|null}
 */
export function createCasterProxy(placeable: any, targetLocation: { x: number; y: number } | null = null): any {
    return adapter.createCasterProxy(placeable, targetLocation);
}

/**
 * Executes an animation effect as a trap.
 * Origin placeable stands in for the caster, firing towards the trap target placeable / target tokens.
 * Supports template effects (e.g. Fireball, Lightning Bolt), targeted effects (e.g. Disintegrate, Guiding Bolt),
 * and standard trap modules (e.g. Fire, Spike, Projectile).
 *
 * @param {string|object|Function} animation Global animation path (e.g. 'eskie.effect.fireball') or effect module
 * @param {PlaceableObject|Document|string} originPlaceable Origin Tile or Region placeable standing in for the caster
 * @param {PlaceableObject|Document|string|null} [targetPlaceable=null] Trap target Tile or Region landing zone
 * @param {Token[]} [targets=[]] Target tokens within or entering the trap placeable
 * @param {Record<string, any>} [config={}] Configuration options
 * @returns {Promise<any>}
 */
export async function executeTrapEffect(
    animation: any,
    originPlaceable: any,
    targetPlaceable: any = null,
    targets: Token[] = [],
    config: Record<string, any> = {}
): Promise<any> {
    const origin = typeof originPlaceable === 'string' ? adapter.getPlaceable(originPlaceable) : originPlaceable;
    const target = typeof targetPlaceable === 'string' ? adapter.getPlaceable(targetPlaceable) : targetPlaceable;

    if (!origin) {
        log.warn('executeTrapEffect | Origin placeable is missing or invalid.');
        return null;
    }

    let effectObj: any = animation;
    let animationPath = '';
    if (typeof animation === 'string') {
        animationPath = animation;
        effectObj = adapter.getProperty(globalThis, animation);
        if (!effectObj) {
            effectObj = adapter.getProperty(globalThis, `eskie.effect.${animation}`)
                ?? adapter.getProperty(globalThis, `eskie.traps.${animation}`);
        }
    }

    if (!effectObj) {
        log.error(`executeTrapEffect | Animation "${animation}" could not be resolved.`);
        return null;
    }

    const targetLocation = config.targetLocation
        ? adapter.getTargetLocation(config.targetLocation)
        : (target ? adapter.getTargetLocation(target) : null);

    const casterProxy = adapter.createCasterProxy(origin, targetLocation);

    let resolvedTargets = Array.isArray(targets) ? [...targets] : [];
    if (resolvedTargets.length === 0) {
        const trapZone = target ?? origin;
        resolvedTargets = adapter.getTokensInPlaceable(trapZone);
    }

    const explicitType = config.type;
    const isTrapModule = explicitType === 'trap'
        || Boolean(effectObj.setup)
        || animationPath.includes('.traps.');

    const isTemplateEffect = explicitType === 'template'
        || animationPath.includes('.template.')
        || animationPath.includes('templatefx')
        || Boolean(effectObj.default_config && ('radius' in effectObj.default_config || 'template' in effectObj.default_config || ('distance' in effectObj.default_config && !('pushDistance' in effectObj.default_config))));

    if (isTrapModule) {
        const trapConfig = { ...config };
        if (targetLocation && !trapConfig.targetLocation) {
            trapConfig.targetLocation = targetLocation;
        }
        const playFn = effectObj.play ?? effectObj;
        return playFn(origin, resolvedTargets, trapConfig);
    }

    if (isTemplateEffect) {
        const templateConfig = {
            ...config,
            template: config.template ?? target ?? origin,
            targetLocation,
        };
        const playFn = effectObj.play ?? effectObj;
        return playFn(casterProxy, templateConfig);
    }

    const playFn = effectObj.play ?? effectObj;
    const targetConfig = {
        ...config,
        targetLocation,
    };

    if (resolvedTargets.length > 0) {
        const fnStr = typeof playFn === 'function' ? playFn.toString() : '';
        const acceptsArray = /\(\s*[^,)]+\s*,\s*targets\b/.test(fnStr);
        if (acceptsArray) {
            return playFn(casterProxy, resolvedTargets, targetConfig);
        }
        return Promise.all(resolvedTargets.map(targetToken => playFn(casterProxy, targetToken, targetConfig)));
    }

    if (target) {
        const targetProxy = adapter.createCasterProxy(target);
        return playFn(casterProxy, targetProxy, targetConfig);
    }

    return null;
}

export const playEffectAsTrap = executeTrapEffect;

adapter.executeTrapEffectHandler = executeTrapEffect;

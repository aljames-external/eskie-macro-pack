// Standalone Macro: Tasha's Caustic Brew
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Tasha's Caustic Brew' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const DEFAULT_CONFIG = {
    id: 'tashasCausticBrewCast',
    size: 1,
    icon: 'icons/magic/acid/dissolve-drip-droplet-smoke.webp',
    label: "Tasha's Caustic Brew",
    tag: 'Caustic Brew',
    drawIcon: true,
    drawOutline: true,
    interval: 2,
    rememberControlled: true,
};

const label = DEFAULT_CONFIG.label ?? "Tasha's Caustic Brew";
const targets = game.user.targets.size > 0 ? Array.from(game.user.targets) : [];

// Toggle / re-entrant persistent effect handling:
const causticFx = Sequencer.EffectManager.getEffects({ name: "*Caustic*" });
if (causticFx.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: "*Caustic*" });
    return ui.notifications.info("Cleared Tasha's Caustic Brew.");
}

/**
 * Resolves aim point position via standard template document coordinates or Sequencer crosshair positioning.
 */
async function getAimPoint(templateDoc, config = {}) {
    if (templateDoc) {
        let primary, secondary;
        if (templateDoc.documentName === 'Region' || templateDoc.shapes) {
            const shape = templateDoc.shapes?.[0];
            primary = { x: shape?.x ?? 0, y: shape?.y ?? 0 };
            const distance = shape?.radius ?? shape?.distance ?? 0;
            if (shape?.rotation !== undefined && distance > 0) {
                const rad = Math.toRadians(shape.rotation);
                secondary = {
                    x: primary.x + Math.cos(rad) * distance,
                    y: primary.y + Math.sin(rad) * distance
                };
            } else {
                secondary = { x: primary.x, y: primary.y };
            }
        } else {
            const farpoint = templateDoc.object?.ray?.B;
            secondary = { x: farpoint?.x ?? templateDoc.x, y: farpoint?.y ?? templateDoc.y };
            primary = { x: templateDoc.x ?? token.x, y: templateDoc.y ?? token.y };
        }
        return secondary ?? primary;
    } else {
        const crosshairCfg = {
            size: config.size ?? 1,
            icon: config.icon ?? 'icons/magic/acid/dissolve-drip-droplet-smoke.webp',
            label: config.label ?? "Tasha's Caustic Brew",
            tag: config.tag ?? 'Caustic Brew',
            drawIcon: config.drawIcon ?? true,
            drawOutline: config.drawOutline ?? true,
            interval: config.interval ?? 2,
            rememberControlled: config.rememberControlled ?? true,
        };
        const pos = await Sequencer.Crosshair.show(crosshairCfg);
        if (!pos || pos.cancelled) return null;
        return pos;
    }
}

const templateDoc = scope?.template ?? null;
const position = await getAimPoint(templateDoc, DEFAULT_CONFIG);
if (!position) return;

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

// Cast Sequence with acid green streaming spray line & markers
sequence.effect()
    .name(label)
    .file(closest('jb2a.markers.bubble.02.complete.green'))
    .atLocation(token)
    .scale(0.1)
    .rotateTowards(position)
    .rotate(90)
    .playbackRate(1)
    .duration(5100)
    .fadeOut(1000)
    .spriteOffset({ x: -0.2, y: 0.1 + (tokenWidth - 1) / 2 }, { gridUnits: true })
    .filter('ColorMatrix', { saturate: 1, hue: 0 })
    .zIndex(3);

sequence.effect()
    .name(label)
    .file(closest('jb2a.markers.light_orb.complete.green'))
    .atLocation(token)
    .scale(0.25)
    .rotateTowards(position)
    .playbackRate(1.5)
    .duration(5100)
    .scaleOut(0, 2000, { ease: 'easeOutCubic' })
    .spriteOffset({ x: -0.1 + (tokenWidth - 1) / 2 }, { gridUnits: true })
    .filter('ColorMatrix', { saturate: 0.5, hue: -30 })
    .zIndex(2);

sequence.effect()
    .name(label)
    .file(closest('jb2a.smoke.puff.side.grey'))
    .delay(1700)
    .atLocation(token)
    .scale(0.1)
    .rotateTowards(position)
    .playbackRate(0.25)
    .spriteOffset({ x: -0.4, y: 0 + (tokenWidth - 1) / 2 }, { gridUnits: true })
    .opacity(0.75)
    .tint('#BEE43E')
    .zIndex(2);

// Acid green streaming spray line animation
sequence.effect()
    .name(label)
    .file(closest('jb2a.breath_weapons.acid.line.green'))
    .atLocation(token)
    .scale(0.5)
    .rotateTowards(position)
    .playbackRate(1.5)
    .spriteOffset({ x: 0.35 + (tokenWidth - 1) / 2 }, { gridUnits: true })
    .zIndex(1);

// Persistent sizzling acid foam pool animations on targeted tokens
for (let target of targets) {
    const targetWidth = target.document?.width ?? target.width ?? 1;
    const targetName = target.document?.name ?? target.name ?? "Target";
    const targetScaleX = target.document?.texture?.scaleX ?? 1;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    let targetSeq = new Sequence()
        .wait(2200)

        .effect()
        .delay(200)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .attachTo(target)
        .fadeIn(200)
        .fadeOut(500)
        .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .scaleToObject(targetScaleX)
        .duration(1800)
        .opacity(0.25)
        .tint('#BEE43E')
        .filter('ColorMatrix', { saturate: 1 })

        // Persistent Sizzling Acid Pool 1
        .effect()
        .file(closest('jb2a.grease.dark_grey.loop'))
        .attachTo(target, { offset: { x: 0.25 * targetWidth, y: 0.3 * targetWidth }, gridUnits: true, bindRotation: false })
        .randomRotation()
        .scaleToObject(0.4)
        .opacity(0.8)
        .tint('#BEE43E')
        .filter('ColorMatrix', { saturate: 1, hue: 0, brightness: 2 })
        .fadeIn(2000)
        .fadeOut(2000)
        .scaleIn(0, 1500, { ease: 'easeOutCubic' })
        .scaleOut(0, 1500, { ease: 'easeOutCubic' })
        .mask(target)
        .zIndex(0.1)
        .name(`${targetName}CausticBrew`)
        .persist()
        .private()

        .effect()
        .delay(100, 1000)
        .file(closest('eskie.smoke.05.purple'))
        .attachTo(target, { offset: { x: 0.25 * targetWidth, y: 0.1 * targetWidth }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.4)
        .opacity(0.4)
        .tint('#BEE43E')
        .randomizeMirrorX()
        .fadeIn(500)
        .fadeOut(500)
        .zIndex(0.2)
        .name(`${targetName}CausticBrew`)
        .persist()
        .private()

        // Persistent Sizzling Acid Pool 2
        .effect()
        .file(closest('jb2a.grease.dark_grey.loop'))
        .attachTo(target, { offset: { x: -0.4 * targetWidth, y: 0 * targetWidth }, gridUnits: true, bindRotation: false })
        .randomRotation()
        .scaleToObject(0.4)
        .opacity(0.8)
        .tint('#BEE43E')
        .filter('ColorMatrix', { saturate: 1, hue: 0, brightness: 2 })
        .fadeIn(2000)
        .fadeOut(2000)
        .scaleIn(0, 1500, { ease: 'easeOutCubic' })
        .scaleOut(0, 1500, { ease: 'easeOutCubic' })
        .mask(target)
        .zIndex(0.1)
        .name(`${targetName}CausticBrew`)
        .persist()
        .private()

        .effect()
        .delay(100, 1000)
        .file(closest('eskie.smoke.05.purple'))
        .attachTo(target, { offset: { x: -0.4 * targetWidth, y: -0.2 * targetWidth }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.4)
        .opacity(0.4)
        .tint('#BEE43E')
        .randomizeMirrorX()
        .fadeIn(500)
        .fadeOut(500)
        .zIndex(0.2)
        .name(`${targetName}CausticBrew`)
        .persist()
        .private()

        // Persistent Sizzling Acid Pool 3
        .effect()
        .file(closest('jb2a.grease.dark_grey.loop'))
        .attachTo(target, { offset: { x: 0.15 * targetWidth, y: -0.5 * targetWidth }, gridUnits: true, bindRotation: false })
        .randomRotation()
        .scaleToObject(0.4)
        .opacity(0.8)
        .tint('#BEE43E')
        .filter('ColorMatrix', { saturate: 1, hue: 0, brightness: 2 })
        .fadeIn(2000)
        .fadeOut(2000)
        .scaleIn(0, 1500, { ease: 'easeOutCubic' })
        .scaleOut(0, 1500, { ease: 'easeOutCubic' })
        .mask(target)
        .zIndex(0.1)
        .name(`${targetName}CausticBrew`)
        .persist()
        .private()

        .effect()
        .delay(100, 1000)
        .file(closest('eskie.smoke.05.purple'))
        .attachTo(target, { offset: { x: 0.15 * targetWidth, y: -0.55 * targetWidth }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.3)
        .opacity(0.4)
        .tint('#BEE43E')
        .randomizeMirrorX()
        .fadeIn(500)
        .fadeOut(500)
        .zIndex(0.2)
        .name(`${targetName}CausticBrew`)
        .persist();

    sequence.addSequence(targetSeq);
}

await sequence.play();

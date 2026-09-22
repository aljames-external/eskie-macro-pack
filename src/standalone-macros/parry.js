// Standalone Macro: Parry
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Parry' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
const target = Array.from(game.user.targets)[0];

if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const cfg = {
    type: 'slashing',
    weight: 'medium',
    color: 'blue'
};

const weightIndex = ({ light: 0, medium: 1, heavy: 2 })[cfg.weight] ?? 1;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);
const tokenWidth = token.document?.width ?? 1;

const sequence = new Sequence();

// Attacker parry recoil block motion via Sequencer 4.3.0+ sequence.motion(token)
sequence.motion(token)
    .moveBy({ x: -0.25 }, { gridUnits: true, duration: 250, ease: 'easeOutSine', delay: 100 })
    .moveBy({ x: 0.25 }, { gridUnits: true, duration: 350, ease: 'easeOutCubic', delay: 350 });

if (target) {
    const targetSquare = { x: target.center.x, y: target.center.y };
    sequence.effect()
        .file(closest(`eskie.attack.melee.generic.01.${cfg.type}.${cfg.weight}.${cfg.color}.fast.03`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .randomizeMirrorY()
        .zIndex(1);

    sequence.effect()
        .file(closest("eskie.particle.07.orange"))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(1.5, { considerTokenScale: true })
        .zIndex(1.1)
        .spriteOffset({ x: -1.25 * tokenWidth }, { gridUnits: true });
}

await sequence.play({ preload: true });

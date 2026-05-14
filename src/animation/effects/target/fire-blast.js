/**
 * fire-blast.js
 * 
 * Original Author: yamiakane (@yamiakane on Discord)
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    pushDistance: 80,
    knockbackDuration: 200,
    returnDuration: 600,
    sound: {
        enabled: true,
        volume: 0.5,
    },
};

async function create(source, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { pushDistance, knockbackDuration, returnDuration, sound } = mConfig;

    const sequence = new Sequence();

    // Vector calculations for knockback
    const dx = target.center.x - source.center.x;
    const dy = target.center.y - source.center.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) return sequence;

    const nx = dx / dist;
    const ny = dy / dist;
    const nxt = -nx;
    const nyt = -ny;

    // --- Charging Phase ---
    if (sound.enabled) {
        sequence.sound()
            .delay(200)
            .file(closest('blfx.sound.misc.impact.fire1.4'))
            .volume(sound.volume);

        sequence.sound()
            .file(closest('blfx.sound.spell.elementalism1.1'))
            .volume(sound.volume * 0.8);
    }

    sequence.effect()
        .file(closest('jb2a.divine_smite.caster.standard.orange'))
        .atLocation(source)
        .scaleToObject(0.5, { considerTokenScale: true })
        .playbackRate(1.6)
        .aboveInterface()
        .waitUntilFinished(-500);

    sequence.effect()
        .file(closest('jb2a.lightning_orb.01.loop.bluepurple.0'))
        .filter('ColorMatrix', { hue: 90, contrast: 1.5 })
        .tint('#e6a900')
        .attachTo(source)
        .scaleToObject(0.3, { considerTokenScale: true })
        .duration(2500) // Replaced persist() with duration for one-shot attack
        .fadeIn(200)
        .fadeOut(400)
        .aboveInterface()
        .animateProperty('sprite', 'position.x', { from: 0, to: 0.5, duration: 1200, gridUnits: true, ease: 'easeInOutQuad' })
        .loopProperty('spriteContainer', 'rotation', { from: 0, to: 360, duration: 2000, ease: 'linear' })
        .loopProperty('sprite', 'rotation', { from: 0, to: 360, duration: 2000, ease: 'linear' });

    sequence.effect()
        .file(closest('blfx.spell.template.circle.emanating.aura3.loop.radial.color5'))
        .filter('ColorMatrix', { hue: 30, saturate: 2 })
        .fadeIn(500)
        .fadeOut(300)
        .attachTo(source)
        .duration(2500)
        .scaleToObject(0.33, { considerTokenScale: true })
        .opacity(0.6)
        .belowTokens();

    if (sound.enabled) {
        sequence.sound()
            .file(closest('blfx.sound.spell.loop_channel.fire_burning1.5'))
            .fadeInAudio(200)
            .fadeOutAudio(500)
            .duration(2500)
            .volume(sound.volume);

        sequence.sound()
            .file(closest('blfx.sound.ability.breath.1'))
            .volume(sound.volume);

        sequence.sound()
            .delay(400)
            .file(closest('blfx.sound.misc.shock_wave.2'))
            .volume(sound.volume);
    }

    sequence.effect()
        .file(closest('blfx.spell.cast.swirl1.fire1.loop.orange'))
        .scaleToObject(0.2, { considerTokenScale: true })
        .fadeIn(600)
        .fadeOut(600)
        .attachTo(source)
        .belowTokens()
        .duration(2500)
        .waitUntilFinished(-1000);

    // --- Final Attack Phase ---
    sequence.effect()
        .file(closest('jb2a.ranged_helix.hit.001.orangeyellow'))
        .scaleToObject(0.6, { considerTokenScale: true })
        .atLocation(source)
        .randomRotation()
        .belowTokens();

    if (sound.enabled) {
        sequence.sound()
            .file(closest('blfx.sound.spell.cast.fire.1'))
            .volume(sound.volume);
    }

    sequence.effect()
        .file(closest('jb2a.ranged_helix.cast.001.orangeyellow'))
        .atLocation(source)
        .scaleToObject(0.6, { considerTokenScale: true })
        .spriteOffset({ x: -1.8 }, { gridUnits: true })
        .rotateTowards(target)
        .belowTokens()
        .waitUntilFinished(-1850);

    sequence.animation()
        .delay(200)
        .on(source)
        .opacity(0);

    if (sound.enabled) {
        sequence.sound()
            .file(closest('blfx.sound.spell.sacred_flame1.impact.2'))
            .volume(sound.volume);
    }

    sequence.effect()
        .file(closest('jb2a.on_token_buff.001.003.orangeyellow'))
        .atLocation(source)
        .scaleToObject(0.5, { considerTokenScale: true });

    if (sound.enabled) {
        sequence.sound()
            .file(closest('blfx.sound.spell.cast.burning_hands.2'))
            .volume(sound.volume);

        sequence.sound()
            .file(closest('blfx.sound.spell.cast.fireball.4'))
            .volume(sound.volume);
    }

    sequence.effect()
        .file(closest('jb2a.ranged_missile.cast.001.orangeyellow'))
        .atLocation(source)
        .scaleToObject(0.5, { considerTokenScale: true })
        .spriteOffset({ x: -75 })
        .rotateTowards(target)
        .waitUntilFinished(-1000);

    // Source Knockback
    sequence.effect()
        .delay(100)
        .copySprite(source)
        .animateProperty('sprite', 'position.x', {
            from: 0,
            to: nxt * canvas.grid.size * 0.2,
            duration: knockbackDuration,
            ease: 'easeOutExpo'
        })
        .animateProperty('sprite', 'position.y', {
            from: 0,
            to: nyt * canvas.grid.size * 0.2,
            duration: knockbackDuration,
            ease: 'easeOutExpo'
        });

    sequence.effect()
        .delay(100)
        .copySprite(source)
        .animateProperty('sprite', 'position.x', {
            from: nxt * canvas.grid.size * 0.2,
            to: 0,
            duration: returnDuration,
            ease: 'easeInQuart'
        })
        .animateProperty('sprite', 'position.y', {
            from: nyt * canvas.grid.size * 0.2,
            to: 0,
            duration: returnDuration,
            ease: 'easeInQuart'
        });

    sequence.animation()
        .delay(returnDuration + 60)
        .on(source)
        .opacity(1);

    // Projectile
    sequence.effect()
        .file(closest('jb2a.ranged.04.projectile.01.orange'))
        .tint('#fce703')
        .atLocation(source)
        .stretchTo(target)
        .opacity(1)
        .waitUntilFinished(-1000);

    if (sound.enabled) {
        sequence.sound()
            .file(closest('blfx.sound.spell.cast.fireball.2'))
            .volume(sound.volume);

        sequence.sound()
            .delay(200)
            .file(closest('blfx.sound.misc.fire.throw.1'))
            .volume(sound.volume);
    }

    // Impact
    sequence.effect()
        .file(closest('jb2a.explosion.01.orange'))
        .atLocation(target)
        .scaleToObject(0.6, { considerTokenScale: true })
        .opacity(1)
        .zIndex(2);

    sequence.animation()
        .on(target)
        .opacity(0);

    // Target Knockback
    sequence.effect()
        .copySprite(target)
        .animateProperty('sprite', 'position.x', {
            from: 0,
            to: nx * pushDistance * 0.15,
            duration: knockbackDuration,
            ease: 'easeOutExpo'
        })
        .animateProperty('sprite', 'position.y', {
            from: 0,
            to: ny * pushDistance * 0.15,
            duration: knockbackDuration,
            ease: 'easeOutExpo'
        })
        .zIndex(1);

    sequence.effect()
        .delay(100)
        .copySprite(target)
        .animateProperty('sprite', 'position.x', {
            from: nx * pushDistance * 0.15,
            to: 0,
            duration: returnDuration,
            ease: 'easeInQuart'
        })
        .animateProperty('sprite', 'position.y', {
            from: ny * pushDistance * 0.15,
            to: 0,
            duration: returnDuration,
            ease: 'easeInQuart'
        })
        .zIndex(1);

    sequence.animation()
        .delay(returnDuration + 50)
        .on(target)
        .opacity(1);

    return sequence;
}

async function play(source, target, config = {}) {
    const sequence = await create(source, target, config);
    if (sequence) return sequence.play();
}

function stop(target, config = {}) {
    // This animation is one-shot
}

export const fireBlast = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register('Fire Blast', 'ranged-target', 'eskie.effect.fireBlast', DEFAULT_CONFIG, '0.1.0');

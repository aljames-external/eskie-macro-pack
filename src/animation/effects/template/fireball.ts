// Original Author: .eskie
// Editor: Papa Nurgle
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';


const DEFAULT_CONFIG = {
    id: 'fireball',
    radius: 20,
    scorchedEarth: true,
    persistEffect: false,
    tintMap: true,
    sound: {
        beam: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            file: 'psfx.3rd-level-spells.fireball.v1.001.beam',
            volume: 1,
        },
        cast: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            file: 'blfx.sound.spell.cast.burning_hands',
            volume: 1,
        },
        explosion: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            file: 'psfx.3rd-level-spells.fireball.v1.001.explosion',
            volume: 1,
        },
    },
};

async function create(token: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { radius, scorchedEarth, persistEffect, tintMap, sound, template } = mConfig;

    const cfg = {
        radius,
        label: 'Fireball',
        icon: token.document?.texture?.src ?? ''
    };
    let [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!primary && !center) return null;
    const rawCenter = center ?? primary;

    const targetEntity = config.target ?? config.targets?.[0] ?? template;
    const targetPos = adapter.createTargetProxy(targetEntity, { center: rawCenter, minUnits: 1 });

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const tokenOffset = (tokenWidth - 1) / 2;

    const rawName = typeof token?.name === 'string' ? token.name.trim() : '';
    const tokenName = rawName.length > 0 ? rawName : 'Fireball';
    const castingEffectName = `Casting ${tokenName}`;

    // Clean up any lingering casting tint from prior runs
    Sequencer.EffectManager.endEffects({ name: castingEffectName });
    Sequencer.EffectManager.endEffects({ name: 'Casting Trap Origin' });
    Sequencer.EffectManager.endEffects({ name: 'Casting ' });

    const sequence = new Sequence();
    const bg = adapter.getSceneBackground(canvas?.scene);
    const sceneDimensions = adapter.getSceneDimensions(canvas?.scene);
    const sceneCenter = adapter.getSceneCenter(canvas?.scene);

    if (tintMap && bg?.src) {
        sequence
            .effect()
                .name(castingEffectName)
                .file(bg.src)
                .filter('ColorMatrix', { saturate: 1, brightness: 0.6 })
                .atLocation(sceneCenter)
                .size({ width: sceneDimensions.width / sceneDimensions.size, height: sceneDimensions.height / sceneDimensions.size }, { gridUnits: true })
                .duration(5000)
                .fadeIn(2000)
                .fadeOut(2000)
                .filter('ColorMatrix', { brightness: 0 })
                .belowTokens()
                .opacity(0.5)
                .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY });
    }

    applySound(sequence, sound.beam);

    sequence
        .effect()
            .file(closest('jb2a.fireball.beam.orange'))
            .attachTo(token, { offset: { x: 0.25 + tokenOffset }, gridUnits: true, local: true })
            .stretchTo(targetPos, { attachTo: true })
            .duration(1900)
            .zIndex(1)

        .effect()
            .file(closest('eskie.pulse.energy.03.slow.orange'))
            .attachTo(token, { offset: { x: -0.575 - tokenOffset }, gridUnits: true, local: true })
            .rotateTowards(targetPos, { attachTo: true })
            .scaleToObject(2, { considerTokenScale: true })
            .duration(1900)

        .effect()
            .delay(2000)
            .file(closest('eskie.velocity.02'))
            .atLocation(token)
            .rotateTowards(targetPos)
            .size(6, { gridUnits: true })
            .spriteOffset({ x: -4 + tokenOffset }, { gridUnits: true })
            .spriteScale({ x: 1, y: 1.5 })
            .fadeOut(2000)
            .filter('ColorMatrix', { brightness: 0 })

        .effect()
            .file(closest('eskie.star.twinkling_star.02.orangeyellow'))
            .attachTo(token, { offset: { x: -1 - tokenOffset }, gridUnits: true, local: true })
            .rotateTowards(targetPos)
            .delay(1800)
            .scaleToObject(3, { considerTokenScale: true })
            .playbackRate(1.2)
            .spriteRotation(80)
            .waitUntilFinished(-250);

    applySound(sequence, sound.cast);

    sequence
        .effect()
            .file(closest('jb2a.fireball.beam.orange'))
            .atLocation(token, { offset: { x: 0.2 + tokenOffset }, gridUnits: true, local: true })
            .stretchTo(targetPos)
            .startTime(2000)

        .effect()
            .file(closest('jb2a.cast_generic.fire.side01.orange.0'))
            .atLocation(token)
            .rotateTowards(targetPos)
            .size(4.5, { gridUnits: true })
            .startTime(750)

        .wait(400)

        .effect()
            .delay(250)
            .file(closest('eskie.star.03.orange'))
            .atLocation(targetPos)
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(1)
            .filter('ColorMatrix', { saturate: 1, hue: -5 })
            .spriteRotation(5)
            .waitUntilFinished(-250)

        .canvasPan()
            .shake({ duration: 1000, strength: 3, rotation: false, fadeOut: 1000 })

        .wait(450);

    applySound(sequence, sound.explosion);

    sequence
        .effect()
            .file(closest('jb2a.fireball.explosion.orange'))
            .atLocation(targetPos)
            .scaleToObject(1.4, { considerTokenScale: true })
            .scaleIn(0, 500, { ease: 'easeOutQuint' })
            .zIndex(2)

        .effect()
            .file(closest('jb2a.smoke.puff.ring.02.dark_black'))
            .atLocation(targetPos)
            .scaleToObject(1.8, { considerTokenScale: true })
            .scaleIn(0, 500, { ease: 'easeOutQuint' })
            .opacity(0.5)
            .randomSpriteRotation()
            .filter('ColorMatrix', { brightness: 0 })
            .zIndex(1)

        .effect()
            .file(closest('jb2a.extras.tmfx.outpulse.circle.02.normal'))
            .atLocation(targetPos)
            .scaleToObject(4, { considerTokenScale: true })
            .scaleIn(0, 500, { ease: 'easeOutQuint' })
            .opacity(0.25)
            .belowTokens()
            .randomSpriteRotation()
            .filter('ColorMatrix', { brightness: 0 })
            .zIndex(1);

    if (scorchedEarth) {
        sequence
            .effect()
                .file(closest('jb2a.ground_cracks.orange.01'))
                .atLocation(targetPos)
                .scaleToObject(0.9, { considerTokenScale: true })
                .randomRotation()
                .fadeOut(2000)
                .duration(5000)
                .belowTokens()
                .delay(2300)
                .persist(persistEffect)
                .zIndex(0.1)

            .effect()
                .file(closest('jb2a.scorched_earth.black'))
                .atLocation(targetPos)
                .scaleToObject(0.8, { considerTokenScale: true })
                .fadeOut(2000)
                .duration(5000)
                .opacity(0.5)
                .belowTokens()
                .delay(2300)
                .persist(persistEffect);
    }

    sequence.thenDo(function() {
        Sequencer.EffectManager.endEffects({ name: castingEffectName });
        Sequencer.EffectManager.endEffects({ name: `Casting ${tokenName}` });
        Sequencer.EffectManager.endEffects({ name: 'Casting Trap Origin' });
        Sequencer.EffectManager.endEffects({ name: 'Casting ' });
        Sequencer.EffectManager.endEffects({ name: 'Casting *' });
    });

    return sequence;
}

async function play(token: Token, config: any = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play({ preload: true });
}

function stop(token?: Token) {
    const rawName = typeof token?.name === 'string' ? token.name.trim() : '';
    const tokenName = rawName.length > 0 ? rawName : 'Fireball';
    Sequencer.EffectManager.endEffects({ name: `Casting ${tokenName}` });
    Sequencer.EffectManager.endEffects({ name: 'Casting Trap Origin' });
    Sequencer.EffectManager.endEffects({ name: 'Casting ' });
    Sequencer.EffectManager.endEffects({ name: 'Casting *' });
}

export const fireball = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('fireball', 'template', 'eskie.effect.fireball', DEFAULT_CONFIG, '0.0.1', 'Fireball');

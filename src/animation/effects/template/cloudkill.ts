// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';


const DEFAULT_CONFIG = {
    id: 'cloudkill',
    radius: 20,
    tintMap: true,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { radius, tintMap, sound, template } = mConfig;

    const cfg = {
        radius,
        label: 'Cloudkill',
        icon: token.document?.texture?.src ?? ''
    };
    let [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!primary && !center) return null;
    const rawCenter = center ?? primary;

    const targetEntity = config.target ?? config.targets?.[0] ?? template;
    const targetPos = adapter.createTargetProxy(targetEntity, { center: rawCenter, minUnits: 1 });

    const rawName = typeof token?.name === 'string' ? token.name.trim() : '';
    const tokenName = rawName.length > 0 ? rawName : 'Cloudkill';
    const castingEffectName = `Casting ${tokenName}`;

    // Clean up any lingering casting tint from prior runs
    Sequencer.EffectManager.endEffects({ name: castingEffectName });
    Sequencer.EffectManager.endEffects({ name: 'Casting Trap Origin' });
    Sequencer.EffectManager.endEffects({ name: 'Casting ' });

    const sequence = new Sequence();
    applySound(sequence, sound);
    const bg = adapter.getSceneBackground(canvas?.scene);
    const sceneDimensions = adapter.getSceneDimensions(canvas?.scene);
    const sceneCenter = adapter.getSceneCenter(canvas?.scene);

    if (tintMap && bg?.src) {
        sequence
            .effect()
                .name(castingEffectName)
                .file(bg.src)
                .atLocation(sceneCenter)
                .size({ width: sceneDimensions.width / sceneDimensions.size, height: sceneDimensions.height / sceneDimensions.size }, { gridUnits: true })
                .duration(5000)
                .fadeIn(1000, { ease: 'easeOutCubic' })
                .fadeOut(2000)
                .filter('ColorMatrix', { brightness: 0 })
                .belowTokens()
                .opacity(0.5)
                .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY });
    }

    sequence
        .effect()
            .file(closest('eskie.smoke.07.green'))
            .atLocation(targetPos)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .scaleToObject(1.5, { considerTokenScale: true })
            .opacity(0.1)

        .effect()
            .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
            .atLocation(targetPos)
            .scaleToObject(0.75, { considerTokenScale: true })
            .fadeIn(250)
            .fadeOut(750, { ease: 'easeOutCubic' })
            .duration(2100)
            .opacity(0.1)
            .belowTokens()
            .tint('#94d123')
            .randomRotation()

        .effect()
            .file(closest('eskie.star.03.green'))
            .atLocation(targetPos)
            .size({ width: 2.5, height: 2.5 }, { gridUnits: true })

        .wait(500)

        .effect()
            .file(closest('eskie.poison.circle.01.green'))
            .atLocation(targetPos)
            .scaleToObject(1.1, { considerTokenScale: true })

        .effect()
            .name(`Cloudkill ${tokenName}`)
            .file(closest('jb2a.fog_cloud.02.green'))
            .atLocation(targetPos)
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.35)
            .fadeIn(3000)
            .scaleIn(0.25, 2500, { ease: 'easeOutSine' })
            .persist()
            .zIndex(1)

        .wait(5000)

        .thenDo(function() {
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
    const tokenName = rawName.length > 0 ? rawName : 'Cloudkill';
    Sequencer.EffectManager.endEffects({ name: `Cloudkill ${tokenName}` });
    Sequencer.EffectManager.endEffects({ name: `Casting ${tokenName}` });
    Sequencer.EffectManager.endEffects({ name: 'Casting Trap Origin' });
    Sequencer.EffectManager.endEffects({ name: 'Casting ' });
    Sequencer.EffectManager.endEffects({ name: 'Casting *' });
}

export const cloudkill = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('cloudkill', 'template', 'eskie.effect.cloudkill', DEFAULT_CONFIG, '0.0.1', 'Cloudkill');

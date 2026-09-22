// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'shadowArrow',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target?: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    const trg = target ?? Array.from(game.user?.targets ?? [])[0];
    if (!token || !trg) return;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest('eskie.casting.physical.03.side.one_shot.purple'))
            .attachTo(token)
            .rotateTowards(trg)
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(2)
            .filter('ColorMatrix', { hue: -35, brightness: 0.2 })
            .waitUntilFinished(-750)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.purpleblack.slow'))
            .atLocation(token)
            .stretchTo(trg)
            .zIndex(2)
            .filter('ColorMatrix', { hue: -35, brightness: 0.2 })
            .waitUntilFinished(-750)

        .motion(trg)
            .noise({ strength: 0.05, frequency: 50, duration: 1000, gridUnits: true })

        .effect()
            .file(closest('eskie.damage.psychic.01.darkpurple'))
            .attachTo(trg, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1.5, { considerTokenScale: true })
            .filter('ColorMatrix', { saturate: -1 })
            .zIndex(1)

        .effect()
            .file(closest('jb2a.smoke.puff.centered.dark_black'))
            .atLocation(trg)
            .scaleToObject(1.65, { considerTokenScale: true })
            .randomRotation()
            .repeats(3, 250, 250)
            .belowTokens()
            .playbackRate(1.2)
            .zIndex(2)

        .effect()
            .copySprite(trg)
            .attachTo(trg)
            .scaleToObject(1, { considerTokenScale: true })
            .rotate(0)
            .fadeIn(2000)
            .fadeOut(1500)
            .duration(4500)
            .filter('ColorMatrix', { saturate: -1, brightness: 0.75 })

        .effect()
            .name(`${trg.name} Shadow Arrow`)
            .delay(1000)
            .file(closest('jb2a.sleep.cloud.02.dark_purple'))
            .attachTo(trg, { offset: { y: 0 }, gridUnits: true, local: true })
            .scaleToObject(1.5, { considerTokenScale: true })
            .spriteScale({ x: 1, y: 1 })
            .fadeIn(1500)
            .opacity(1)
            .filter('ColorMatrix', { saturate: -1, brightness: 0 })
            .loopProperty('alphaFilter', 'alpha', { from: -0.2, to: 0, duration: 2500, pingPong: true })
            .belowTokens()
            .persist()

        .effect()
            .name(`${trg.name} Shadow Arrow`)
            .delay(1000)
            .file(closest('jb2a.extras.tmfx.inflow.circle.02'))
            .attachTo(trg, { offset: { y: 0 }, gridUnits: true, local: true })
            .scaleToObject(1.1, { considerTokenScale: true })
            .spriteScale({ x: 1, y: 1 })
            .fadeIn(1500)
            .opacity(1)
            .filter('ColorMatrix', { saturate: -1, brightness: 0 })
            .loopProperty('alphaFilter', 'alpha', { from: -0.2, to: 0, duration: 2500, pingPong: true })
            .mask()
            .persist()

        .effect()
            .name(`${trg.name} Shadow Arrow`)
            .file(closest('eskie.symbol.eye.01.purple'))
            .attachTo(trg, { offset: { y: 0 }, gridUnits: true, local: true })
            .scaleToObject(0.45, { considerTokenScale: true })
            .fadeIn(1500)
            .opacity(0.8)
            .filter('ColorMatrix', { saturate: -1 })
            .persist()
            .zIndex(1);

    return sequence;
}

async function play(token: Token, target?: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token: Token, target: Token, config: any = {}) {
    Sequencer.EffectManager.endEffects({ name: `${target.name} Shadow Arrow`, object: target });
}

export const shadowArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('shadowArrow', 'ranged-target', 'eskie.effect.arcaneShot.shadowArrow', DEFAULT_CONFIG, '0.0.1', 'Shadow Arrow');

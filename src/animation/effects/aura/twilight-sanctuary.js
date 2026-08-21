// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations, CONCENTRATING } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'twilightSanctuary',
    darkMap: true,
    radius: 30
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, darkMap } = mConfig;

    if (!token) return;

    const label = `${id} - ${token.id}`;
    const seq = new Sequence();

    if (darkMap && canvas?.scene?.background?.src) {
        seq.effect()
            .name(label)
            .file(closest(canvas.scene.background.src))
            .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .fadeIn(750)
            .fadeOut(750)
            .duration(4000)
            .filter('ColorMatrix', { brightness: 0 })
            .belowTokens()
            .persist()
            .opacity(0.5)
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY });
    }

    seq.wait(250);

    seq.effect()
        .name(label)
        .file(closest('jb2a.markers.light_orb.complete.white'))
        .attachTo(token)
        .scaleToObject(0.65, { considerTokenScale: true })
        .persist();

    seq.effect()
        .file(closest('jb2a.energy_strands.in.blue'))
        .attachTo(token)
        .scaleToObject(2.5, { considerTokenScale: true })
        .filter('ColorMatrix', { brightness: 0 })
        .belowTokens()
        .opacity(0.8)
        .playbackRate(1.2);

    seq.wait(1000);

    seq.effect()
        .file(closest('eskie.pulse.energy.01.yellow'))
        .attachTo(token, { offset: { x: 0 }, gridUnits: true })
        .scaleToObject(0.7, { gridUnits: true })
        .filter('ColorMatrix', { saturate: -1 })
        .zIndex(1);

    seq.effect()
        .file(closest('eskie.pulse.energy.01.yellow'))
        .attachTo(token, { offset: { x: 0 }, gridUnits: true })
        .scaleToObject(13.5, { gridUnits: true })
        .filter('ColorMatrix', { saturate: -1 })
        .zIndex(1);

    seq.effect()
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(token)
        .scaleToObject(3, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .zIndex(2);

    seq.effect()
        .name(label)
        .file(closest('jb2a.particles.outward.white.02.03'))
        .attachTo(token)
        .size(2, { gridUnits: true })
        .persist()
        .belowTokens()
        .zIndex(3);

    seq.effect()
        .name(label)
        .file(closest('eskie.aura.twilight.02.black'))
        .attachTo(token, { bindRotation: false })
        .size(13, { gridUnits: true })
        .belowTokens()
        .opacity(1)
        .zIndex(2)
        .filter('ColorMatrix', { hue: -125 })
        .persist();

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (token) Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}`, object: token });
}

export const twilightSanctuary = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('twilightSanctuary', 'aura', 'eskie.effect.twilightSanctuary', DEFAULT_CONFIG, '0.0.0', 'Twilight Sanctuary');
autoanimations.register('channelDivinityTwilightSanctuary', 'aura', 'eskie.effect.twilightSanctuary', DEFAULT_CONFIG, '0.0.0', 'Channel Divinity: Twilight Sanctuary');
autoanimations.register(CONCENTRATING('twilightSanctuary', 'Twilight Sanctuary'), 'effect', 'eskie.effect.twilightSanctuary', DEFAULT_CONFIG);


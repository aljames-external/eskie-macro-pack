// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

const HOLOGRAM_TAG = 'Hologram';
const EFFECT_NAME = 'Holo';

export const DEFAULT_CONFIG = {
    id: 'Hologram',
    tint: '#cd2997',
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, tint } = mConfig;

    const tokenRotation = token.document.rotation || 0;

    const seq = new Sequence()
        .effect()
        .name(EFFECT_NAME)
        .copySprite(token)
        .atLocation(token)
        .attachTo(token, { followRotation: false, bindVisibility: false })
        .opacity(0.5)
        .persist()
        .aboveLighting()
        .loopProperty('spriteContainer', 'position.y', { from: 0, to: -10, duration: 2500, pingPong: true })
        .animateProperty('spriteContainer', 'rotation', { from: 0, to: tokenRotation, duration: 0 })
        .filter('ColorMatrix', { brightness: 1.5 })
        .scaleIn({ x: 0.75, y: 0 }, 100)
        .scaleOut({ x: 0.75, y: 0 }, 100)
        .tint(tint)

        .effect()
        .name(EFFECT_NAME)
        .file('https://i.imgur.com/DBMEF5B.png')
        .atLocation(token)
        .attachTo(token, { followRotation: false, bindVisibility: false })
        .scaleToObject()
        .persist()
        .opacity(0.5)
        .loopProperty('sprite', 'position.y', { from: 0, to: 20, duration: 200, pingPong: false, ease: 'linear' })
        .loopProperty('sprite', 'position.x', { from: -3, to: 3, duration: 1000, pingPong: false, ease: 'easeInOutElastic' })
        .loopProperty('spriteContainer', 'position.y', { from: 0, to: -10, duration: 2500, pingPong: true })
        .zeroSpriteRotation()
        .aboveLighting()
        .mask()
        .scaleIn({ x: 0.75, y: 0 }, 100)
        .scaleOut({ x: 0.75, y: 0 }, 100)
        .tint(tint);

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME, object: token });
}

export const hologram = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

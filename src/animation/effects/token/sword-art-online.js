import { shatterMask } from '../token-mask/shatter-mask.js';

const DEFAULT_CONFIG = {
    id: 'swordArtOnlineShatter',
    tintColor: '#00FFFF',
    duration: 1000,
    shatterColor: 'blue',
    deleteToken: false
};

async function create(source, config = {}) {
    const { id, tintColor, duration, shatterColor, deleteToken } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    let sequence = new Sequence()
        .animation()
        .on(source)
        .tint(tintColor)
        .fadeIn(duration)
        .duration(duration)
        .waitUntilFinished()
        .thenDo(async () => {
            const shatterSeq = await shatterMask.create(source, { color: shatterColor, tint: tintColor, deleteToken });
            if (shatterSeq) return shatterSeq.play();
        });

    return sequence;
}

async function play(source, config = {}) {
    const sequence = await create(source, config);
    if (sequence) return sequence.play();
}

async function stop(source, config = {}) {
    const { shatterColor, deleteToken } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return shatterMask.stop(source, { color: shatterColor, deleteToken });
}

export const swordArtOnlineDeath = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

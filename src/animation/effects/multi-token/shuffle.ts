import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

/* **
   Original Author: Gornetron (nefin)
   Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka
** */

const DEFAULT_CONFIG = {
    repeat: 0,
    delay: 1000,
    sendToCenter: false,
    destinationPoints: undefined,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

function create(targets: Token[], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    mConfig.destinationPoints = targets.map(t => adapter.getCenter(t));
    const { sendToCenter, destinationPoints, sound } = mConfig;

    if (targets.length !== destinationPoints.length)
        throw new Error(`User provided ${targets.length} targets but ${destinationPoints.length} destination points. Can not shuffle.`);

    const shuffle = destinationPoints.sort(() => Math.random() - 0.5);
    const shuffleSeq = new Sequence();
    applySound(shuffleSeq, sound);

    if (targets.length === 0) return shuffleSeq;

    if (sendToCenter) {
        let centerPoint = destinationPoints.reduce((acc: any, { x, y }: any) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
        centerPoint.x /= destinationPoints.length;
        centerPoint.y /= destinationPoints.length;
        for (const t of targets) {
            shuffleSeq.motion(t)
                .moveTo(centerPoint)
                .duration(1000);
        }
    }

    for (let i = 0; i < targets.length; i++) {
        shuffleSeq.motion(targets[i])
            .moveTo(shuffle[i])
            .delay(200)
            .duration(1000);
    }
    return shuffleSeq;
}

async function play(targets: Token[], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    mConfig.destinationPoints = targets.map(t => adapter.getCenter(t));
    const { repeat, delay, sendToCenter, destinationPoints } = mConfig;

    for (let i = 0; i <= repeat; i++) {
        let seq = create(targets, { sendToCenter, destinationPoints });
        if (delay > 0) seq = seq.wait(delay);
        if (seq) { await seq.play(); }
    }
}

export const shuffle = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
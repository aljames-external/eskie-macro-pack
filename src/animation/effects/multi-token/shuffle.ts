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

function create(targets?: Token | Token[], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const targetsList: Token[] = Array.isArray(targets)
        ? targets
        : (targets ? [targets as Token] : Array.from(game.user?.targets ?? []));

    if (!targetsList.length) return new Sequence();

    const destPoints = mConfig.destinationPoints ?? targetsList.map(t => adapter.getCenter(t));
    const { sendToCenter, sound } = mConfig;

    if (targetsList.length !== destPoints.length) {
        throw new Error(`User provided ${targetsList.length} targets but ${destPoints.length} destination points. Can not shuffle.`);
    }

    const shuffledPositions = destPoints.slice().sort(() => Math.random() - 0.5);
    const shuffleSeq = new Sequence();
    applySound(shuffleSeq, sound);

    if (sendToCenter) {
        let centerPoint = destPoints.reduce((acc: any, { x, y }: any) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
        centerPoint.x /= destPoints.length;
        centerPoint.y /= destPoints.length;
        for (const t of targetsList) {
            shuffleSeq.motion(t)
                .moveTo(centerPoint, { duration: 1000 });
        }
    }

    for (let i = 0; i < targetsList.length; i++) {
        shuffleSeq.motion(targetsList[i])
            .moveTo(shuffledPositions[i], { duration: 1000, delay: 200 });
    }
    return shuffleSeq;
}

async function play(targets?: Token | Token[], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const targetsList: Token[] = Array.isArray(targets)
        ? targets
        : (targets ? [targets as Token] : Array.from(game.user?.targets ?? []));

    if (!targetsList.length) return;

    const destPoints = mConfig.destinationPoints ?? targetsList.map(t => adapter.getCenter(t));
    const { repeat, delay, sendToCenter } = mConfig;

    for (let i = 0; i <= repeat; i++) {
        let seq = create(targetsList, { sendToCenter, destinationPoints: destPoints });
        if (delay > 0 && i < repeat) seq = seq.wait(delay);
        if (seq) { await seq.play(); }
    }
}

export const shuffle = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
/* **
   Original Author: Gornetron (nefin)
   Update Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    repeat: 0,
    delay: 1000,
    sendToCenter: false,
    destinationPoints: undefined,
};

function create(targets, config = {}) {
    targets = targets ? (Array.isArray(targets) ? targets : [targets]) : [];
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    mConfig.destinationPoints = targets?.map(t => ({ x: t.x, y: t.y })) ?? [];
    let { sendToCenter, destinationPoints } = mConfig;

    if (targets.length !== destinationPoints.length)
        throw `User provided ${targets.length} targets but ${destinationPoints.length} destination points. Can not shuffle.`;

    const shuffle = destinationPoints.sort(() => Math.random() - 0.5);
    const shuffleSeq = new Sequence();

    if (targets.length === 0) return shuffleSeq;

    if (sendToCenter) {
        let centerPoint = destinationPoints.reduce((acc, { x, y }) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
        centerPoint.x /= destinationPoints.length;
        centerPoint.y /= destinationPoints.length;
        for (let t of targets) {
            shuffleSeq.animation()
                .on(t)
                .moveTowards(centerPoint)
                .duration(1000);
        }
    }

    for (let i = 0; i < targets.length; i++) {
        shuffleSeq.animation()
            .on(targets[i])
            .moveTowards(shuffle[i])
            .delay(200)
            .duration(1000);
    }
    return shuffleSeq;
}

async function play(targets, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    mConfig.destinationPoints = targets?.map(t => ({ x: t.x, y: t.y })) ?? [];
    const {repeat, delay, sendToCenter} = mConfig;

    const destinationPoints = targets.map(target => ({ x: target.x, y: target.y }));
    for (let i = 0; i <= repeat; i++) {
        let seq = create(targets, {sendToCenter, destinationPoints});
        if (delay > 0) seq = seq.wait(delay);
        if (seq) { await seq.play(); }
    }
}

export const shuffle = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
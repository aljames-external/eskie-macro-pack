// Standalone Macro: Shuffle
// Original Author: Gornetron (nefin)
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Shuffle' macro requires the 'Sequencer' module to be installed and active!");
}

const targets = Array.from(game.user.targets);
if (targets.length < 2) {
    return ui.notifications.warn("Please target at least 2 tokens to shuffle their positions!");
}

const destinationPoints = targets.map((t) => ({ x: t.x, y: t.y }));
const shuffledPositions = destinationPoints.slice().sort(() => Math.random() - 0.5);

const sendToCenter = true;
const shuffleSeq = new Sequence();

if (sendToCenter) {
    const centerPoint = destinationPoints.reduce(
        (acc, { x, y }) => ({ x: acc.x + x, y: acc.y + y }),
        { x: 0, y: 0 }
    );
    centerPoint.x /= destinationPoints.length;
    centerPoint.y /= destinationPoints.length;

    for (const t of targets) {
        shuffleSeq.motion(t)
            .moveTo(centerPoint)
            .duration(800);
    }
}

for (let i = 0; i < targets.length; i++) {
    shuffleSeq.motion(targets[i])
        .moveTo(shuffledPositions[i])
        .delay(sendToCenter ? 200 : 0)
        .duration(1000);
}

await shuffleSeq.play();

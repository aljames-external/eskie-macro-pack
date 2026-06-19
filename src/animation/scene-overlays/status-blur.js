import { MODULE_TLA } from '../../lib/constants.js';

// Original author: Gornetron
// Updates by: Bakana

const DEFAULT_CONFIG = {
    id: 'drunken-blur',
    opacity: 1,
    blur: 3,
    sway: 1,
    durationX: 7000,
    durationY: 11000,
}

function create(users = [], config = {}){
    // Catch the case where we pass in an array of users
    // Preference of this create function is single users
    const seq = new Sequence();
    if (!canvas?.scene?.background?.src) {
        console.warn(`${MODULE_TLA} | canvas.scene.background.src not set. Background blurring failed`);
        return seq;
    }

    if (Array.isArray(users)) {
        users.forEach( u => { seq.addSequence(create(u, config)); });
        return seq;
    }

    const { id, opacity, blur, sway, durationX, durationY } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    const x = canvas.scene.dimensions.width / 2;
    const y = canvas.scene.dimensions.height / 2;
    const drift = (canvas.grid.size / 8) * sway;

    seq.effect()
            .name(`${id} - ${users.name}`)
            .file(canvas.scene.background.src)
            .atLocation({ x, y })
            .size({
                width: canvas.scene.dimensions.sceneWidth,
                height: canvas.scene.dimensions.sceneHeight
            })
            .belowTokens()
            .belowTiles()
            .filter("Blur", { blurX: blur, blurY: blur })
            .opacity(opacity)
            .loopProperty("spriteContainer", "position.x", { from: -drift, to: drift, duration: durationX, pingPong: true })
            .loopProperty("spriteContainer", "position.y", { from: -drift, to: drift, duration: durationY, pingPong: true })
            .forUsers(users.id)
            .persist()
    return seq;
}

async function play(users = [], config = {}) {
    const seq = create(users, config);
    if (seq) { seq.play(); }
}

function createDrunkBlur(users = []) {
    const seq = new Sequence();
    seq.addSequence(create(users, {opacity: 1.00, sway:  1.0, durationX:  6500, durationY: 11000}));
    seq.addSequence(create(users, {opacity: 0.57, sway: -0.9, durationX: 16500, durationY:  7000}));
    seq.addSequence(create(users, {opacity: 0.47, sway:  1.1, durationX: 13000, durationY: 10500}));
    return seq;
}

async function playDrunkBlur(users = []) {
    const seq = createDrunkBlur(users);
    if (seq) { seq.play(); }
}

async function stop(users = [], config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    if (Array.isArray(users))
        return Promise.all(users.map(user => Sequencer.EffectManager.endEffects({ name: `${id} - ${user.name}` })));
    else
        return Sequencer.EffectManager.endEffects({ name: `${id} - ${users.name}` });
}

export const blur = { 
    create,
    play,
    stop,
    drunk: {
        create: createDrunkBlur,
        play: playDrunkBlur,
        stop,
    },
};
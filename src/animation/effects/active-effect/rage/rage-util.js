const DEFAULT_CONFIG = {
    id : 'rage util',
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    let opacity = new Sequence()
        .animation()
        .on(token)
        .opacity(1);
    
    // End all effects associated with this rage
    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: label, object: token }),
        opacity.play()
    ]);
}

async function clean(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    return Promise.all([
        stop(token, config),
        Sequencer.EffectManager.endEffects({ name: `${label} - ground-crack` })
    ]);
}

function hexValue(color) {
    switch (color) {
        case "red": return "#FF0000";
        case "orange": return "#FF8800";
        case "yellow": return "#FFFF00";
        case "green": return "#00FF00";
        case "blue": return "#0000FF";
        case "purple": return "#FF00FF";
        
        case "dark_red": return "#600000";
        case "dark_orange": return "#603000";
        case "dark_yellow": return "#606000";
        case "dark_green": return "#005000";
        case "dark_blue": return "#000070";
        case "dark_purple": return "#3F003F";
        
        case "white": return "#FFFFFF";
        default: return "#FFFFFF";
    }
}

export const util = {
    stop,
    clean,
    hexValue
};
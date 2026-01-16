// Original Author: Unknown (from Discord animations)
// Modular Conversion: bakanabaka

import { utils } from '../../utils/utils.js';
import { file } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'DimensionDoor',
};

async function create(token, config = {}) {
    const { id, template } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    const cfg = { 
        radius: 1,
        max: 500,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Dimension Door'
    };
    let position = await utils.getPosition(template, cfg);
    if (!position) { return; }

    let sequence = new Sequence()
        .effect()
            .file(file("jb2a.fireball.beam.purple"))
            .atLocation(token)
            .stretchTo(position)
            .belowTokens()
            .playbackRate(3)
            .startTime(2200)
            .opacity(0.5)
            .zIndex(0)

        .effect()
            .file(file("jb2a.portals.vertical.ring.purple"))
            .atLocation(token)
            .rotateTowards(position)
            .belowTokens()
            .scaleOut(0, 400, {ease: "easeOutQuint"})
            .scale({ x:token.document.width / 2, y: token.document.height / 2 })
            .rotate(-90)
            .anchor({ x: 0.5, y: 0.8 })
            .duration(3000)
            .zIndex(1)

        .effect()
            .file(file("jb2a.portals.vertical.ring.purple"))
            .atLocation(position)
            .rotateTowards(token)
            .rotate(90)
            .duration(3000)
            .scaleOut(0, 400, {ease: "easeOutQuint"})
            .scale({ x:token.document.width / 2, y: token.document.height / 2 })
            .anchor({ x: 0.5, y: 0.2 })
            .mirrorY()
            .belowTokens()
            .zIndex(1)

        .effect()
            .file(file("jb2a.side_impact.part.slow.spiral.pinkpurple"))
            .atLocation(position)
            .scale({x:0.125, y:0.15})
            .playbackRate(1.75)
            .rotateTowards(token)
            .rotate(180)
            .anchor({ x: 0.9, y: 0.5 })

        .animation()
            .on(token)
            .teleportTo(position)
            .snapToGrid()
            .offset({ x: -1, y: -1 })
            .waitUntilFinished();
        
    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) {
        sequence.play();
    }
}

export const dimensionDoor = {
    create,
    play,
};

autoanimations.register("Dimension Door", "template", "eskie.effect.dimensionDoor", DEFAULT_CONFIG);

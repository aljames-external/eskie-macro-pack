/**
 * Original Author: .eskie
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { templates } from '../../../lib/templates.js';
import { settingsOverride } from '../../../lib/settings.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'lightningBolt',
    deleteTemplate: true,
    tintMap: true,
    sound: {
        enabled: true,
        volume: 0.5
    }
};

async function create(token, config = {}) {
    config = settingsOverride(config);
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, template, tintMap, sound } = mConfig;

    const cfg = { 
        radius: 1,
        max: 500,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: id
    };
    let [primary, secondary] = await templates.getPosition(template, cfg);
    if (primary.cancelled) { return; }
    if (!secondary) {
        secondary = primary;
        primary = token.center;
    }

    const sequence = new Sequence();

    sequence.sound()
        .file(closest(`psfx.3rd-level-spells.call-lightning.v1.secondary`))
        .volume(sound.volume)
        .playIf(sound.enabled);
    sequence.sound()
        .file(closest(`psfx.3rd-level-spells.call-lightning.v1.primary`))
        .volume(sound.volume)
        .delay(500)
        .playIf(sound.enabled);

    if (canvas.scene.background.src && tintMap){
        sequence.effect()
            .name(`Casting ${token.document.name}`)
            .file(canvas.scene.background.src)
            .filter("ColorMatrix", {saturate: 1, brightness: 0.6})
            .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
            .size({width:canvas.scene.width/canvas.grid.size, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
            .persist()
            .fadeIn(500)
            .fadeOut(3000)
            .tint("#9eecff")
            .belowTokens()
            .spriteOffset({x:-canvas.scene.background.offsetX,y:-canvas.scene.background.offsetY})
    };

    sequence.effect()
            .file(closest("jb2a.static_electricity.01.blue"))
            .atLocation(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(1.5)
            .duration(5000)
            .mask()
            .zIndex(2)

        .effect()
            .file(closest("eskie.lightning.02.blue"))
            .atLocation(token)
            .rotateTowards(secondary)
            .size({width:2, height:1.8}, {gridUnits:true})
            .spriteOffset({x:-0.25}, {gridUnits:true})
            .spriteScale({x:1.25})
            .filter("ColorMatrix", {hue:-12, saturate:2 })
            .zIndex(1)
            .waitUntilFinished()
        
        .effect()
            .file(closest("eskie.lightning.03.blue"))
            .atLocation(token)
            .rotateTowards(secondary)
            .size({width:2, height:1.8}, {gridUnits:true})
            .spriteOffset({x:-0.5}, {gridUnits:true})
            .spriteScale({x:1.25})
            .filter("ColorMatrix", {hue:-12, saturate:2 })
            .rotate(180)
            .zIndex(2)
        
        .canvasPan()
            .shake({ duration: 500, strength: 1.5, rotation: false, fadeOut: 250 })
        
        .effect()
            .file(closest("eskie.lightning.lightning_bolt.blue"))
            .atLocation(primary)
            .stretchTo(secondary, {tiling: false, onlyX: true})
            .filter("ColorMatrix", {hue:-12, saturate:2 })
            .zIndex(3)
            .waitUntilFinished(-250)
        
        .thenDo(function(){
            Sequencer.EffectManager.endEffects({ name: `Casting ${token.document.name}`});
        })
        
        .effect()
            .file(closest("eskie.lightning.04.blue"))
            .atLocation(token)
            .rotateTowards(secondary)
            .size({width:1.2, height:1}, {gridUnits:true})
            .spriteScale({x:1.25})
            .filter("ColorMatrix", {hue:-12, saturate:2 })
            .zIndex(1);
        
    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);    
    if (sequence) return sequence.play({preload:true});
}

export const lightningBolt = {
    play,
    create,
};

autoanimations.register("Lightning Bolt", "template", "eskie.effect.lightningBolt", DEFAULT_CONFIG);

// Original Author: ...
// Modular Conversion: ...

import { closest } from '../../../lib/filemanager.js';
import { templates } from '../../../lib/templates.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'TemplateEffectName',
    targets: [],
};

async function create(source, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    
    // 1. Template Position Extraction
    // Always prioritize the provided template position over Sequencer.Crosshair
    let position;
    if (mConfig.template) {
        // For lines/cones/rays, use the far point. For circles, use { x: mConfig.template.x, y: mConfig.template.y }
        let farpoint = mConfig.template._object?.ray?.B || mConfig.template.ray?.B;
        if (farpoint) {
            position = { x: farpoint.x, y: farpoint.y };
        } else {
            position = { x: mConfig.template.x, y: mConfig.template.y };
        }
    } else {
        // Fallback if no template is provided
        position = await Sequencer.Crosshair.show();
        if (position.cancelled) return;
    }

    const sequence = new Sequence();

    // 2. Base Cast / Template Animation
    const castSeq = new Sequence()
        .effect()
            .file(closest('...'))
            .atLocation(source)
            // If line/cone, rotate towards the position we just found
            .rotateTowards(position);
            
    sequence.addSequence(castSeq);

    // 3. Concurrent Multi-Target Animation
    // Safely extract targets from the config (provided by wrappers/AA) or fallback to game.user.targets
    let targets = mConfig.targets?.length ? mConfig.targets : Array.from(game.user.targets);

    for (let target of targets) {
        // IMPORTANT: Create a NEW isolated Sequence for each target so `.wait()` delays 
        // run concurrently, rather than stacking cumulatively across all targets!
        let targetSeq = new Sequence()
            .wait(1000) // Concurrent delay before hitting this target
            .effect()
                .file(closest('...'))
                .atLocation(target);
                
        sequence.addSequence(targetSeq);
    }

    return sequence;
}

async function play(source, config = {}) {
    const sequence = await create(source, config);
    if (sequence) return sequence.play();
}

async function stop(source, config = {}) {
    // If the template effect persists on targets, stop them here
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    let targets = mConfig.targets?.length ? mConfig.targets : Array.from(game.user.targets);
    for (let target of targets) {
        Sequencer.EffectManager.endEffects({ name: `${target.document.name}TemplateEffectName`, object: target });
    }
}

// 4. Root Method Requirement
// Template effects MUST export .create and .play at the root level of the object!
export const templateName = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

// Register with "template" trigger
autoanimations.register("Template Name", "template", "eskie.effect.templateName", DEFAULT_CONFIG, '0.1.0');

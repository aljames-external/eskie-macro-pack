/**
 * meteor-strike.js
 * 
 * Original Author: .tranquilite.
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { positions as posUtil } from '../../utils/positions.js';

const DEFAULT_CONFIG = {
    showMarkers: true,
    hideFromPlayers: true,
    markerNamePrefix: 'MeteorStrikeMarker',
};

async function create(source, config = {}) {
    config = settingsOverride(config);
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { showMarkers, markerNamePrefix } = mConfig;

    let positions = config.positions;

    if (!positions || !positions.length) {
        positions = await posUtil.selectMultiple(mConfig);
    }

    if (!positions || positions.length === 0) return null;

    const sequence = new Sequence();

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const isFirst = i === 0;
        const isLast = i === positions.length - 1;
        const markerName = `${markerNamePrefix}${i + 1}`;

        // Clear marker if it exists
        if (showMarkers) {
            sequence.thenDo(() => {
                posUtil.clearMarker(markerName);
            });
        }

        let fireScale = 0.3;
        if (isFirst) fireScale = 0.5;
        if (isLast) fireScale = 0.75;

        // First Meteor 0 - 200ms
        // Second Meteor 300 - 500ms
        // Third Meteor 600 - 800ms etc
        const meteorDelay = 300 * i + Math.random() * 200;

        // Primary fire effect
        sequence.effect()
            .file(closest('blfx.spell.cast.swirl1.fire1.orange'))
            .atLocation(pos)
            .scale(fireScale)
            .delay(meteorDelay)

        // Explosion effect for subsequent strikes
        if (!isFirst) {
            sequence.effect()
                .file(closest('jb2a.explosion.01.orange'))
                .atLocation(pos)
                .scale(isLast ? 1.0 : 0.75)
                .delay(meteorDelay);
        }

        // Smoke effect
        sequence.effect()
            .file(closest('eskie.smoke.03.white'))
            .atLocation(pos)
            .fadeIn(300)
            .fadeOut(300)
            .delay(1400 + meteorDelay);
    }

    return sequence;
}

async function play(source, config = {}) {
    const sequence = await create(source, config);
    if (sequence) return sequence.play();
}

function stop(source, config = {}) {
    // This animation is a one-shot sequence
}

export const meteorStrike = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

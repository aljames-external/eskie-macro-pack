/**
 * Utility to prompt the user to select multiple locations on the canvas, 
 * optionally placing persistent numbered markers at each location.
 */

const DEFAULT_POSITION_CONFIG = {
    markerFile: 'jb2a.token_border.circle.static.blue.001',
    markerScale: 0.5,
    markerNamePrefix: 'Marker',
    showMarkers: true,
    hideFromPlayers: true,
    textStyle: {
        fontSize: 80,
        strokeThickness: 4,
        fill: 'white',
        stroke: '#bddbe8'
    },
    crosshair: {
        label: { text: 'Select Point', dx: 0, dy: 50 },
    }
};

async function selectMultiple(config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_POSITION_CONFIG, config, { inplace: false });

    const {
        markerFile,
        markerScale,
        markerNamePrefix,
        showMarkers,
        hideFromPlayers,
        textStyle,
        crosshair
    } = mergedConfig;

    const positions = [];
    ui.notifications.info('Click to select positions. Right-click or press Escape to finish.');

    let index = 0;
    while (true) {
        let cross = await Sequencer.Crosshair.show(crosshair);

        if (!cross || cross.cancelled) break;
        positions.push(cross);
        index++;

        if (showMarkers) {
            let marker = new Sequence()
                .effect()
                .file(markerFile)
                .scale(markerScale)
                .opacity(1)
                .atLocation(cross)
                .persist()
                .name(`${markerNamePrefix}${index}`)
                .text(`${index}`, textStyle);

            if (hideFromPlayers) {
                marker.forUsers(game.users.filter(u => u.isGM));
            }
            marker.play();
        }
    }

    if (positions.length === 0) {
        ui.notifications.warn('No positions were selected.');
        return null;
    }

    return positions;
}

/**
 * Clears persistent markers created by selectMultiple.
 * 
 * @param {string} [prefix='Marker'] The prefix used when creating the markers.
 */
async function clearMarkers(prefix = 'Marker') {
    const effects = Sequencer.EffectManager.getEffects().filter(e => e.data.name?.startsWith(prefix));
    return Sequencer.EffectManager.endEffects({ effects });
}

/**
 * Clears a specific marker by its exact name.
 * 
 * @param {string} name The exact name of the marker effect.
 */
async function clearMarker(name) {
    return Sequencer.EffectManager.endEffects({ name });
}

export const positions = {
    selectMultiple,
    clearMarkers,
    clearMarker,
};

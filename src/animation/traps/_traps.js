import { dialog } from '../../lib/dialog.js';

// import { bullRushStatue } from './bull-rush-statue.js';
// import { electricDoor } from './electric-door.js';
// import { fallingRocks } from './falling-rocks.js';
import { fire } from './fire.js';
// import { floodingRoom } from './flooding-room.js';
import { pitfall } from './pitfall.js';
import { projectile } from './projectile.js';
// import { rollingBoulder } from './rolling-boulder.js';
import { spike } from './spike.js';

export const traps = {
    // bullRushStatue,
    // electricDoor,
    // fallingRocks,
    fire,
    // floodingRoom,
    pitfall,
    projectile,
    // rollingBoulder,
    spike,

    setup: async function (config = {}) {
        const activeTrapKeys = Object.keys(traps).filter(key => key !== 'setup');
        const buttons = activeTrapKeys.map(key => {
            const locKey = `EMP.traps.${key}.title`;
            const hasLoc = game.i18n.has(locKey);
            const label = hasLoc ? game.i18n.localize(locKey) : key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
            return { label, value: key };
        });

        const chosenTrapKey = await dialog.buttonDialog({
            title: game.i18n.localize('EMP.traps.setup.chooseTrapTitle'),
            buttons: buttons,
        }, {
            classes: ['emp-vertical-dialog'],
            content: game.i18n.localize('EMP.traps.setup.chooseTrapContent')
        });

        if (!chosenTrapKey) {
            ui.notifications.warn(game.i18n.localize('EMP.traps.setup.noTrapChosen'));
            return;
        }

        const trap = traps[chosenTrapKey];
        if (trap && typeof trap.setup === 'function') {
            return trap.setup(config);
        } else {
            ui.notifications.error(game.i18n.format('EMP.traps.setup.noSetupMethod', { name: chosenTrapKey }));
        }
    }
};
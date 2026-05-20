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
            const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
            return { label, value: key };
        });

        const chosenTrapKey = await dialog.buttonDialog({
            title: 'Trap Setup: Choose Trap',
            buttons: buttons,
        }, {
            classes: ['emp-vertical-dialog'],
            content: '<p>Choose a trap to configure and set up on the canvas.</p>'
        });

        if (!chosenTrapKey) {
            ui.notifications.warn('EMP | No trap chosen. Setup cancelled.');
            return;
        }

        const trap = traps[chosenTrapKey];
        if (trap && typeof trap.setup === 'function') {
            return trap.setup(config);
        } else {
            ui.notifications.error(`EMP | Trap "${chosenTrapKey}" has no setup configuration method.`);
        }
    }
};
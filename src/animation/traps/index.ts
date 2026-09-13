import { adapter } from '../../adapters/index.js';
import { localize, format } from '../../lib/utils.js';
import { setupTrap, executeTrapEffect, playEffectAsTrap, createCasterProxy } from './trap-manager.js';

import { bullRushStatue } from './bull-rush-statue.js';
import { electricDoor } from './electric-door.js';
import { fallingRocks } from './falling-rocks.js';
import { fire } from './fire.js';
import { floodingRoom } from './flooding-room.js';
import { pitfall } from './pitfall.js';
import { fallingSky } from './falling-sky.js';
import { projectile } from './projectile.js';
import { rollingBoulder } from './rolling-boulder.js';
import { spike } from './spike.js';

const NON_TRAP_KEYS = new Set(['setup', 'setupTrap', 'executeTrapEffect', 'playEffectAsTrap', 'createCasterProxy']);

// High level setup function to select between different traps to configure
async function setup (config: Record<string, unknown> = {}): Promise<any> {
    const activeTrapKeys = Object.keys(traps).filter(key => !NON_TRAP_KEYS.has(key));
    const buttons = activeTrapKeys.map(key => {
        const fallback = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        const label = localize(`EMP.traps.name.${key}`, fallback);
        return { label, value: key };
    });

    const chosenTrapKey = await adapter.buttonDialog({
        title: localize('EMP.traps.setup.chooseTrapTitle'),
        buttons: buttons,
    }, {
        classes: ['emp-vertical-dialog'],
        content: localize('EMP.traps.setup.chooseTrapContent')
    });

    if (!chosenTrapKey) {
        ui.notifications.warn(localize('EMP.traps.setup.noTrapChosen'));
        return;
    }

    const trap = (traps as Record<string, any>)[chosenTrapKey as string];
    if (trap?.setup) {
        return trap.setup(config);
    } else {
        ui.notifications.error(format('EMP.traps.setup.noSetupMethod', { name: chosenTrapKey }));
    }
}

export const traps = {
    bullRushStatue,
    electricDoor,
    fallingRocks,
    fire,
    floodingRoom,
    pitfall,
    fallingSky,
    projectile,
    rollingBoulder,
    spike,

    setup,
    setupTrap,
    executeTrapEffect,
    playEffectAsTrap,
    createCasterProxy,
};
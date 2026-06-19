import { MODULE_ID } from "./lib/constants.js";
import { autorecUpdateFormApplication } from "./integration/autoanimations/updateMenu.js";
import { WorldScriptsFormApplication } from "./world-scripts/worldScriptsMenu.js";

/* Initialize Module Settings */
Hooks.once('init', function() {
    console.log('EMP | Initializing Eskie Macro Pack settings');

    // World Scripts Configuration Menu
    game.settings.registerMenu(MODULE_ID, 'worldScripts', {
        name: 'EMP.settings.worldScripts.name',
        label: 'EMP.settings.worldScripts.label',
        icon: 'fa-solid fa-code',
        type: WorldScriptsFormApplication,
        restricted: true
    });

    game.settings.registerMenu(MODULE_ID, 'autorecUpdate', {
        name: 'EMP.settings.autorecUpdate.name',
        label: 'EMP.settings.autorecUpdate.label',
        icon: 'fa-solid fa-wrench',
        type: autorecUpdateFormApplication,
        restricted: true
    });

    game.settings.register(MODULE_ID, 'enableSounds', {
        name: 'EMP.settings.enableSounds.name',
        hint: 'EMP.settings.enableSounds.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(MODULE_ID, 'worldScriptsConfig', {
        scope: 'world',
        config: false,
        type: Object,
        default: {
            eskieRollAnimation: false
        }
    });

    game.settings.register(MODULE_ID, 'autorecVersion', {
        scope: 'world',
        config: false,
        type: String,
        default: '0.0.0',
    });

    // Spawning blank actor name setting config
    game.settings.register(MODULE_ID, 'blankActorName', {
        name: 'EMP.settings.blankActorName.name',
        hint: 'EMP.settings.blankActorName.hint',
        scope: 'world',
        config: true,
        type: String,
        default: 'EMP Blank Actor',
    });
});
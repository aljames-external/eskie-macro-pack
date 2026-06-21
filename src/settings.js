import { MODULE_ID } from "./lib/constants.js";
import { autorecUpdateFormApplication } from "./integration/autoanimations/updateMenu.js";
import { WorldScriptsFormApplication } from "./world-scripts/worldScriptsMenu.js";
import { log } from './lib/logger.js';

/* Initialize Module Settings */
Hooks.once('init', function() {
    log.info('Initializing Eskie Macro Pack settings');

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
            rollAnimation: false
        }
    });

    game.settings.register(MODULE_ID, 'autorecVersion', {
        scope: 'world',
        config: false,
        type: String,
        default: '0.0.0',
    });

    // Log Verbosity Level Setting
    game.settings.register(MODULE_ID, 'logVerbosity', {
        name: 'EMP.settings.logVerbosity.name',
        hint: 'EMP.settings.logVerbosity.hint',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'error': 'EMP.settings.logVerbosity.choices.error',
            'warn': 'EMP.settings.logVerbosity.choices.warn',
            'info': 'EMP.settings.logVerbosity.choices.info',
            'debug': 'EMP.settings.logVerbosity.choices.debug'
        },
        default: 'warn'
    });
});
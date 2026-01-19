import { MODULE_ID } from "./lib/constants.js";
import { autorecUpdateFormApplication } from "./integration/autoanimations/updateMenu.js";

/* Initialize Module Settings */
Hooks.once('init', function() {
    console.log('EMP | Initializing Eskie Macro Pack settings');

    game.settings.registerMenu(MODULE_ID, 'autorecUpdate', {
        name: game.i18n.localize('EMP.settings.autorecUpdate.name'),
        label: game.i18n.localize('EMP.settings.autorecUpdate.label'),
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

    game.settings.register(MODULE_ID, 'autorecVersion', {
        scope: 'world',
        config: false,
        type: String,
        default: '0.0.0',
    });
});
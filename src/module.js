import { dependency } from './lib/dependency.js';
import { animation } from './animation/_animation.js';
import { file } from './lib/filemanager.js';
import { crosshair } from './crosshair/_crosshairs.js';
import { autoanimations } from './integration/autoanimations.js';
import { socketlibapi } from './integration/socketlib.js';
import { tile } from './integration/socketlib/tile.js'
// Import module settings to also run its initialization code
import './settings.js';

/**
 * Removes a previously exported function or variable and exports the specifed function or variable if the macro is active.
 *
 * @param {array} exportedIdentifierName the array of exported functions to be merged
 */
function setupApiCalls(exportedFunctions) {
    globalThis.eskie = foundry.utils.mergeObject(
        globalThis.eskie ?? {},
        exportedFunctions
    );
}

/**
 * Initializes the environment with macroUtil for macros
 */
function setupModule() {
    // Setup dependency API
    setupApiCalls( animation );
    setupApiCalls({ util:
                        {
                            file: file,
                            tile: tile,
                        }
                    });
}

Hooks.once('init', async () => {
    setupModule();
    console.log('EMP | Eskie Macro Pack module ready');
});

Hooks.once('aa.ready', async () => { await autoanimations.submit(); });
Hooks.once('socketlib.ready', async () => { await socketlibapi.register(); });
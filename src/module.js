import { animation } from './animation/_animation.js';
import { autoanimations } from './integration/autoanimations.js';
import { socketlibapi } from './integration/socketlib.js';
import { dialog } from './lib/dialog.js';
import { file } from './lib/filemanager.js';
import { time } from './lib/time.js';
import { tokens as token } from './lib/tokens.js';
import { socket } from './integration/socketlib.js';
import { loadWorldScripts } from './world-scripts/loader.js';
import { crosshair } from './crosshair/_crosshairs.js';
import { debug } from './lib/debug.js';
import { MODULE_TLA } from './lib/constants.js';

// Import module settings to also run its initialization code
import './settings.js';

const status = {
    aaReady: false,
    ready: false,
}

Hooks.once('init', async () => {
    function setupModule() {
        function setupApiCalls(exportedFunctions) {
            globalThis.eskie = foundry.utils.mergeObject(
                globalThis.eskie ?? {},
                exportedFunctions
            );
        }

        const { door, tile, token: socketToken } = socket;

        const util = {
                        dialog,
                        file,
                        time,
                        token: {
                            ...token,
                            ...socketToken,
                        },
                        door,
                        tile,
                        crosshair,
                    };

        // Setup dependency API
        setupApiCalls( animation );
        setupApiCalls({ util });
        setupApiCalls({ debug });

        // Alias eskie.utils to eskie.util for backward compatibility
        globalThis.eskie.utils = globalThis.eskie.util;
    }

    setupModule();
    console.log(`${MODULE_TLA} | Eskie Macro Pack module ready`);
});

Hooks.once('ready', async () => {
    status.ready = true;
    if (status.ready && status.aaReady)
        await autoanimations.submit();

    // Load enabled world scripts for the player
    loadWorldScripts();
});

Hooks.once('aa.ready', async () => {
    status.aaReady = true;
    if (status.ready && status.aaReady)
        await autoanimations.submit();
});

Hooks.once('socketlib.ready', async () => { await socketlibapi.register(); });
import { animation } from './animation/_animation.js';
import { autoanimations } from './integration/autoanimations.js';
import { socketlibapi } from './integration/socketlib.js';
import { file } from './lib/filemanager.js';
import { tile } from './integration/socketlib/tile.js'
import { time } from './lib/time.js';
import { tokens as token } from './lib/tokens.js';

// Import module settings to also run its initialization code
import './settings.js';

Hooks.once('init', async () => {
    function setupModule() {
        function setupApiCalls(exportedFunctions) {
            globalThis.eskie = foundry.utils.mergeObject(
                globalThis.eskie ?? {},
                exportedFunctions
            );
        }

        const util = {
                        file,
                        tile,
                        time,
                        token,
                    };

        // Setup dependency API
        setupApiCalls( animation );
        setupApiCalls({ util });
    }

    setupModule();
    console.log('EMP | Eskie Macro Pack module ready');
});

Hooks.once('ready', async () => {
    Hooks.once('aa.ready', async () => { await autoanimations.submit(); });
});

Hooks.once('aa.ready', async () => {
    Hooks.once('ready', async () => { await autoanimations.submit(); });
});

Hooks.once('socketlib.ready', async () => { await socketlibapi.register(); });
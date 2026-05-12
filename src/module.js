import { animation } from './animation/_animation.js';
import { autoanimations } from './integration/autoanimations.js';
import { socketlibapi } from './integration/socketlib.js';
import { dialog } from './lib/dialog.js';
import { file } from './lib/filemanager.js';
import { time } from './lib/time.js';
import { tokens as token } from './lib/tokens.js';
import { socket } from './integration/socketlib.js';

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

        const util = {
                        dialog,
                        file,
                        time,
                        token,
                    };

        // Setup dependency API
        setupApiCalls( animation );
        setupApiCalls({ util });
        setupApiCalls( socket );
    }

    setupModule();
    console.log('EMP | Eskie Macro Pack module ready');
});

Hooks.once('ready', async () => {
    status.ready = true;
    if (status.ready && status.aaReady)
        await autoanimations.submit();
});

Hooks.once('aa.ready', async () => {
    status.aaReady = true;
    if (status.ready && status.aaReady)
        await autoanimations.submit();
});

Hooks.once('socketlib.ready', async () => { await socketlibapi.register(); });
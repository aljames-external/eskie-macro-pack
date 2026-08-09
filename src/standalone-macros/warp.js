// Standalone Macro: Warp (Toggle: Warp Out / Warp In)
// Uses Eskie Warp Token Mask
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const id = 'WarpTokenMask';
const label = `${id} - ${token.id}`;

const isHidden = (token.document?.opacity ?? 1) === 0 || !(token.document?.visible ?? true);
const hasActiveMask = Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
    Boolean(token.document?.getFlag?.('eskie-macros', 'token-masks'));

const isWarpedOut = isHidden || hasActiveMask;

const config = {
    color: "purple", // "purple", "red", "white"
    deleteObject: false
};

if (typeof eskie !== "undefined" && eskie.mask?.warp) {
    if (isWarpedOut) {
        await eskie.mask.warp.stop(token, config);
    } else {
        await eskie.mask.warp.play(token, config);
    }
} else {
    const macroApi = game.modules.get("eskie-macros")?.api;
    if (macroApi?.mask?.warp) {
        if (isWarpedOut) {
            await macroApi.mask.warp.stop(token, config);
        } else {
            await macroApi.mask.warp.play(token, config);
        }
    } else {
        ui.notifications.error("Eskie Macro Pack warp mask module is not loaded.");
    }
}

const OPTIONS_DEFAULT = {
    position: { width: 300 }
}

/**
 * Displays a button-choice dialog using Foundry's native AppV2 DialogV2.
 * Drop-in replacement for the deprecated warpgate.buttonDialog().
 *
 * @param {{ buttons: {label: string, value: any}[], title?: string }} buttonData
 * @param {object} [options={}]   Extra options forwarded to DialogV2.wait()
 * @returns {Promise<string|false>}  The chosen button's value as a string, or false on cancel.
 *
 * NOTE: Unlike warpgate.buttonDialog, button values are always resolved as strings.
 * For example, a button with value 1 will resolve to the string '1', not the number 1.
 */
async function buttonDialog(buttonData, options = {}) {
    const opt = foundry.utils.mergeObject(OPTIONS_DEFAULT, options, { inplace: false });
    const buttons = buttonData.buttons.map(btn => ({
        label: btn.label,
        action: String(btn.value),
        default: false,
    }));

    // DialogV2.wait resolves with the action string of the pressed button,
    // or null if the window is closed without pressing anything.
    const result = await foundry.applications.api.DialogV2.wait({
        window: { title: buttonData.title ?? 'Choose an Option' },
        buttons,
        rejectClose: false,
        ...opt,
    });

    if (result === null) return false;
    return result;
}

export const dialog = { buttonDialog };

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

const NON_TRAP_KEYS = new Set(['setup', 'executeTrapEffect', 'playEffectAsTrap', 'createCasterProxy']);

// High level setup function to select between different traps to configure
async function setup(
    animationOrConfig: string | Record<string, unknown> = {},
    config: Record<string, unknown> = {}
): Promise<any> {
    // 1. Direct invocation with an animation string: eskie.traps.setup('eskie.effect.fireball', config)
    if (typeof animationOrConfig === 'string') {
        return setupTrap(animationOrConfig, config);
    }

    // 2. Direct invocation with config containing animation or effect: eskie.traps.setup({ animation: 'eskie.effect.fireball' })
    const resolvedConfig = (typeof animationOrConfig === 'object' && animationOrConfig !== null)
        ? { ...animationOrConfig, ...config }
        : { ...config };

    if (resolvedConfig.animation && typeof resolvedConfig.animation === 'string') {
        const { animation, ...trapOptions } = resolvedConfig;
        return setupTrap(animation, trapOptions);
    }
    if (resolvedConfig.effect && typeof resolvedConfig.effect === 'string') {
        const { effect, ...trapOptions } = resolvedConfig;
        return setupTrap(effect, trapOptions);
    }

    // 3. Interactive selection dialog
    const activeTrapKeys = Object.keys(traps).filter(key => !NON_TRAP_KEYS.has(key));
    const buttons = activeTrapKeys.map(key => {
        const fallback = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        const label = localize(`EMP.traps.name.${key}`, fallback);
        return { label, value: key };
    });

    // Add option for Spell / Custom Animation Effect
    buttons.push({
        label: localize('EMP.traps.name.customEffect', 'Spell / Animation Effect'),
        value: 'customEffect'
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

    if (chosenTrapKey === 'customEffect') {
        const dialogCls = adapter.foundry.DialogV2 ?? (foundry as any)?.applications?.api?.DialogV2;
        let chosenAnimation: string | null = null;
        if (dialogCls?.prompt) {
            chosenAnimation = await dialogCls.prompt({
                window: { title: localize('EMP.traps.setup.customEffectTitle', 'Trap Setup: Spell / Animation Effect') },
                content: `<p>${localize('EMP.traps.setup.customEffectPrompt', 'Enter the spell or animation effect path (e.g. fireball, lightningBolt, disintegrate):')}</p><div class="form-group"><input type="text" name="effectPath" autofocus style="width: 100%;" placeholder="fireball" /></div>`,
                ok: {
                    label: localize('EMP.traps.common.continue', 'Continue'),
                    callback: (_event: any, button: any) => {
                        const input = (button.form ?? button.element)?.querySelector?.('input[name="effectPath"]');
                        const val = input?.value?.trim();
                        return Boolean(val) ? val : null;
                    }
                },
                rejectClose: false
            });
        }
        if (!chosenAnimation) {
            ui.notifications.warn(localize('EMP.traps.setup.noTrapChosen'));
            return;
        }

        const resolvedAnimation = chosenAnimation.startsWith('eskie.')
            ? chosenAnimation
            : `eskie.effect.${chosenAnimation}`;
        return setupTrap(resolvedAnimation, resolvedConfig);
    }

    const trap = (traps as Record<string, any>)[chosenTrapKey as string];
    if (trap?.setup) {
        return trap.setup(resolvedConfig);
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
    executeTrapEffect,
    playEffectAsTrap,
    createCasterProxy,
};
import { closest, absolutePath } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';

const DEFAULT_CONFIG = {
    id: 'Psychic Teleportation',
    position: undefined,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, config: any = {}) {
    config = settingsOverride(config);
    const { id, template, sound, position: configPos } = adapter.mergeObject(DEFAULT_CONFIG, config);

    let position = configPos;
    if (!position) {
        const cfg = { 
            radius: 1,
            max: 500,
            icon: absolutePath("jb2a.portals.vertical.vortex.purple"), 
            label: id
        };
        let [pos, _] = await templatelib.getPosition(template, cfg);
        if (!pos || pos.cancelled) { return; }
        position = pos;
    }

    let seq = new Sequence();
    applySound(seq, sound);

    seq.effect()
            .name(id)
            .file(closest("jb2a.dagger.throw.01.white"))
            .atLocation(token)
            .stretchTo(position)
            .filter("ColorMatrix", {saturate:-1, brightness:5})
            .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
            .opacity(0.9)
            .duration(1000)

        .effect()
            .file(closest("jb2a.impact.010.blue"))
            .atLocation(token)
            .scaleToObject(2)
            .scaleOut(0, 250)
            .randomRotation()

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .filter("ColorMatrix", {saturate: 1, brightness:5})
            .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .scaleIn(0.25, 250)
            .fadeOut(2500)
            .duration(3000)

        .effect()
            .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
            .atLocation(token)
            .scaleToObject(1.25)
            .opacity(0.25)

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .atLocation(token)
            .scaleToObject(1.25)
            .filter("ColorMatrix", {saturate: -1, brightness:10})
            .opacity(0.25)
            .fadeOut(500)

        .motion(token)
            .moveTo(position, { duration: 500, offset: { x: -1, y: -1 } })

        .wait(1000)

        .thenDo(function(){
                Sequencer.EffectManager.endEffects({ name: id, object: token });
            })

        .effect()
            .file(closest("jb2a.impact.010.blue"))
            .atLocation(token)
            .scaleToObject(2)
            .scaleIn(0, 250)
            .randomRotation()

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .filter("ColorMatrix", { saturate: 1, brightness: 5 })
            .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .scaleIn(0.25, 250)
            .fadeOut(2500)
            .duration(3000)

        .effect()
            .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
            .atLocation(token)
            .scaleToObject(1.25)
            .opacity(0.25)

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .atLocation(token)
            .scaleToObject(1.25)
            .filter("ColorMatrix", { saturate: -1, brightness: 10 })
            .opacity(0.25)
            .fadeOut(500)

        .waitUntilFinished(-400);

    return seq;
}

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token: Token, config: any = {}) {
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const psychicTeleportation = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("psychicTeleportation", "template", "eskie.effect.psychicTeleportation", DEFAULT_CONFIG, "0.0.2", "Psychic Teleportation");
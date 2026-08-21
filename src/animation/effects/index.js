import { warn } from '../../lib/warnings.js';

import { aerodyneVehicle } from './token/aerodyne-vehicle.js';
import { animateDead } from './target/animate-dead.js';
import { armorOfAgathys } from './target/armor-of-agathys/index.js';
import { armsOfHadar } from './template/arms-of-hadar.js';
import { banishment } from './active-effect/banishment.js';
import { benignTransportation } from './on-target/benign-transportation.js';
import { blastLock } from './template/blast-lock.js';
import { bless } from './active-effect/bless.js';
import { blurredVision } from './active-effect/blurred-vision.js';
import { burnMask } from '../mask/burn-mask.js';
import { call } from './token/call.js';
import { curseOfTheWerewolf } from './token/curse-of-the-werewolf.js';
import { callLightning } from './token/call-lightning.js';
import { chainLightningPrims } from './token/chain-lightning-prims.js';
import { channelDivinityControlUndead } from './target/channelDivinityControlUndead.js';
import { channelDivinityDreadAspect } from './token/channelDivinityDreadAspect.js';
import { charmed } from './active-effect/charmed.js';
import { chromaticOrb } from './on-target/chromatic-orb.js';
import { cloudOfSand } from './multi-token/cloudOfSand.js';
import { colorSpray } from './template/color-spray.js';
import { dash } from './active-effect/dash.js';
import { detect, eyesOfTheGrave } from './token/detect/index.js';
import { dimensionDoor } from './template/dimension-door.js';
import { disintegrate } from './target/disintegrate.js';
import { divineSmite } from './on-target/divine-smite.js';
import { divineStrike } from './target/divine-strike.js';
import { drainingKiss } from './on-target/draining-kiss.js';
import { drainingTouch } from './target/drainingTouch.js';
import { dreadLord } from './token/dreadLord.js';
import { dreadLordAttack } from './target/dreadLordAttack.js';
import { dreadLordFear } from './target/dreadLordFear.js';
import { drunk } from './active-effect/drunk.js';
import { emote } from './emote/index.js';
import { enlargeReduce } from './active-effect/enlarge-reduce.js';
import { entangle } from './template/entangle.js';
import { eyesOfNight } from './target/eyesOfNight.js';
import { faerieFire } from './template/faerie-fire.js';
import { farStep } from './token/far-step.js';
import { fightingSpirit } from './active-effect/fighting-spirit.js';
import { fingerOfDeath } from './target/fingerOfDeath.js';
import { fireBlast } from './target/fire-blast.js';
import { firecracker } from './template/firecracker.js';
import { fireShield } from './active-effect/fire-shield.js';
import { flurryOfBlows } from './on-target/flurry-of-blows.js';
import { fly } from './token/fly.js';
import { frightfulMoan } from './token/frightful-moan.js';
import { gate } from './template/gate.js';
import { ghostWalk } from './token/ghost-walk.js';
import { goodberry } from './token/goodberry.js';
import { grapple } from './on-target/grapple.js';
import { grease } from './template/grease.js';
import { guidingBolt } from './target/guiding-bolt.js';
import { hacking } from './token/hacking.js';
import { haloOfSpores } from './aura/halo-of-spores.js';
import { hookAndPull } from './token/hook-and-pull.js';
import { healingWord } from './on-target/healing-word.js';
import { hex } from './on-target/hex/index.js';
import { hide } from './active-effect/hide.js';
import { hitTheDirt } from './template/hit-the-dirt.js';
import { hologram } from './token/hologram.js';
import { iaijutsuStrike } from './token/iaijutsu-strike.js';
import { incorporeal } from './token/incorporeal/incorporeal.js';
import { keeperOfSouls } from './on-target/keeper-of-souls.js';
import { leap } from './token/leap.js';
import { levitation } from './active-effect/levitation.js';
import { lightningBolt } from './template/lightning-bolt.js';
import { magicMissile } from './on-target/magic-missile.js';
import { maxtacTraumaTeamAV } from './tile/maxtac-trauma-team-av.js';
import { meteorStrike } from './template/meteor-strike.js';
import { mirrorImage } from './active-effect/mirror-image.js';
import { mistyStep } from './token/misty-step.js';
import { pathOfTheGrave } from './target/path-of-the-grave.js';
import { petrified } from './active-effect/petrified.js';
import { petrifyingGaze } from './multi-token/petrifying-gaze.js';
import { possession } from './token/possession/possession.js';
import { psychicTeleportation } from './template/psychic-teleportation.js';
import { rage } from './active-effect/rage/index.js';
import { rapidStrike } from './on-target/rapid-strike.js';
import { revivify } from './target/revivify.js';
import { romanCandle } from './target/roman-candle.js';
import { sandevistan } from './active-effect/sandevistan.js';
import { sanctuary } from './target/sanctuary.js';
import { shapechange } from './active-effect/shapechange.js';
import { shatterMask } from '../mask/shatter-mask.js';
import { shockingGrasp } from './target/shocking-grasp.js';
import { shuffle } from './multi-token/shuffle.js';
import { silence } from './template/silence.js';
import { skyRocket } from './target/sky-rocket.js';
import { sleep } from './target/sleep.js';
import { smokeMask } from '../mask/smoke-mask.js';
import { sneakAttack } from './on-target/sneak-attack.js';
import { speakWithDead } from './active-effect/speakWithDead.js';
import { spikeGrowth } from './template/spike-growth.js';
import { starwardSword } from './template/starward-sword.js';
import { stepOfTheWindJump } from './template/step-of-the-wind-jump.js';
import { stepOfTheWindMove } from './active-effect/step-of-the-wind.js';
import { strengthBeforeDeath } from './active-effect/strength-before-death.js';
import { stunningFist } from './on-target/stunning-fist.js';
import { stunningStrike } from './target/stunning-strike.js';
import { stormingDashStrikes } from './token/storming-dash-strikes.js';
import { suggestion } from './target/suggestion.js';
import { surprised } from './token/surprised.js';
import { tashasCausticBrew } from './template/tashas-caustic-brew.js';
import { tearMask } from '../mask/tear-mask.js';
import { teleport } from './template/teleport.js';
import { thornWhip } from './target/thorn-whip.js';
import { tokensOfTheDeparted } from './target/tokens-of-the-departed.js';
import { totemicAttunement } from './active-effect/rage/totemic-attunement/index.js';
import { trueStrike } from './target/true-strike.js';
import { twilightSanctuary } from './aura/twilight-sanctuary.js';
import { viciousMockery } from './target/vicious-mockery.js';
import { vigilantBlessing } from './target/vigilant-blessing.js';
import { vortexWarp } from './target/vortex-warp.js';
import { wailsFromTheGrave } from './on-target/wails-from-the-grave.js';
import { wings } from './token/wings.js';
import { saoDeath } from '../mask/sao-death.js';

export const effect = {
    animateDead,
    armorOfAgathys,
    armsOfHadar,
    banishment,
    benignTransportation,
    blastLock,
    bless,
    blurredVision,
    call,
    callLightning,
    curseOfTheWerewolf,
    chainLightning: chainLightningPrims,
    hologram,
    aerodyneVehicle,
    channelDivinityControlUndead,
    channelDivinityDreadAspect,
    charmed,
    chromaticOrb,
    cloudOfSand,
    colorSpray,
    dash,
    detect,
    dimensionDoor,
    disintegrate,
    divineSmite,
    divineStrike,
    drainingKiss,
    drainingTouch,
    dreadLord,
    dreadLordAttack,
    dreadLordFear,
    drunk,
    emote,
    enlargeReduce,
    entangle,
    eyesOfNight,
    eyesOfTheGrave,
    faerieFire,
    farStep,
    fightingSpirit,
    fingerOfDeath,
    fireBlast,
    firecracker,
    fireShield,
    flurryOfBlows,
    fly,
    frightfulMoan,
    gate,
    ghostWalk,
    goodberry,
    grapple,
    grease,
    guidingBolt,
    hacking,
    haloOfSpores,
    healingWord,
    hex,
    hide,
    hitTheDirt,
    hookAndPull,
    iaijutsuStrike,
    incorporeal,
    keeperOfSouls,
    leap,
    levitation,
    lightningBolt,
    magicMissile,
    maxtacTraumaTeamAV,
    meteorStrike,
    mirrorImage,
    mistyStep,
    pathOfTheGrave,
    petrified,
    petrifyingGaze,
    possession,
    psychicTeleportation,
    rage,
    rapidStrike,
    revivify,
    romanCandle,
    sandevistan,
    sanctuary,
    shapechange,
    shockingGrasp,
    shuffle,
    silence,
    skyRocket,
    sleep,
    sneakAttack,
    speakWithDead,
    spikeGrowth,
    starwardSword,
    stepOfTheWind: {
        jump: stepOfTheWindJump,
        move: stepOfTheWindMove
    },
    strengthBeforeDeath,
    stunningFist,
    stunningStrike,
    stormingDashStrikes,
    suggestion,
    surprised,
    tashasCausticBrew,
    teleport,
    thornWhip,
    tokensOfTheDeparted,
    totemicAttunement,
    tokenMask: {
        burn: warn.deprecation(burnMask, 'eskie.effect.tokenMask.burn', 'eskie.mask.burn', 'January 1, 2028'),
        shatter: warn.deprecation(shatterMask, 'eskie.effect.tokenMask.shatter', 'eskie.mask.shatter', 'January 1, 2028'),
        tear: warn.deprecation(tearMask, 'eskie.effect.tokenMask.tear', 'eskie.mask.tear', 'January 1, 2028'),
        smoke: warn.deprecation(smokeMask, 'eskie.effect.tokenMask.smoke', 'eskie.mask.smoke', 'January 1, 2028')
    },
    trueStrike,
    twilightSanctuary,
    viciousMockery,
    vigilantBlessing,
    vortexWarp,
    wailsFromTheGrave,
    wings,
    wingsV2: warn.deprecation(wings, 'eskie.effect.wingsV2', 'eskie.effect.wings', 'January 1, 2028'),
    swordArtOnlineDeath: warn.deprecation(saoDeath, 'eskie.effect.swordArtOnlineDeath', 'eskie.mask.saoDeath', 'January 1, 2028')
};
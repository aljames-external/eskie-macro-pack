import { closest } from '../../lib/filemanager.js';
import { teleport } from '../utils/teleport.js';

const DEFAULT_CONFIG = {
    zoom: 1.8,
}

async function validate(red, blue) {
    function isToken(obj) {
        return obj?.document?.documentName == 'Token';
    }
    async function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    if (!isToken(red) || !isToken(blue) || (red.id === blue.id)) {
        ui.notification.warn('Must provide two valid tokens to fight each other!');
        throw 'Must provide two valid tokens to fight each other!';
    }
    
    let requireInitialTeleport = false;
    if (canvas.grid.size) {
        const xDistanceValid = Math.abs((blue.x - red.x)/canvas.grid.size) == 9;
        const yDistanceValid = (blue.y - red.y)/canvas.grid.size == 0;
        requireInitialTeleport = (!xDistanceValid || !yDistanceValid);
    } else {
        ui.notification.warn('canvas.grid.size needs to be valid to coordinate');
        throw 'canvas.grid.size needs to be valid to coordinate';
    }

    if (requireInitialTeleport) {
        const config = {
            t: "circle",
            distance: 25,
            borderAlpha: 0,
            fillAlpha: 0.1,
            icon: { texture: "icons/skills/melee/swords-parry-block-blue.webp", },
            snap: {
                position: CONST.GRID_SNAPPING_MODES.VERTEX | CONST.GRID_SNAPPING_MODES.CENTER,
            }
        }
        let centerPoint = await Sequencer.Crosshair.show(config);
        await teleport.play(red, {x: centerPoint.x + (canvas.grid.size) * 9/2, y: centerPoint.y});
        await teleport.play(blue, {x: centerPoint.x - (canvas.grid.size) * 9/2, y: centerPoint.y});
        // then wait 100ms so Foundry updates the token locations
        await wait(100);
    }
}

async function play(token1, token2, config = {}) {
    const red = token1;
    const blue = token2;
    // move them into appropriate positions
    await validate(red, blue);

    // Blue is always on the left side in our setup
    if (blue.x > red.x) return play(blue, red, config);
    config.positions = getPositions(red, blue);
    const seq = create(red, blue, config);
    if (seq) return seq.play({preload:true});
}

function create(red, blue, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    let seq = new Sequence();
    seq.addSequence(movement1create(red, blue, mConfig));
    seq.addSequence(movement2create(red, blue, mConfig));
    seq.addSequence(movement3create(red, blue, mConfig));
    return seq;
}

// (HACKY) This is annoying... but moveToward and rotateToward utilize the centerpoint
// But teleport to utilizes exact coordinates... so we need to adjust one or the other
function adjustTeleport(coorinates) {
    return {x: coorinates.x, y: coorinates.y - canvas.grid.size / 2};
}

function getPositions(red, blue) {
    // Original layout per Eskie -- interpolated for ease of use
    // https://discord.com/channels/813354083061989438/1448383476457013349/1448383505406099538
    /***********************************************************
     *                        r4   r2   r3             r1
     *  | 00 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 |
     *    b1             b3   b2   b4
     ***********************************************************/
    function interpolatePos(red, blue, t, count) {
        const x = blue.x + (red.x - blue.x) * t/count;
        // (HACKY) positions seem to use center if given an object... move it down by a canvas.grid.size
        const y = blue.y + (red.y - blue.y) * t/count + canvas.grid.size / 2;
        return {x: x, y: y};
    }

    return {
        'b1': interpolatePos(red, blue, 0, 9),
        'b2': interpolatePos(red, blue, 4, 9),
        'b3': interpolatePos(red, blue, 3, 9),
        'b4': interpolatePos(red, blue, 5, 9),

        'r1': interpolatePos(red, blue, 9, 9),
        'r2': interpolatePos(red, blue, 5, 9),
        'r3': interpolatePos(red, blue, 6, 9),
        'r4': interpolatePos(red, blue, 4, 9),
    }
}

function midpoint(a, b) {
    const xshift = canvas.grid.size/2;
    const yshift = 0;
    return {x: (a.x + b.x)/2 + xshift, y: (a.y + b.y)/2 + yshift};
}

function movement1create(red, blue, config) {    
    let seq = new Sequence();
    seq.animation()
            .delay(400)
            .on(blue)
            .teleportTo(adjustTeleport(config.positions['b1']))
            .opacity(0)

        .animation()
            .delay(400)
            .on(red)
            .teleportTo(adjustTeleport(config.positions['r1']))
            .opacity(0)

        .effect()
            .name("gob")
            .copySprite(blue)
            .scaleToObject(1.0, {considerTokenScale:true})
            .moveTowards(config.positions['b2'], {delay:1000, ease: "easeOutQuint", rotate:false})
            .loopProperty("sprite", "position.x", { from: 0.05, to: 0, duration: 50, pingPong: true, gridUnits: true, delay: 1500})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1, duration: 250, pingPong: true, gridUnits: true, fromEnd:true, ease: "easeOutCubic"})
            .persist()

        .effect()
            .name("gob")
            .copySprite(red)
            .scaleToObject(1.0, {considerTokenScale:true})
            .moveTowards(config.positions['r2'], {delay:1000, ease: "easeOutQuint", rotate:false})
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0, duration: 50, pingPong: true, gridUnits: true, delay: 1500})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 1, duration: 250, pingPong: true, gridUnits: true, fromEnd:true, ease: "easeOutCubic"})
            .persist()

        .wait(750)
        
        .effect()
            .name("Trail")
            .file(closest("eskie.trail.token.generic.02.blue"))
            .atLocation(blue, {bindAlpha: false})
            .scaleToObject(1.5)
            .spriteOffset({x:-0.75},{gridUnits:true})
            .moveTowards(config.positions['b2'], {delay: 200, ease: "easeOutQuint", rotate:false})
            .belowTokens()
            .persist()
        
        .effect()
            .name("Trail")
            .file(closest("eskie.trail.token.generic.02.red"))
            .atLocation(red, {bindAlpha: false})
            .scaleToObject(1.5)
            .spriteOffset({x:0.75},{gridUnits:true})
            .moveTowards(config.positions['r2'], {delay: 200, ease: "easeOutQuint", rotate:false})
            .belowTokens()
            .mirrorX()
            .persist()

        .wait(400)

        .canvasPan()
            .atLocation(midpoint(config.positions['r1'], config.positions['b1']))
            .scale(config.zoom * 0.8)
        
        .effect()
            .file(closest("eskie.attack.melee.generic.01.slashing.medium.blue.fast.03"))
            .atLocation(config.positions['b2'], {offset:{x:-0.05}, gridUnits:true})
            .size(2.25,{gridUnits:true})
            .spriteOffset({x:-0.25},{gridUnits:true})
            .zIndex(2)
            .playbackRate(2)
        
        .effect()
            .file(closest("eskie.attack.melee.generic.01.slashing.medium.red.fast.03"))
            .atLocation(config.positions['r2'], {offset:{x:0.05}, gridUnits:true})
            .size(2.25,{gridUnits:true})
            .spriteOffset({x:0.25},{gridUnits:true})
            .mirrorX()
            .zIndex(2)
            .playbackRate(2)

        .effect()
            .file(closest("eskie.particle.05.orange"))
            .atLocation(config.positions['b2'], {offset:{x:0.5}, gridUnits:true})
            .size(4,{gridUnits:true})
            .zIndex(1)
            .randomRotation()

        .effect()
            .name("gob")
            .delay(150)
            .file(closest("eskie.particle.07.orange"))
            .attachTo(config.positions['r2'],{bindAlpha:false})
            .scaleToObject(1.5)
            .spriteOffset({x:0.2, y:-0.15},{gridUnits:true})
            .persist()
            .zIndex(1)
            .mirrorX()
        
        .effect()
            .name("gob")
            .delay(150)
            .file(closest("eskie.particle.07.orange"))
            .attachTo(config.positions['b2'],{bindAlpha:false})
            .scaleToObject(1.5)
            .spriteOffset({x:-0.2, y:-0.15},{gridUnits:true})
            .persist()
            .zIndex(1)

        .effect()
            .delay(150)
            .file(closest("eskie.smoke.03.white"))
            .atLocation(config.positions['b2'], {offset:{x:0.5}, gridUnits:true})
            .size(4,{gridUnits:true})
            .belowTokens()
            .playbackRate(2)
            .opacity(0.1)

        .effect()
            .name("gob")
            .delay(150)
            .file(closest("eskie.particle.08.orange"))
            .atLocation(config.positions['b2'], {offset:{x:0.5}, gridUnits:true})
            .size(2,{gridUnits:true})
            .zIndex(2)
            .persist()

        .effect()
            .name("Movement 1 End")
            .delay(150)
            .file(closest("eskie.particle.08.orange"))
            .atLocation(config.positions['b2'], {offset:{x:0.5}, gridUnits:true})
            .size(2,{gridUnits:true})
            .zIndex(2)
            .opacity(0)
            .duration(5000)
            .waitUntilFinished()

        .thenDo(function(){
            Sequencer.EffectManager.endEffects({ name: "Trail" }); 
        })

        .animation()
            .on(blue)
            .teleportTo(adjustTeleport(config.positions['b3']))

        
        .animation()
            .on(red)
            .teleportTo(adjustTeleport(config.positions['r3']))

        
        .wait(750)

        .canvasPan()
            .atLocation(midpoint(config.positions['r3'], config.positions['b3']))
            .scale(config.zoom)

        .effect()
            .file(closest("eskie.particle.05.orange"))
            .atLocation(config.positions['b2'], {offset:{x:0.5}, gridUnits:true})
            .size(6,{gridUnits:true})
            .zIndex(1)
            .randomRotation()
        
        .thenDo(function(){
            Sequencer.EffectManager.endEffects({ name: "gob" }); 
        })


        .animation()
            .delay(100)
            .on(blue)
            .opacity(1)

        .animation()
            .delay(100)
            .on(red)
            .opacity(1)

        .effect()
            .delay(100)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(config.positions['b3'], {offset:{x:-0.35}, gridUnits:true})
            .size(2,{gridUnits:true})
            .zIndex(1)
            .mirrorX()
            .opacity(0.1)
            .belowTokens()

        .effect()
            .delay(100)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(config.positions['r3'], {offset:{x:0.35}, gridUnits:true})
            .size(2,{gridUnits:true})
            .zIndex(1)
            .opacity(0.1)
            .belowTokens()

    return seq;
}

function movement2create(red, blue, config) {
    let seq = new Sequence()

    .wait(1000)

    .animation()
        .delay(400)
        .on(blue)
        .teleportTo(adjustTeleport(config.positions['b3']))
        .opacity(0)

    .animation()
        .delay(400)
        .on(red)
        .teleportTo(adjustTeleport(config.positions['r3']))
        .opacity(0)

    .effect()
        .delay(1000)
        .file(closest("eskie.trail.token.generic.02.blue"))
        .atLocation(blue, {bindAlpha: false})
        .scaleToObject(1.5)
        .spriteOffset({x:-0.75},{gridUnits:true})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 2, duration: 500, gridUnits: true, ease: "easeOutQuint"})
        .playbackRate(0.5)
        .startTime(750)


    .effect()
        .name("gob")
        .copySprite(blue)
        .scaleToObject(1.0, {considerTokenScale:true})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 2, duration: 500, delay: 1000, gridUnits: true, ease: "easeOutQuint"})
        //1st attack
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.2, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.2, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine"})
        //2nd defend
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.75, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 250, delay: 2750, gridUnits: true, ease: "easeOutSine"})
        //3rd defend
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.75, duration: 250, delay: 3000, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 250, delay: 3750, gridUnits: true, ease: "easeOutSine"})
        //4th attack
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.1, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.1, duration: 250, delay: 4750, gridUnits: true, ease: "easeOutSine"})
        .persist()

    .effect()
        .name("gob")
        .copySprite(red)
        .scaleToObject(1.0, {considerTokenScale:true})
        .moveTowards(config.positions['r3'], {delay:1000, ease: "easeOutQuint", rotate:false})
        //1st defend
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.75, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine"})
        //2nd attack
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.2, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.2, duration: 250, delay: 2750, gridUnits: true, ease: "easeOutSine"})
        //3rd attack
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.2, duration: 250, delay: 3000, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.2, duration: 250, delay: 3750, gridUnits: true, ease: "easeOutSine"})
        //4th defend
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 3-0.25, duration: 1000, delay: 4750, gridUnits: true, ease: "easeOutQuint"})
        .persist()

    //FIRST ATTACK
    .effect()
        .delay(2000)
        .name("effect")
        .atLocation(config.positions['b4'])
        .file(closest("eskie.attack.melee.generic.01.slashing.medium.blue.normal.01"))
        .rotateTowards(config.positions['r3'],{randomOffset: 0})
        .scaleToObject(2.25)
        .spriteOffset({x:-1},{gridUnits:true})
        .zIndex(2)

    .effect()
        .delay(2000)
        .name("effect")
        .atLocation(config.positions['r3'])
        .file(closest("eskie.attack.melee.generic.01.slashing.light.red.normal.01"))
        .rotateTowards(config.positions['b4'],{randomOffset: 0})
        .scaleToObject(2)
        .spriteOffset({x:-1.5},{gridUnits:true})
        .zIndex(0)

    .effect()
        .delay(2050)
        .file(closest("eskie.particle.06.orange"))
        .atLocation(config.positions['b4'])
        .size(2, {gridUnits:true})
        .spriteOffset({x:1},{gridUnits:true})
        .spriteRotation(90)

    //SECOND ATTACK
    .effect()
        .delay(2500)
        .name("effect")
        .atLocation(config.positions['r3'])
        .file(closest("eskie.attack.melee.generic.01.slashing.medium.red.normal.02"))
        .rotateTowards(config.positions['b4'],{randomOffset: 0})
        .scaleToObject(2.25)
        .spriteOffset({x:-1},{gridUnits:true})
        .zIndex(2)

    .effect()
        .delay(2500)
        .name("effect")
        .atLocation(config.positions['b4'])
        .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.normal.03"))
        .rotateTowards(config.positions['r3'],{randomOffset: 0})
        .scaleToObject(2)
        .spriteOffset({x:-1.5},{gridUnits:true})
        .zIndex(0)

    .effect()
        .delay(2550)
        .file(closest("eskie.particle.05.orange"))
        .atLocation(config.positions['r3'])
        .size(2, {gridUnits:true})
        .spriteOffset({x:-1},{gridUnits:true})
        .spriteRotation(180)

    //THIRD ATTACK
    .effect()
        .delay(3000)
        .name("effect")
        .atLocation(config.positions['r3'])
        .file(closest("eskie.attack.melee.generic.01.slashing.light.red.fast.03"))
        .rotateTowards(config.positions['b4'],{randomOffset: 0})
        .scaleToObject(2)
        .spriteOffset({x:-1},{gridUnits:true})
        .zIndex(2)
        .effect()
        .delay(3000)
        .name("effect")
        .atLocation(config.positions['r3'])
        .file(closest("eskie.attack.melee.generic.01.slashing.light.red.fast.03"))
        .rotateTowards(config.positions['b4'],{randomOffset: 0})
        .scaleToObject(2)
        .spriteOffset({x:-1},{gridUnits:true})
        .zIndex(2)
        .mirrorY()

    .effect()
        .delay(3000)
        .name("effect")
        .atLocation(config.positions['b4'])
        .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.slow.01"))
        .rotateTowards(config.positions['r3'],{randomOffset: 0})
        .scaleToObject(2)
        .spriteOffset({x:-1.5},{gridUnits:true})
        .rotateIn(180, 150, {ease:"easeOutCubic"})
        .mirrorY()
        .zIndex(0)

    .effect()
        .delay(3050)
        .file(closest("eskie.particle.05.orange"))
        .atLocation(config.positions['r3'])
        .size(1, {gridUnits:true})
        .spriteOffset({x:-0.8, y:0.1},{gridUnits:true})
        .spriteRotation(90)

    //FOURTH ATTACK
    .effect()
        .delay(4000)
        .name("effect")
        .atLocation(config.positions['b4'])
        .file(closest("eskie.attack.melee.generic.01.slashing.heavy.blue.slow.03"))
        .rotateTowards(config.positions['r3'],{randomOffset: 0})
        .scaleToObject(2.75)
        .spriteOffset({x:-1.55},{gridUnits:true})
        .zIndex(2)

    .effect()
        .delay(4000)
        .name("effect")
        .atLocation(config.positions['r3'])
        .file(closest("eskie.attack.melee.generic.01.slashing.light.red.slow.02"))
        .rotateTowards(config.positions['b4'],{randomOffset: 0})
        .scaleToObject(2)
        .spriteOffset({x:-1.75},{gridUnits:true})
        .mirrorY()
        .zIndex(0)

    .effect()
        .delay(4050)
        .file(closest("eskie.particle.07.orange"))
        .atLocation(config.positions['r3'])
        .size(2, {gridUnits:true})
        .spriteOffset({x:0.75, y:-0},{gridUnits:true})
        .mirrorX()
        .zIndex(3)

    .effect()
        .delay(4050)
        .copySprite(red)
        .scaleToObject(1.0, {considerTokenScale:true})
        .atLocation(config.positions['r3'])
        .scaleToObject(1)
        .fadeIn(250)
        .fadeOut(250)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .duration(1250)
        .opacity(0.25)
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 250, gridUnits: true, ease: "easeOutCubic"})
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 3-0.75, duration: 1000, delay: 650, gridUnits: true, ease: "easeOutQuint"})

    .effect()
        .delay(5500)
        .file(closest("eskie.smoke.01.white"))
        .atLocation(config.positions['r1'], {offset:{x:0.35}, gridUnits:true})
        .size(2,{gridUnits:true})
        .zIndex(1)
        .opacity(0.1)
        .belowTokens()

    .wait(4600);

    if (canvas?.scene?.background?.src) {
        seq.effect()
            .file(closest(canvas.scene.background.src))
            .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
            .size({width:canvas.scene.width/canvas.grid.size+10, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
            .fadeOut(1000, {ease: "easeInQuint"})
            .belowTiles()
            .spriteOffset({x:-canvas.scene.background.offsetX,y:-canvas.scene.background.offsetY})
            .filter("Blur", { blurX: 10, blurY: 5 })
            .opacity(0.75)
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -5, duration: 1000, gridUnits: true, ease: "easeOutQuint"})
    }

    seq.canvasPan() 
        .atLocation(midpoint(config.positions['r1'], config.positions['b4']))
        .scale(config.zoom * 1.4)

    .wait(1350)

    .animation()
        .delay(100)
        .on(blue)
        .opacity(1)
        .teleportTo(adjustTeleport(config.positions['b4']))

    .animation()
        .delay(100)
        .on(red)
        .opacity(1)
        .teleportTo(adjustTeleport(config.positions['r1']))

    .wait(250)

    .thenDo(function(){ Sequencer.EffectManager.endEffects({ name: "gob" });  })

    return seq;
}

function movement3create(red, blue, config) {
    let seq = new Sequence()
    
    seq.animation()
            .delay(400)
            .on(blue)
            .teleportTo(adjustTeleport(config.positions['b4']))
            .opacity(0)

        .animation()
            .delay(400)
            .on(red)
            .teleportTo(adjustTeleport(config.positions['r1']))
            .opacity(0)

        .effect()
            .delay(1000)
            .file(closest("eskie.trail.token.generic.02.red"))
            .atLocation(red, {bindAlpha: false})
            .scaleToObject(1.5)
            .spriteOffset({x:0.75},{gridUnits:true})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -3, duration: 500, gridUnits: true, ease: "easeOutQuint"})
            .playbackRate(0.5)
            .mirrorX()
            .startTime(750)
            //SHADOW////
            .effect()
            .name("gob")
            .copySprite(red)
            .scaleToObject(1.0, {considerTokenScale:true})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -3, duration: 500, delay: 1000, gridUnits: true, ease: "easeOutQuint"})
            //1st attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.2, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.2, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine"})
            //2nd attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.2, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.2, duration: 250, delay: 2750, gridUnits: true, ease: "easeOutSine"})
            //3rd attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.5, duration: 500, delay: 3500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.5, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutSine"})
            //4th defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.5, duration: 250, delay: 4500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.5, duration: 250, delay: 5500, gridUnits: true, ease: "easeOutCubic"})
            //5th defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 5, duration: 500, delay: 6250, gridUnits: true, ease: "easeInQuint"})
            .persist()
            .filter("ColorMatrix", { brightness:0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.5)
            .scaleToObject(0.8)
            .belowTokens()

        .effect()
            .name("gob")
            .copySprite(blue)
            .scaleToObject(1.0, {considerTokenScale:true})
            //1st defend
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.75, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.75, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine"})
            //2nd defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.75, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.25, duration: 250, delay: 3250, gridUnits: true, ease: "easeOutQuint"})
            //3rd defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.5, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutCubic"})
            //4th attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.5, duration: 500, delay: 5250, gridUnits: true, ease: "easeOutSine"})
            //5th attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.25, duration: 250, delay: 5750, gridUnits: true, ease: "easeOutSine"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.5, duration: 250, delay: 6000, gridUnits: true, ease: "easeOutQuint"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.25, duration: 500, delay: 6250, gridUnits: true, ease: "easeOutCubic"})
            .persist()
            .filter("ColorMatrix", { brightness:0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.5)
            .scaleToObject(0.8)
            .belowTokens()

        ////
        .effect()
            .name("gob")
            .copySprite(red)
            .scaleToObject(1.0, {considerTokenScale:true})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -3, duration: 500, delay: 1000, gridUnits: true, ease: "easeOutQuint"})
            //1st attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.2, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.2, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine"})
            //2nd attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.2, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.2, duration: 250, delay: 2750, gridUnits: true, ease: "easeOutSine"})
            //3rd attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.5, duration: 500, delay: 3500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.5, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutSine"})
            .animateProperty("sprite", "rotation", { from: 0, to: -360, duration: 500, delay: 3650, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, delay: 3500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.5, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutSine"})
            //4th defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.5, duration: 250, delay: 4500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.5, duration: 250, delay: 5500, gridUnits: true, ease: "easeOutCubic"})
            //5th defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 5, duration: 500, delay: 6250, gridUnits: true, ease: "easeInQuint"})
            .persist()

        .effect()
            .name("gob")
            .copySprite(blue)
            .scaleToObject(1.0, {considerTokenScale:true})
            //1st defend
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.75, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.75, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine"})
            //2nd defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.75, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.25, duration: 250, delay: 3250, gridUnits: true, ease: "easeOutQuint"})
            //3rd defend
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.5, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutCubic"})
            .animateProperty("sprite", "rotation", { from: 0, to: -360, duration: 500, delay: 4100, ease: "easeOutCubic"})
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, delay: 4000, gridUnits: true, ease: "easeOutCubic"})
            //4th attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.5, duration: 500, delay: 5250, gridUnits: true, ease: "easeOutSine"})
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.5, duration: 250, delay: 5250, gridUnits: true, ease: "easeInOutSine"})
            //5th attack
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -0.25, duration: 250, delay: 5750, gridUnits: true, ease: "easeOutSine"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.5, duration: 250, delay: 6000, gridUnits: true, ease: "easeOutQuint"})
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -1.25, duration: 500, delay: 6250, gridUnits: true, ease: "easeOutCubic"})
            .persist()

        //FIRST ATTACK
        .canvasPan() 
            .delay(1000)
            .atLocation(config.positions['r3'])
            .scale(config.zoom)

        .effect()
            .delay(2000)
            .name("effect")
            .atLocation(config.positions['r3'])
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.medium.red.normal.03"))
            .rotateTowards(config.positions['b4'],{randomOffset: 0})
            .scaleToObject(2.25)
            .spriteOffset({x:-1},{gridUnits:true})
            .mirrorY()
            .zIndex(2)

        .effect()
            .delay(2000)
            .name("effect")
            .atLocation(config.positions['b4'])
            .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.normal.01"))
            .rotateTowards(config.positions['r3'],{randomOffset: 0})
            .scaleToObject(2)
            .spriteOffset({x:-1.75},{gridUnits:true})
            .rotate(90)
            .zIndex(0)

        .effect()
            .delay(2050)
            .file(closest("eskie.particle.06.orange"))
            .atLocation(config.positions['b4'])
            .size(2, {gridUnits:true})
            .spriteOffset({y:-0.5},{gridUnits:true})
            .spriteRotation(90)
            .mirrorY()

        //SECOND ATTACK
        .effect()
            .delay(2500)
            .name("effect")
            .atLocation(config.positions['r3'])
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.heavy.red.slow.01"))
            .rotateTowards(config.positions['b4'],{randomOffset: 0})
            .scaleToObject(2.25)
            .spriteOffset({x:-1},{gridUnits:true})
            .zIndex(2)

        .effect()
            .delay(2500)
            .name("effect")
            .atLocation(config.positions['b4'])
            .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.slow.02"))
            .rotateTowards(config.positions['r3'],{randomOffset: 0})
            .scaleToObject(2)
            .spriteOffset({x:-1.75},{gridUnits:true})
            .zIndex(0)

        .effect()
            .delay(2550)
            .file(closest("eskie.particle.07.orange"))
            .atLocation(config.positions['b4'])
            .size(2, {gridUnits:true})
            .spriteOffset({x:-0.75, y:-0.1},{gridUnits:true})
            .zIndex(3)

        .effect()
            .delay(3250)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(config.positions['b3'], {offset:{x:-0.35}, gridUnits:true})
            .size(2,{gridUnits:true})
            .zIndex(1)
            .mirrorX()
            .opacity(0.1)
            .belowTokens()

        //THIRD ATTACK
        .canvasPan() 
            .delay(3250)
            .atLocation(config.positions['r4'])
            .scale(config.zoom)

        .effect()
            .delay(4000)
            .name("effect")
            .atLocation(config.positions['r4'])
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.heavy.red.slow.02"))
            .rotateTowards(config.positions['b3'],{randomOffset: 0})
            .scaleToObject(2.75)
            .spriteOffset({x:-1.25},{gridUnits:true})
            .mirrorY()
            .zIndex(2)

        .effect()
            .delay(4050)
            .file(closest("eskie.smoke.03.white"))
            .atLocation(config.positions['b3'])
            .size(4,{gridUnits:true})
            .belowTokens()
            .playbackRate(2)
            .spriteRotation(90)
            .opacity(0.1)

        //Fourth ATTACK
        .canvasPan() 
            .delay(4000)
            .atLocation(config.positions['b3'])
            .scale(config.zoom)

        .effect()
            .delay(4500)
            .name("effect")
            .atLocation(config.positions['b3'],{offset:{x:-0.5,y:-0.5},gridUnits:true})
            .file(closest("eskie.attack.melee.generic.01.piercing.medium.blue.normal.01"))
            .rotateTowards(config.positions['r4'],{randomOffset: 0})
            .scaleToObject(2.75)
            .spriteOffset({x:-1},{gridUnits:true})
            //.animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 500, gridUnits: true, ease: "easeOutCubic"})
            .zIndex(3)
            .playbackRate(2)

        .effect()
            .delay(4700)
            .name("effect")
            .atLocation(config.positions['b3'],{offset:{x:-0.5,y:-0.6},gridUnits:true})
            .file(closest("eskie.attack.melee.generic.01.piercing.medium.blue.normal.02"))
            .rotateTowards(config.positions['r4'],{ randomOffset: 0})
            .scaleToObject(2.75)
            .spriteOffset({x:-1, y:-0.15},{gridUnits:true})
            //.animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 500, gridUnits: true, ease: "easeOutCubic"})
            .zIndex(3)
            .playbackRate(2)

        .effect()
            .delay(4900)
            .name("effect")
            .atLocation(config.positions['b3'],{offset:{x:-0.5,y:-0.4},gridUnits:true})
            .file(closest("eskie.attack.melee.generic.01.piercing.medium.blue.normal.02"))
            .rotateTowards(config.positions['r4'],{ randomOffset: 0})
            .scaleToObject(2.75)
            .spriteOffset({x:-1, y:0},{gridUnits:true})
            //.animateProperty("spriteContainer", "position.x", { from: 0, to: 0.75, duration: 500, gridUnits: true, ease: "easeOutCubic"})
            .mirrorY()
            .zIndex(3)
            .playbackRate(2)

        .effect()
            .delay(4500)
            .name("effect")
            .atLocation(config.positions['r4'])
            .file(closest("eskie.attack.melee.generic.01.slashing.light.red.slow.01"))
            .rotateTowards(config.positions['b3'],{offset:{x:-1,y:-0.5},randomOffset: 0})
            .scaleToObject(2)
            .spriteOffset({x:-1.75},{gridUnits:true})
            .zIndex(0)
            .playbackRate(2)

        .effect()
            .delay(4500)
            .file(closest("eskie.particle.05.orange"))
            .atLocation(config.positions['r4'], {randomOffset:0.15, gridUnits:true})
            .size(1, {gridUnits:true})
            .spriteOffset({x:-0.1, y:0},{gridUnits:true})
            .randomRotation()
            .repeats(6,100,100)

        .effect()
            .delay(5250)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(config.positions['b1'], {offset:{x:1}, gridUnits:true})
            .size(2,{gridUnits:true})
            .zIndex(1)
            .mirrorX()
            .opacity(0.1)
            .belowTokens()

        //FIFTH ATTACK
        .canvasPan() 
            .delay(5500)
            .atLocation(midpoint(config.positions['r3'], config.positions['b3']))
            .scale(config.zoom)

        .effect()
            .delay(6000)
            .name("effect")
            .atLocation(config.positions['b1'],{offset:{x:1}, gridUnits:true})
            .file(closest("eskie.attack.melee.generic.01.piercing.heavy.blue.slow.01"))
            .rotateTowards(config.positions['r4'],{randomOffset: 0})
            .scaleToObject(3.25)
            .spriteOffset({x:-1},{gridUnits:true})
            .animateProperty("spriteContainer", "position.x", { from: -0.8, to: 0.8, duration: 500, gridUnits: true, ease: "easeOutCubic"})
            .zIndex(2)

        .effect()
            .delay(6000)
            .name("effect")
            .atLocation(config.positions['r4'])
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.medium.red.fast.01"))
            .rotateTowards(config.positions['b1'],{randomOffset: 0})
            .scaleToObject(2)
            .spriteOffset({x:-1.75},{gridUnits:true})
            .zIndex(0)
            .playbackRate(1.5)

        .effect()
            .delay(6000)
            .file(closest("eskie.particle.05.orange"))
            .atLocation(config.positions['r4'])
            .size(5, {gridUnits:true})
            .spriteOffset({x:-0},{gridUnits:true})
            .playbackRate(0.75)

        .effect()
            .delay(6500)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(config.positions['r1'], {offset:{x:-0}, gridUnits:true})
            .size(2,{gridUnits:true})
            .zIndex(1)
            .opacity(0.1)
            .belowTokens()

        .canvasPan()
            .atLocation(midpoint(config.positions['r1'], config.positions['b1']))
            .scale(config.zoom * 1.6)

        .animation()
            .delay(7000)
            .on(blue)
            .teleportTo(adjustTeleport(config.positions['b1']))
            .opacity(1)

        .animation()
            .delay(7000)
            .on(red)
            .teleportTo(adjustTeleport(config.positions['r1']))
            .opacity(1)

        .wait(7000)

        .thenDo(function(){ Sequencer.EffectManager.endEffects({ name: "gob" }); });
    
    return seq;
}

export const attackAttack = {
    play
}
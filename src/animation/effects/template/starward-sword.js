import { closest } from "../../../lib/filemanager.js";
import { templates } from '../../../lib/templates.js';
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'starwardSword',
    size: 6, // AoE size
    darkMap: true,
    cameraZoom: false,
    targets: [],
};

async function createStarwardSword(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { size, darkMap, cameraZoom } = mConfig;
    let { targets } = mConfig;

    const cfg = {
        radius: size * canvas.grid.size,
        max: 150,
        icon: 'icons/svg/sword.svg',
        label: 'Starward Sword'
    };
    let [position, _] = await templates.getPosition(mConfig.template, cfg);
    if (!position) { return; }

    if (!targets || targets.length === 0) {
        targets = Array.from(game.user.targets);
    }

    // Define the center of the circle
    let centerX = position.x + (canvas.grid.size / 2);
    let centerY = position.y + (canvas.grid.size / 2);

    // Define the radius of the circle
    let radius = (size / 2) * canvas.grid.size;

    // Declare an array to hold the points
    let initialPoints = [];
    let points = [];

    // Declare an array to keep track of used angles
    let usedAngles = [];

    // Define an array of angles in radians
    let angles = [Math.PI / 6, Math.PI * (7 / 6), Math.PI * (11 / 6), Math.PI * (3 / 4), Math.PI * (6 / 4)];

    // Loop over the angles
    for (let o = 0; o < angles.length; o++) {
        // Calculate the x and y coordinates of the point
        let x = centerX + radius * Math.cos(angles[o]);
        let y = centerY + radius * Math.sin(angles[o]);

        // Add the point to the array
        initialPoints.push({ x, y });
    }
    // Loop 10 times
    for (let i = 0; i < 10; i++) {
        let angle;

        // Generate a new random angle for even iterations
        if (i % 2 === 0) {
            do {
                angle = Math.random() * 2 * Math.PI;
            } while (usedAngles.some(a => Math.abs(a - angle) < (Math.PI / 6)));

            usedAngles.push(angle);
        } else {
            // Use the opposite angle for odd iterations
            angle = (points[points.length - 1].angle + Math.PI);
        }

        // Calculate the x and y coordinates of the point
        let x = centerX + (radius + 10) * Math.cos(angle);
        let y = centerY + (radius + 10) * Math.sin(angle);

        // Add the point to the array
        points.push({ x, y, angle });
    }

    //Opening
    const mainSequence = new Sequence();
    mainSequence
        .effect()
        .file(canvas.scene.background.src)
        .name("Starward Sword")
        .filter("ColorMatrix", { brightness: 0.3 })
        .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
        .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
        .persist()
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()
        .playIf(() => {
            return darkMap == true;
        })

        .thenDo(function () {
            if (cameraZoom == true) {
                canvas.animatePan({ duration: 250, x: token.center.x, y: token.center.y, scale: 1.620 })
            }
        })

        .effect()
        .file(closest("eskie.damage.electricity.01.blue"))
        .atLocation(token, { offset: { x: 0, y: 0 }, gridUnits: true })
        .attachTo(token)
        .scaleToObject(token.document.texture.scaleX * 1.4)
        .filter("ColorMatrix", { hue: 175 })
        .mirrorX()
        .waitUntilFinished(-300)

        .effect()
        .file(closest("eskie.magic.purple_portal"))
        .atLocation(token)
        .attachTo(token)
        .scaleToObject(token.document.texture.scaleX * 1.5)
        .filter("ColorMatrix", { saturate: 1, hue: 100 })
        .belowTokens()
        .zIndex(0)

        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(1.1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2 })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.75, duration: 300, ease: "easeOutCubic", gridUnits: true })
        .animateProperty("sprite", "width", { from: 1, to: 0.025, duration: 300, ease: "easeOutCubic", gridUnits: true })
        .animateProperty("sprite", "height", { from: 1, to: 1.5, duration: 300, ease: "easeOutCubic", gridUnits: true })
        .fadeOut(200)
        .duration(400)
        .attachTo(token, { bindAlpha: false })

        .effect()
        .file(closest("eskie.damage.electricity.02.pink"))
        .atLocation(token)
        .scaleToObject(1.1)
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2 })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.75, duration: 300, ease: "easeOutCubic", gridUnits: true })
        .animateProperty("sprite", "width", { from: 1, to: 0.5, duration: 100, ease: "easeOutCubic", gridUnits: true })
        .animateProperty("sprite", "height", { from: 1, to: 1.5, duration: 300, ease: "easeOutCubic", gridUnits: true })
        .fadeOut(200)
        .duration(400)
        .attachTo(token, { bindAlpha: false })
        .waitUntilFinished(-300)


        .thenDo(function () {
            if (cameraZoom == true) {
                canvas.animatePan({ duration: 50, x: token.center.x, y: token.center.y, scale: 0.420 })
            }
        });
    //Slashes
    for (let e = 0; e < 10; e++) {
        if (e == 0) {
            for (let u = 0; u < 5; u++) {
                if (u === 4) {

                    mainSequence.addSequence(new Sequence()

                        .wait(200 * (u + 1) - 199)

                        .effect()
                        .file(closest("jb2a.impact.002.pinkpurple"))
                        .atLocation(initialPoints[u])
                        .spriteOffset({ x: -0.6 }, { gridUnits: true })
                        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                        .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                        .name("Starward Sword")
                        .rotateTowards(position)
                        .size({ width: 1, height: 2.5 }, { gridUnits: true })
                        .opacity(1)
                        .zIndex(2)

                        .effect()
                        .copySprite(token)
                        .atLocation(initialPoints[u])
                        .scaleToObject(0.95, { considerTokenScale: true })
                        .tint("#e305ff")
                        .name("Starward Sword")
                        .scaleIn(0, 250, { ease: "easeOutCubic" })
                        .fadeOut(250, { ease: "easeOutCubic" })
                        .duration(500)
                        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                        .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                        .filter("Blur", { blurX: 5, blurY: 10 })
                        .rotateTowards(position)
                        .opacity(1)
                        .zIndex(4)

                        .effect()
                        .copySprite(token)
                        .atLocation(initialPoints[u])
                        .scaleToObject(0.95, { considerTokenScale: true })
                        .tint("#e305ff")
                        .name("Starward Sword")
                        .filter("ColorMatrix", { saturate: -0.25, brightness: 1.1, contrast: 0.6 })
                        .scaleIn(0, 250, { ease: "easeOutCubic" })
                        .fadeIn(250)
                        .persist()
                        .rotateTowards(position)
                        .opacity(0.35)
                        .zIndex(3)

                        .effect()
                        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purple"))
                        .atLocation(initialPoints[u])
                        .stretchTo(position)
                        .filter("ColorMatrix", { hue: 70 })


                        .thenDo(function () {
                            targets.forEach(target => {
                                new Sequence()

                                    .animation()
                                    .on(target)
                                    .opacity(1)

                                    .effect()
                                    .copySprite(target)
                                    .atLocation(target)
                                    .scaleToObject(1, { considerTokenScale: true })
                                    .animateProperty("sprite", "position.y", { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                                    .animateProperty("sprite", "position.y", { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                                    .extraEndDuration(30)
                                    .filter("Blur", { blurX: 0, blurY: 5 })
                                    .opacity(0.35)

                                    .effect()
                                    .file(closest("jb2a.impact.009.purple"))
                                    .atLocation(target, { randomOffset: 1, gridUnits: true })
                                    .randomRotation()
                                    .filter("ColorMatrix", { saturate: -0.4 })
                                    .scaleToObject(1)
                                    .zIndex(0)

                                    .play()
                            })
                        })

                        .wait(150)

                        .effect()
                        .file(closest("eskie.smoke.07.white"))
                        .atLocation(token)
                        .attachTo(token)
                        .scaleToObject(token.document.texture.scaleX * 1.5)
                        .mirrorX()
                        .filter("ColorMatrix", { saturate: 1, hue: 100 })
                        .belowTokens()
                        .zIndex(0)

                        .animation()
                        .on(token)
                        .opacity(1)
                        .fadeIn(250)

                        .wait(50));

                } else {

                    mainSequence.addSequence(new Sequence()

                        .wait(200 * (u + 1) - 199)

                        .effect()
                        .file(closest("jb2a.impact.002.pinkpurple"))
                        .atLocation(initialPoints[u])
                        .spriteOffset({ x: -0.6 }, { gridUnits: true })
                        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                        .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                        .name("Starward Sword")
                        .rotateTowards(initialPoints[Math.max(1, (u - 1))])
                        .size({ width: 1, height: 2.5 }, { gridUnits: true })
                        .opacity(1)
                        .zIndex(2)

                        .effect()
                        .copySprite(token)
                        .atLocation(initialPoints[u])
                        .scaleToObject(0.95, { considerTokenScale: true })
                        .tint("#e305ff")
                        .name("Starward Sword")
                        .scaleIn(0, 250, { ease: "easeOutCubic" })
                        .fadeOut(250, { ease: "easeOutCubic" })
                        .duration(500)
                        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
                        .filter("Glow", { color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1 })
                        .filter("Blur", { blurX: 5, blurY: 10 })
                        .rotateTowards(initialPoints[(u + 1)])
                        .opacity(1)
                        .zIndex(4)

                        .effect()
                        .copySprite(token)
                        .atLocation(initialPoints[u])
                        .scaleToObject(0.95, { considerTokenScale: true })
                        .tint("#e305ff")
                        .name("Starward Sword")
                        .filter("ColorMatrix", { saturate: -0.25, brightness: 1.1, contrast: 0.6 })
                        .scaleIn(0, 250, { ease: "easeOutCubic" })
                        .fadeIn(250)
                        .persist()
                        .rotateTowards(initialPoints[(u + 1)])
                        .opacity(0.35)
                        .zIndex(3)

                        .effect()
                        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purple"))
                        .atLocation(initialPoints[u])
                        .stretchTo(initialPoints[(u + 1)])
                        .filter("ColorMatrix", { hue: 70 })

                        .thenDo(function () {
                            targets.forEach(target => {
                                new Sequence()

                                    .effect()
                                    .copySprite(target)
                                    .atLocation(target)
                                    .scaleToObject(1, { considerTokenScale: true })
                                    .animateProperty("sprite", "position.y", { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                                    .animateProperty("sprite", "position.y", { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                                    .extraEndDuration(30)
                                    .filter("Blur", { blurX: 0, blurY: 5 })
                                    .opacity(0.35)

                                    .effect()
                                    .file(closest("jb2a.impact.009.purple"))
                                    .atLocation(target, { randomOffset: 1, gridUnits: true })
                                    .randomRotation()
                                    .scaleToObject(1)
                                    .filter("ColorMatrix", { saturate: -0.4 })
                                    .zIndex(0)

                                    .play()
                            })
                        })
                    );  // END addSequence
                }
            }
        } else if (e === 9) {
            mainSequence.addSequence(new Sequence()

                .effect()
                .name(`location`)
                .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purple"))
                .atLocation(points[e])
                .stretchTo(points[0])
                .filter("ColorMatrix", { hue: 70 })
                .zIndex(4)

                .thenDo(function () {
                    targets.forEach(target => {
                        new Sequence()

                            .effect()
                            .copySprite(target)
                            .atLocation(target)
                            .scaleToObject(1, { considerTokenScale: true })
                            .animateProperty("sprite", "position.y", { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                            .animateProperty("sprite", "position.y", { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                            .extraEndDuration(30)
                            .filter("Blur", { blurX: 0, blurY: 5 })
                            .opacity(0.35)

                            .effect()
                            .file(closest("jb2a.impact.009.purple"))
                            .atLocation(target, { gridUnits: true })
                            .randomRotation()
                            .scaleToObject(2)
                            .filter("ColorMatrix", { saturate: -0.4 })
                            .zIndex(0)
                            .delay(700)
                            .waitUntilFinished(-500)

                            .animation()
                            .on(target)
                            .opacity(0)

                            .effect()
                            .copySprite(target)
                            .atLocation(target, { local: true })
                            .scaleToObject(1, { considerTokenScale: true })
                            .filter("ColorMatrix", { brightness: -1 })
                            .filter("Blur", { blurX: 5, blurY: 10 })
                            .animateProperty("sprite", "scale.x", { from: 1, to: 0.9, duration: 500, ease: "easeOutCubic" })
                            .animateProperty("sprite", "scale.y", { from: 1, to: 0.9, duration: 500, ease: "easeOutCubic" })
                            .animateProperty("sprite", "scale.x", { from: 1, to: 1.1, duration: 250, delay: 500, ease: "easeOutCubic" })
                            .animateProperty("sprite", "scale.y", { from: 1, to: 1.1, duration: 250, delay: 500, ease: "easeOutCubic" })
                            .opacity(0.5)
                            .belowTokens()

                            .effect()
                            .copySprite(target)
                            .atLocation(target, { local: true })
                            .scaleToObject(1, { considerTokenScale: true })
                            .animateProperty("sprite", "position.y", { from: 0, to: -0.25, duration: 500, gridUnits: true, ease: "easeOutCubic" })
                            .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 500, ease: "easeInOutBack" })
                            .animateProperty("sprite", "position.y", { from: 0.25, to: 0, duration: 250, gridUnits: true, delay: 500, ease: "easeOutCubic" })
                            .extraEndDuration(100)
                            .waitUntilFinished(-100)

                            .effect()
                            .file(closest("eskie.smoke.06.white"))
                            .atLocation(target)
                            .scaleToObject(1.5)
                            .belowTokens()
                            .opacity(0.5)

                            .animation()
                            .on(target)
                            .rotate(90)
                            .opacity(1)

                            .wait(1500)

                            .animation()
                            .on(target)
                            .rotate(0)
                            .opacity(1)

                            .play()


                    })
                })

                .wait(400)

                .effect()
                .file(closest("eskie.lightning.lightning_bolt.purple"))
                .atLocation(position, { offset: { x: size / 2, y: -0.5 }, gridUnits: true })
                .stretchTo(position, { offset: { x: size / 2 * -1, y: 0.5 }, gridUnits: true })
                .filter("ColorMatrix", { hue: 60 })
                .filter("ColorMatrix", { saturate: 1.25 })
                .zIndex(4)
                .waitUntilFinished(-200)

                .thenDo(function () {

                    Sequencer.EffectManager.endEffects({ name: "Starward Sword" });

                })

                .animation()
                .on(token)
                .opacity(1)
            ); // End addSequence

        } else {
            mainSequence.addSequence(new Sequence()

                .effect()
                .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purple"))
                .atLocation(points[e])
                .stretchTo(points[e + 1])
                .fadeOut(1000)
                .filter("ColorMatrix", { hue: 70 })
                .zIndex(4)

                .effect()
                .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purple"))
                .atLocation(points[9 - e])
                .stretchTo(points[9 - e - 1])
                .fadeOut(1000)
                .filter("ColorMatrix", { hue: 70 })
                .playIf(() => {
                    return Math.random() < 0.5;
                })
                .zIndex(4)

                .thenDo(function () {
                    targets.forEach(target => {
                        new Sequence()

                            .effect()
                            .copySprite(target)
                            .atLocation(target)
                            .scaleToObject(1, { considerTokenScale: true })
                            .animateProperty("sprite", "position.y", { from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false })
                            .animateProperty("sprite", "position.y", { from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90 })
                            .extraEndDuration(30)
                            .filter("Blur", { blurX: 0, blurY: 5 })
                            .opacity(0.35)

                            .effect()
                            .file(closest("jb2a.impact.009.purple"))
                            .atLocation(target, { randomOffset: 1, gridUnits: true })
                            .randomRotation()
                            .scaleToObject(1)
                            .filter("ColorMatrix", { saturate: -0.4 })
                            .playIf(() => {
                                return Math.random() < 0.5;
                            })
                            .zIndex(0)

                            .play()
                    })
                })

                .wait(50)
            );  // End addSequence
        }
    }
    return mainSequence;
}


async function playStarwardSword(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    let seq = await createStarwardSword(token, config, options);
    if (seq) { return seq.play(); }
}

function stopStarwardSword(token, { id = DEFAULT_CONFIG.id } = {}) {
    Sequencer.EffectManager.endEffects({ name: `Starward Sword ${token.document.name} ${id}` });
}

export const starwardSword = {
    create: createStarwardSword,
    play: playStarwardSword,
    stop: stopStarwardSword,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Starward Sword", "template", "eskie.effect.starwardSword", DEFAULT_CONFIG);

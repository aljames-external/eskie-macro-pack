let actor = "poop/tokens/goblins/Goblin1.png";
let side = "left";
let emote = "eskie.emote.angry.02";
let duration = 10000;

let text = "poo poo pee pee ass, me mad!";
const style = {
    fill: "white",
    fontFamily: "Arial Black",
    fontSize: 108,
    strokeThickness: 10
};

const typeDuration = duration / 10;
const letterDelay = typeDuration / text.length;

// Rough width estimate per character
const charSpacing = 50;

new Sequence()

.effect()
.file(actor)
.screenSpace()
.screenSpaceScale({ x: 1.0, y: 1.0 })
.screenSpaceAnchor({ x: 0.15, y: 0.75 })
.animateProperty("sprite", "position.x", {from: -200,to: 0,duration: 500,ease: "easeOutCubic"})
.fadeIn(500)
.duration(duration)

.effect()
.delay(500)
.file(emote)
.screenSpace()
.screenSpaceScale({ x: 0.75, y: 0.75 })
.screenSpaceAnchor({ x: 0.25, y: 0.65 })
.scaleIn(0, 500, { ease: "easeOutBack" })
.duration(duration - 500)
.rotate(-45)

.thenDo(function(){

const totalWidth = text.length * charSpacing;
const startX = -(totalWidth / 2);

for (let i = 0; i < text.length; i++) {

new Sequence()
  
.effect()
.delay(i * letterDelay)
.screenSpace()
.screenSpaceScale({ x: 1.0, y: 1.0 })
.screenSpaceAnchor({ x: 0.45, y: 0.8 })
.screenSpacePosition({
x: startX + (i * charSpacing),
y: 0
})
.text(text[i], style)
.zIndex(1)
.duration(duration - (i * letterDelay))

.play()
  
}

})  
.play();
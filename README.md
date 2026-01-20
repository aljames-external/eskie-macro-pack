# Eskie Macro Package (EMP)

## Summary

A collection of community generated macros utilizing both free and premium asset libraries to animate Foundry VTT.

* [eskie Discord Channel](https://discord.gg/HgCQv2mK)
* [Eskie Youtube Channel](https://www.youtube.com/channel/UCnES1fzHV-xSu58rEL7NcDg)

Join the Discord channel! Learn Sequencer and share your own creations!

## Animation Contributors

* Eskiemoh / eskie
* Bakana
* DerKriegs
* Gornetron
* Doomrule
* Mia Del'Mori

## Features

* A wide variety of animations!
* Automated Animations integration!
* User facing API for macro support!
* Highly customizable varients!

## Macro API - eskie.

```js
// Explore the animations!
console.log(eskie.effect)    // Token based animations
console.log(eskie.showcase)  // Showcases from the Discord
console.log(eskie.overlay)   // Canvas animations

// Try some out!
let token = _token;
let targets = Array.from(game.user.targets);
let target = targets[0];

await eskie.effect.rage.play(token);
await eskie.effect.rage.stop(token);

// Configure!
await eskie.effect.banishment.play(target, {color: 'purple'});
await eskie.effect.banishment.stop(target, {color: 'red'});

// Make everyone wonder if they are seeing double!
let users = game.users.map(u => u.name);
await eskie.overlay.blur.drunk.play(users);

// Sober them up!
await eskie.overlay.blur.drunk.stop(users);
```

## Want to Contribute?

We'd love to have you! There are (at least) two ways to contribute to this project:

1. Post your own Sequencer animations to the Discord and request integration!
1. Create a PR following the current coding standards:
    - create / play functions exported
    - DEFAULT_CONFIG used as the base configuration
    - Test the animation with token rotation
    - (If integrating with AA) standardized arguments for create / play functions

## Requirements

* Foundry VTT 13+
* Sequencer
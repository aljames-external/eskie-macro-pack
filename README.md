# Eskie Macro Package (EMP)

## Summary

A collection of community-generated macros utilizing both free and premium asset libraries to animate Foundry VTT.

* [eskie Discord Channel](https://discord.gg/HgCQv2mK)
* [Eskie Youtube Channel](https://www.youtube.com/channel/UCnES1fzHV-xSu58rEL7NcDg)

Join the Discord channel! Learn Sequencer and share your own creations!

## Animation Contributors

* Eskiemoh / eskie (@.eskie)
* Bakana (@bakanabaka)
* DerKriegs (@derkriegs)
* Gornetron (@nefin)
* Doomrule (@doomrule)
* Mia Del'Mori (@.tranquilite)
* Akane (@yamiakane)

## Features

* A wide variety of animations!
* Automated Animations integration!
* User-facing API for macro support!
* Highly customizable variants!
* Automated tile-based trap system!

---

## Requirements

EMP requires the following modules to be installed and active:

| Module | Purpose |
|--------|---------|
| [Sequencer](https://foundryvtt.com/packages/sequencer) | Core animation playback engine |
| [socketlib](https://foundryvtt.com/packages/socketlib) | Multi-client socket communication for synced effects |

---

## Optional Modules

The following modules are optional but unlock additional features when installed:

| Module | What It Enables |
|--------|----------------|
| [Eskie Effects (Patreon)](https://www.patreon.com/EskieEffects) | Additional premium effect assets designed specifically for EMP (or the free variant) |
| [JB2A (Patreon)](https://www.patreon.com/JB2A) | Large library of high-quality animated assets used by many EMP effects (or the free variant) |
| [Animated Spell Effects: Cartoon](https://foundryvtt.com/packages/animated-spell-effects-cartoon) | Free (being deprecated) animated asset library used by select effects |
| [Boss Loot Assets (Patreon)](https://www.patreon.com/cw/BossLoot) | Premium asset pack used by select effects (or the free variant) |
| [Tagger](https://foundryvtt.com/packages/tagger) | Tag-based tile and token lookup; used by some trap and movement effects |
| [Token Attacher](https://foundryvtt.com/packages/token-attacher) | Attaches tokens to tiles for movement-based trap and tile effects |
| [Monk's Active Tile Triggers (MATT)](https://foundryvtt.com/packages/monks-active-tiles) | **Required for the Traps API.** Automates trap playback when tokens enter tiles |

---

## Macro API — `eskie.*`

All API methods are available from any Foundry VTT macro or the browser console (F12). There are four top-level namespaces:

| Namespace | Description |
|-----------|-------------|
| `eskie.effect` | Token and template-based spell/ability animations |
| `eskie.overlay` | Canvas-wide scene overlays |
| `eskie.showcase` | Long-form cinematic sequences |
| `eskie.traps` | Automated tile-based trap system |

> **Quick exploration:** Run `console.log(eskie)` in the browser console to browse everything available.

---

### Effects — `eskie.effect`

Token and template-based animations for spells, abilities, and conditions. Most effects accept a `token` (or array of tokens) as the first argument, with an optional `config` object for customization.

**Common API shape:**

| Method | Description |
|--------|-------------|
| `create(token, [...], config)` | Builds and returns a Sequence without playing it |
| `play(token, [...], config)` | Builds and immediately plays the Sequence |
| `stop(token, config)` | Stops or reverses any persistent effects |
| `default_config` | The default configuration object for that effect |

```js
let token = _token;
let target = Array.from(game.user.targets)[0];

// Play a persistent aura on a token
await eskie.effect.rage.play(token);
await eskie.effect.rage.stop(token);

// Play a targeted effect (caster → target)
await eskie.effect.divineSmite.play(token, target);

// Customize with a config object
await eskie.effect.banishment.play(token, { color: 'purple' });
await eskie.effect.banishment.stop(token, { color: 'red' });

// Build a Sequence manually without playing it
const seq = eskie.effect.hex.create(token, target);
seq.play();
```

**Sample effects:**

| Key | Description |
|-----|-------------|
| `eskie.effect.rage` | Barbarian Rage aura |
| `eskie.effect.banishment` | Banishment shimmer (supports `color` option) |
| `eskie.effect.hex` | Hex curse beam to target |
| `eskie.effect.magicMissile` | Magic Missile projectile burst |
| `eskie.effect.divineSmite` | Divine Smite radiant flash |
| `eskie.effect.mistyStep` | Misty Step blink teleport |
| `eskie.effect.mirrorImage` | Mirror Image ghostly duplicates |
| `eskie.effect.possession` | Possession overlay effect |
| `eskie.effect.incorporeal` | Incorporeal movement shimmer |
| `eskie.effect.callLightning` | Call Lightning storm bolt |
| `eskie.effect.chainLightning` | Chain Lightning arc |
| `eskie.effect.disintegrate` | Disintegrate death effect |
| `eskie.effect.faerieFire` | Faerie Fire outline glow |
| `eskie.effect.armorOfAgathys` | Armor of Agathys frost shield |
| `eskie.effect.animateDead` | Animate Dead rise effect |
| `eskie.effect.wingsV2` | Animated wings attachment |
| `eskie.effect.tokenMask` | Token destruction (`burn`, `shatter`, `tear`, `smoke`) |
| `eskie.effect.stepOfTheWind` | Step of the Wind (`jump`, `move` sub-keys) |
| `eskie.effect.emote` | Floating emote display above a token |
| `eskie.effect.shuffle` | Shuffle multiple tokens' positions simultaneously |

> Run `console.log(eskie.effect)` to browse all 95+ available effects.

---

### Overlays — `eskie.overlay`

Canvas-wide scene overlays that affect all players simultaneously.

| Key | Description |
|-----|-------------|
| `eskie.overlay.cinemaBars` | Black letterbox bars at the top and bottom of the scene |
| `eskie.overlay.blur` | Scene-wide blur / drunk effect targeting specific players |

```js
// Cinematic letterbox
await eskie.overlay.cinemaBars.play();
await eskie.overlay.cinemaBars.stop();

// Apply a blur to specific users (by name)
let users = game.users.map(u => u.name);
await eskie.overlay.blur.drunk.play(users);
await eskie.overlay.blur.drunk.stop(users);
```

---

### Showcases — `eskie.showcase`

Long-form cinematic sequences for dramatic, narrative moments.

| Key | Description |
|-----|-------------|
| `eskie.showcase.attackAttack` | Attack on Titan-style dramatic combat sequence |
| `eskie.showcase.mobPsycho` | Mob Psycho 100-style psychic burst sequence |
| `eskie.showcase.sunHaloDragon` | Sun halo dragon cinematic reveal |
| `eskie.showcase.vnDialog` | Visual Novel-style dialog boxes for narrative scenes |

```js
await eskie.showcase.attackAttack.play(token);
await eskie.showcase.mobPsycho.play(token, target);
await eskie.showcase.sunHaloDragon.play(token);
await eskie.showcase.vnDialog.play({ speaker: token, text: 'Hello, adventurer!' });
```

---

### Traps — `eskie.traps`

Automated tile-based traps powered by [Monk's Active Tile Triggers](https://foundryvtt.com/packages/monks-active-tiles). Once set up, traps fire automatically whenever a token enters a designated trigger tile — no macro required.

> ⚠️ **Requires:** Monk's Active Tile Triggers must be installed and active to use the setup wizard.

#### Quick Start — Unified Setup Wizard

```js
// Opens an interactive dialog to pick a trap type and walks you through setup
await eskie.traps.setup();
```

The wizard will:

1. Ask which trap type to configure
2. Ask you to select **Trigger Tile(s)** on the canvas — the tiles tokens step on to activate the trap
3. Ask you to select **Trap Tile(s)** — where the effect plays (or launches from)
4. For Fire and Projectile traps: ask for **Target Tile(s)** — where the effect lands
5. Automatically write all MATT configuration and runcode to each tile

#### Individual Trap Setup

Each trap can also be set up independently:

```js
await eskie.traps.fire.setup();
await eskie.traps.pitfall.setup();
await eskie.traps.projectile.setup();   // prompts for Arrow, Dart, or Javelin
await eskie.traps.spike.setup();
```

#### Manual Playback

Traps can be triggered manually from a macro without MATT:

```js
let trapTile = canvas.tiles.get('<tile-id>');
let token = _token;

await eskie.traps.fire.play(trapTile, [token]);
await eskie.traps.pitfall.play(trapTile, [token]);
await eskie.traps.projectile.play(trapTile, [token]);
await eskie.traps.spike.play(trapTile, [token]);
```

---

#### 🔥 Fire Trap — `eskie.traps.fire`

A directional fire cone that erupts from an origin tile toward a target tile.

**Tile setup:** 3 tiles — Trigger → Origin → Target

| Config | Default | Description |
|--------|---------|-------------|
| `size` | `3.5` | Width of the fire cone in grid units |

```js
await eskie.traps.fire.play(originTile, [token], { size: 4 });
await eskie.traps.fire.setup({ size: 4 });
```

---

#### 🕳️ Pitfall Trap — `eskie.traps.pitfall`

A hidden pit that reveals itself and causes a token to visually fall in.

**Tile setup:** 2 tiles — Trigger → Animation

| Config | Default | Description |
|--------|---------|-------------|
| `reveal` | `true` | Whether to unhide the pit tile when triggered |
| `smokeSize` | `2` | Multiplier for the dust cloud puff size |
| `fallenScale` | `0.3` | Scale of the fallen token sprite shown at the pit bottom |

```js
await eskie.traps.pitfall.play(trapTile, [token]);
await eskie.traps.pitfall.stop(trapTile);  // Fades the pit tile back to hidden
```

---

#### 🏹 Projectile Trap — `eskie.traps.projectile`

A ranged trap that fires a projectile from a launcher tile toward tokens on a target tile. Supports three projectile types.

**Tile setup:** 3 tiles — Trigger → Launcher → Target

| Config | Default | Description |
|--------|---------|-------------|
| `projectileType` | _(prompted)_ | `'arrow'`, `'dart'`, or `'javelin'` |
| `repeats` | `10` | Number of times the projectile fires |
| `repeatDelay` | `50` | Milliseconds between each repeat |
| `splashScale` | `1.5` | Scale of the hit/splash effect |

| Type | Description |
|------|-------------|
| `arrow` | Repeating arrow volley with slight spread |
| `dart` | Poison dart; applies a green tint and bubble markers to hit tokens |
| `javelin` | Single javelin throw with a blood splash on impact |

```js
// Setup — prompts for projectile type
await eskie.traps.projectile.setup();

// Setup with a pre-specified type
await eskie.traps.projectile.setup({ projectileType: 'dart' });

// Manual play
await eskie.traps.projectile.play(originTile, [token], {
    projectileType: 'arrow',
    repeats: 5,
});
```

---

#### ⚔️ Spike Trap — `eskie.traps.spike`

Spikes that shoot up from the floor under every token on the trap tile.

**Tile setup:** 2 tiles — Trigger → Animation

| Config | Default | Description |
|--------|---------|-------------|
| `delay` | `500` | Milliseconds between the spike visual and the hit effect |

```js
await eskie.traps.spike.play(trapTile, [token], { delay: 300 });
await eskie.traps.spike.setup();
```

---

#### How MATT Trap Automation Works

When `setup()` completes, EMP writes MATT configuration flags to your tiles. The trigger tile receives a `runcode` action that fires automatically on token entry:

```js
const playPath = tile.getFlag('eskie-macros', 'trap.playPath');
const originTileIds = tile.getFlag('eskie-macros', 'trap.trapOriginTileIds') || [];
if (playPath && typeof token !== 'undefined') {
    const trap = foundry.utils.getProperty(globalThis, playPath);
    if (trap && typeof trap.play === 'function') {
        originTileIds.forEach(id => {
            const originTile = canvas.tiles.get(id);
            if (originTile) trap.play(originTile, [token]);
        });
    }
}
```

The trap/origin tiles store `trap.trapTargetTileIds` (for 3-tile traps) and any extra configuration such as `projectileType`.

---

## Want to Contribute?

We'd love to have you! There are (at least) two ways to contribute to this project:

1. Post your own Sequencer animations to the Discord and request integration!
1. Create a PR following the current coding standards:
    - `create` / `play` functions exported
    - `DEFAULT_CONFIG` used as the base configuration
    - Test the animation with token rotation
    - (If integrating with AA) standardized arguments for `create` / `play` functions

Hate following coding guidelines? Me too! I'd recommend using an AI agent to help. The code here isn't life saving... you don't need to spend an entire day getting a PR in. Skills have been written to help enforce the coding guidelines, just ask the agent to clean up your code following the discord to module and style guide skills.

Want this localized into your native language? I don't entrust that to AI - I need native speaker help! Submit a PR and I'll be happy to give a mild vetting process and approve it.
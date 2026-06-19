# Eskie Macro Pack Style Guide: Code Examples

This reference document contains concrete code examples illustrating the project's coding conventions, design patterns, and safety guards.

---

## 1. Module Exports and Declarations

Do **not** declare functions inline inside an exported object. Declare the function separately first, then reference it in the exports.

### ❌ Incorrect
```javascript
export const actions = {
    doSomething: function() {
        // ...
    },
};
```

###  Correct
```javascript
function doSomething() {
    // ...
}

export const actions = {
    doSomething,
};
```

---

## 2. Optional Asset Libraries (Sound Safety)

Optional asset libraries (like `psfx` or similar config parameters) that use `closest()` MUST be protected inside an `if` statement rather than using `.playIf(...)`. If `closest()` is called on an asset that doesn't exist, it throws an error immediately, breaking the script before the `playIf` check even evaluates.

### ❌ Incorrect
```javascript
// closest() throws if asset is missing, before playIf evaluates
sequence.sound()
    .file(closest(sound.file))
    .playIf(sound.enabled);
```

###  Correct
```javascript
// closest() is never evaluated if sound is disabled
if (sound.enabled) {
    sequence.sound()
        .file(closest(sound.file));
}
```

---

## 3. copySprite World Rotation Fix

Every `.copySprite(token)` effect MUST include `.spriteRotation(-token.document.rotation)` immediately after to counteract the token's world rotation. Without this, the sprite renders in a rotated orientation that does not match the token's visual appearance.

### ❌ Incorrect
```javascript
// sprite may appear rotated if the token has a non-zero rotation
sequence.effect()
    .copySprite(token)
    .attachTo(token);
```

###  Correct
```javascript
// always negate the token's rotation on copySprite effects
sequence.effect()
    .copySprite(token)
    .attachTo(token)
    .spriteRotation(-token.document.rotation);
```

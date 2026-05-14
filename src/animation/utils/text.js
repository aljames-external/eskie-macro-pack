/**
 * text.js
 * 
 * Animation utilities for text effects, including floating world-space text 
 * and screen-space dialog typing effects with word wrapping.
 */

const DEFAULT_FLOATING_CONFIG = {
    id: 'text',
    duration: 2600,
    delay: 200,
    style: {
        fill: "#ffffff",
        fontFamily: "Helvetica",
        fontSize: 106,
        strokeThickness: 0,
        fontWeight: "bold",
    },
    kerning: 0.5,
    verticalOffset: 0.25,
};

const DEFAULT_TYPING_CONFIG = {
    duration: 10000,
    delay: 500,
    charSpacing: 50,
    lineSpacing: 120,
    margin: 100,
    anchor: { x: 0.5, y: 0.5 },
    style: {
        fill: 'white',
        fontFamily: 'Arial Black',
        fontSize: 108,
        strokeThickness: 10
    },
    screenSpace: true,
    letterShift: 0,
};

/**
 * Creates a floating text sequence above a token in world space.
 * 
 * @param {Token} token The token to attach the text to.
 * @param {string} text The text to display.
 * @param {object} [config] Configuration for styling and timing.
 * @returns {Promise<Sequence>}
 */
async function create(token, text, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_FLOATING_CONFIG, config, { inplace: false });
    let { id, duration, delay, style, kerning, verticalOffset } = mConfig;
    
    duration = Math.max(duration, delay * text.length);

    // Start of text offset (bottom left corner)
    const x = -((text.length - 1) * kerning) / 2;
    const y = -(token.document.width + verticalOffset);

    let sequence = new Sequence();
    for (let i = 0; i < text.length; i++) {
        sequence = sequence.effect()
            .name(id)
            .atLocation(token, { offset: { x: x + (i * kerning), y: y }, gridUnits: true })
            .text(text[i], style)
            .duration(duration - i * delay)
            .fadeOut(250)
            .aboveLighting()
            .zIndex(1)
            .wait(delay)
    }

    return sequence;
}

/**
 * Word wraps text into an array of lines based on character width and screen margins.
 * 
 * @param {string} text 
 * @param {number} maxCharsPerLine 
 * @returns {string[]}
 */
function _wrapText(text, maxCharsPerLine) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        if ((currentLine + word).length > maxCharsPerLine) {
            lines.push(currentLine.trim());
            currentLine = word + " ";
        } else {
            currentLine += word + " ";
        }
    }
    lines.push(currentLine.trim());
    return lines.filter(l => l.length > 0);
}

/**
 * Creates a typing text sequence with word wrapping.
 * 
 * @param {Sequence} sequence The sequence to add effects to.
 * @param {string} text The text to type.
 * @param {object} [config] Configuration for positioning, styling, and wrapping.
 */
function createTyping(sequence, text, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_TYPING_CONFIG, config, { inplace: false });
    const {
        duration,
        delay,
        charSpacing,
        lineSpacing,
        margin,
        anchor,
        style,
        screenSpace,
        letterShift
    } = mConfig;

    if (!text) return sequence;

    const screenWidth = window.innerWidth;
    const centerX = anchor.x * screenWidth;
    const maxCharsPerLine = Math.floor((screenWidth - margin * 2) / charSpacing);

    const lines = _wrapText(text, maxCharsPerLine);

    const typeDuration = duration / 10;
    const totalChars = lines.join('').length;
    const letterDelay = typeDuration / totalChars;

    const totalHeight = (lines.length - 1) * lineSpacing;
    const startY = -totalHeight / 2;

    let charGlobalIndex = 0;
    for (let l = 0; l < lines.length; l++) {
        const lineText = lines[l];
        const lineWidth = lineText.length * charSpacing;

        // Calculate horizontal clamping to keep text within screen margins
        let shiftX = 0;
        const leftMost = centerX - (lineWidth / 2) + letterShift;
        const rightMost = centerX + (lineWidth / 2) + letterShift;

        if (leftMost < margin) {
            shiftX = margin - leftMost;
        } else if (rightMost > screenWidth - margin) {
            shiftX = (screenWidth - margin) - rightMost;
        }

        const lineStartX = -(lineWidth / 2) + shiftX + letterShift;
        const lineY = startY + (l * lineSpacing);

        for (let c = 0; c < lineText.length; c++) {
            const effect = sequence.effect()
                .delay(delay + charGlobalIndex * letterDelay)
                .screenSpace(screenSpace)
                .screenSpaceScale({ x: 1.0, y: 1.0 })
                .screenSpaceAnchor(anchor)
                .screenSpacePosition({
                    x: lineStartX + (c * charSpacing),
                    y: lineY
                })
                .text(lineText[c], style)
                .zIndex(1)
                .duration(duration - (charGlobalIndex * letterDelay));

            if (!screenSpace) {
                effect.atLocation(mConfig.atLocation || canvas.stage);
            }

            charGlobalIndex++;
        }
    }

    return sequence;
}

/**
 * Plays a floating text effect above a token.
 * 
 * @param {Token} token 
 * @param {string} text 
 * @param {object} [config] 
 */
async function play(token, text, config = {}) {
    const seq = await create(token, text, config);
    if (seq) return seq.play();
}

/**
 * Stops any ongoing text effects for a token.
 * 
 * @param {Token} token 
 * @param {object} [options] 
 */
async function stop(token, { id = 'text' } = {}) {
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const text = {
    create,
    play,
    stop,
    typing: {
        create: createTyping,
    }
};

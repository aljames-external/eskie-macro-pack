export const BASE_ABILITY_MAP = {
    str: "strength", strength: "strength",
    dex: "dexterity", dexterity: "dexterity",
    con: "constitution", constitution: "constitution",
    int: "intelligence", intelligence: "intelligence",
    wis: "wisdom", wisdom: "wisdom",
    cha: "charisma", charisma: "charisma"
};

/**
 * Shared helper to extract and normalize abilities/skills into Eskie asset names.
 * Consolidates mapping structures across all adapters to prevent code duplication.
 */
export function parseAndNormalizeAbility(rawAbility, combinedText, customMap = {}) {
    let raw = rawAbility;
    if (!raw) {
        // Strip HTML tags to prevent tags like <strong> from matching "str"
        const cleanText = combinedText.replace(/<[^>]*>/g, "");
        // Shared regex matching common ability and skill names/abbreviations
        const abilityRegex = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha|perception|prc|acr|ath|ste|sle)/;
        const match = cleanText.match(abilityRegex);
        if (match) raw = match[1];
    }

    if (raw) {
        const lowerRaw = raw.toLowerCase();
        const mergedMap = { ...BASE_ABILITY_MAP, ...customMap };
        return mergedMap[lowerRaw] || lowerRaw;
    }
    return null;
}

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
 *
 * @param {string|null} rawAbility The raw ability string from flags or roll data
 * @param {string} [combinedText=""] Combined flavor and content text for regex matching
 * @param {Record<string, string>} [customMap={}] System-specific alias mappings
 * @returns {string|null} Normalized ability name or null
 */
export function parseAndNormalizeAbility(rawAbility: any, combinedText = "", customMap: any = {}) {
    let raw = rawAbility;
    if (!raw) {
        // Strip HTML tags to prevent tags like <strong> from matching "str"
        const cleanText = (combinedText ?? "").replace(/<[^>]*>/g, "").toLowerCase();
        // Shared regex matching common ability and skill names/abbreviations with word boundaries
        const abilityRegex = /\b(strength|dexterity|constitution|intelligence|wisdom|charisma|acrobatics|athletics|arcana|history|investigation|nature|religion|animal\s+handling|insight|medicine|perception|survival|deception|intimidation|performance|persuasion|stealth|sleight\s+of\s+hand|str|dex|con|int|wis|cha|prc|acr|ath|ste|sle|arc|his|inv|nat|rel|ani|ins|med|per|pers|sur|dec|itm|prf)\b/i;
        const match = cleanText.match(abilityRegex);
        if (match) raw = match[1]?.replace(/\s+/g, " ");
    }

    if (raw) {
        const lowerRaw = raw.toLowerCase();
        const mergedMap = { ...BASE_ABILITY_MAP, ...customMap };
        return mergedMap[lowerRaw] ?? lowerRaw;
    }
    return null;
}

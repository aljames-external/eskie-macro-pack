import { dependency } from './dependency.js'

function closestPath(modulePrefix, ...categories) {
    let diverged = false;
    let currentPath = modulePrefix;
    let originalPath = `${modulePrefix}.${categories.join('.')}`;
    let remainingOptions = Sequencer.Database.getPathsUnder(currentPath);
    let divergenceOptions = '';

    function isMustache(component) {
        return component.startsWith('{{') && component.endsWith('}}');
    }

    // Traverse the categories that the user has provided
    while (remainingOptions && remainingOptions.length > 0 && categories.length > 0) {
        if (isMustache(categories[0])) {
            currentPath = `${currentPath}.${categories.join('.')}`;
            break;
        }

        if (!remainingOptions.includes(categories[0])) {
            diverged = true;
            divergenceOptions = remainingOptions.join(', ');
            currentPath += `.${remainingOptions[0]}`;
            remainingOptions = Sequencer.Database.getPathsUnder(currentPath);
            categories.shift(); // Remove the used category and continue (try to match as best we can)
            continue;
        }

        currentPath += `.${categories.shift()}`;
        remainingOptions = Sequencer.Database.getPathsUnder(currentPath);
    }

    if (diverged) { 
        let msg = `EMP  | Filemanager closest path diverged from requested path.`;
        msg +=    `\n\tRequested: ${originalPath}`
        msg +=    `\n\tResolved as: ${currentPath}`;
        msg +=    `\n\tAvailable options at divergence: [${divergenceOptions}]`;
        console.warn(msg);
    }
    return currentPath;
}

export function file(path) {
    // Support http:// and https:// addresses
    // Support direct filepaths
    if (path.includes('/')) return path;

    // Support Sequencer Database paths (. seperated)
    let categories = path.split('.');
    if (categories.length === 0) return;
    let isPatreonUser = false;
    let isFreeUser = false;
    let modulePrefix = categories.shift();

    switch (modulePrefix) {
        // Sounds
        case 'psfx':
            dependency.someRequired([{ id: 'psfx-patreon' }, { id: 'psfx' }]);
            isPatreonUser = dependency.isActivated({ id: 'psfx-patreon', ref: 'PSFX-Patreon' });
            isFreeUser = dependency.isActivated({ id: 'psfx', ref: "PSFX - Peri's Sound Effects" });
            if (isPatreonUser && isFreeUser) 
                ui.notifications.warn('Both PSFX Patreon and Free are activated, both modules use the path `psfx.` to prefix files! This will cause conflicts! Recommend disabling / uninstalling the free version.');
            modulePrefix = 'psfx';
            break;
        case 'psfx-ambience':
            // Only Patreon Version
            break;

        // Animations
        case 'eskie':
        case 'eskie-free':
            dependency.someRequired([{ id: 'eskie-effects', ref: 'Eskie Effects'}, { id: 'eskie-effects-free', ref: 'Eskie Effects Free' }]);
            isPatreonUser = dependency.isActivated({ id: 'eskie-effects', ref: 'Eskie Effects' });
            modulePrefix = (isPatreonUser) ? `eskie` : `eskie-free`;
            break;
        case 'jb2a':
            dependency.someRequired([{ id: 'jb2a_patreon', ref: 'JB2A Patreon'}, { id: 'JB2A_DnD5e', ref: 'JB2A Free' }]);
            isFreeUser = dependency.isActivated({ id: 'JB2A_DnD5e' });
            isPatreonUser = dependency.isActivated({ id: 'jb2a_patreon' });
            if (isPatreonUser && isFreeUser) 
                ui.notifications.warn('Both JB2A Patreon and Free are activated, both modules use the path `jb2a.` to prefix files. This will cause conflicts! Recommend disabling / uninstalling the free version.');
            modulePrefix = `jb2a`;
            break;
        case 'animated-spell-effects':
            dependency.required({ id: modulePrefix, ref: "Jack Kerouac's Animated Spell Effects" });
            break;
        case 'animated-spell-effects-cartoon':
            dependency.required({ id: modulePrefix, ref: "Jack Kerouac's Animated Spell Effects - Cartoon" });
            break;
        case 'blfx':
            dependency.someRequired([{id: 'boss-loot-assets-premium', ref: 'Boss Loot Assets Premium'}, {id: 'boss-loot-assets-free', ref: 'Boss Loot Assets Free'}]);
            isPatreonUser = dependency.isActivated({ id: 'boss-loot-assets-premium' });
            isFreeUser = dependency.isActivated({ id: 'boss-loot-assets-free' });
            if (isPatreonUser && isFreeUser) 
                ui.notifications.warn('Both Boss Loot Assets Premium and Free are activated, both modules use the path `blfx.` to prefix files. This will cause conflicts! Recommend disabling / uninstalling the free version.');
            modulePrefix = `blfx`;
            break;
    }

    return closestPath(modulePrefix, ...categories);
}
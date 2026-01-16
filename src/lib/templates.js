async function getPosition(template, config) {
    let position;
    if (template) {
        // Not sure if this works for everything... but let's try...
        const farpoint = template._object.ray.B;        // Get the furthest point on the cone
        const secondary = { x: farpoint.x, y: farpoint.y };    // Decouple from the template so when it is deleted we don't crash
        const source = { x: template.x, y: template.y };
        position = (template.t == 'circle') ? source : secondary;
    } else {
        const crosshair = getCrosshairCfg(config);
        position = await Sequencer.Crosshair.show(crosshair);
        if (position.cancelled) { return; }
    }
    return position;
}

export const templates = {
    getPosition,
}
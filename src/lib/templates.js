async function getPosition(template, config) {
    let position;
    if (template) {
        // Not sure if this works for everything... but let's try...
        const farpoint = template._object.ray.B;        // Get the furthest point on the cone
        const secondary = { x: farpoint.x, y: farpoint.y };    // Decouple from the template so when it is deleted we don't crash
        const primary = { x: template.x, y: template.y };
        return [primary, secondary];
    } else {
        position = await Sequencer.Crosshair.show();
        if (position.cancelled) { return []; }
        return [position, undefined];
    }
}

export const templates = {
    getPosition,
}
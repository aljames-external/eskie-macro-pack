import { log } from './logger.js';
async function getPosition(template, config = {}) {
    let position;
    if (template) {
        let primary, secondary;

        // Foundry V14 Region structures
        if (template.documentName === 'Region' || template.shapes) {
            const shape = template.shapes[0];
            primary = { x: shape.x, y: shape.y };

            // Calculate the furthest point based on shape rotation and radius
            let distance = shape.radius || shape.distance || 0;
            // Depending on the shape type, we find the farpoint along its rotation
            if (shape.rotation !== undefined && distance) {
                const rad = Math.toRadians(shape.rotation);
                secondary = {
                    x: primary.x + Math.cos(rad) * distance,
                    y: primary.y + Math.sin(rad) * distance
                };
            } else {
                // Fallback to origin if no direction is present (e.g. circles)
                secondary = { x: primary.x, y: primary.y };
            }
        } else {
            log.info(`getPosition: Falling back to legacy MeasuredTemplate support (pre-V14). This support will be removed in Foundry V16.`);
            // Legacy MeasuredTemplate support
            const farpoint = template.object.ray.B;
            secondary = { x: farpoint.x, y: farpoint.y };
            primary = { x: template.x, y: template.y };
        }

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
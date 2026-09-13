import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { FoundryV12Adapter } from '../../src/adapters/foundry/foundry-v12-adapter.js';
import { FoundryV13Adapter } from '../../src/adapters/foundry/foundry-v13-adapter.js';
import { FoundryV14Adapter } from '../../src/adapters/foundry/foundry-v14-adapter.js';

test('FoundryV14Adapter: supportsRegionBehaviors and NOP isolation in V12', () => {
    const v12 = new FoundryV12Adapter();
    const v14 = new FoundryV14Adapter();

    assert.equal(v12.supportsRegionBehaviors, false, 'V12 adapter must report supportsRegionBehaviors as false');
    assert.equal(v14.supportsRegionBehaviors, true, 'V14 adapter must report supportsRegionBehaviors as true');

    assert.deepEqual(v12.getControlledRegions(), [], 'V12 getControlledRegions must NOP returning empty array');
    assert.deepEqual(v12.getTokensInRegion({}), [], 'V12 getTokensInRegion must NOP returning empty array');
    assert.deepEqual(v12.formatRegionBehaviorData({}), {}, 'V12 formatRegionBehaviorData must NOP returning empty object');
});

test('FoundryV14Adapter: getControlledRegions returns controlled region documents', () => {
    const v14 = new FoundryV14Adapter();
    const mockRegionDoc = { id: 'reg-doc-1', documentName: 'Region' };
    const mockRegionPlaceable = { id: 'reg-doc-1', document: mockRegionDoc };

    globalThis.canvas.regions = {
        controlled: [mockRegionPlaceable]
    };

    const controlled = v14.getControlledRegions();
    assert.equal(controlled.length, 1);
    assert.equal(controlled[0], mockRegionDoc);
});

test('FoundryV14Adapter: getRegionBounds handles non-square shapes (polygons, circles, ellipses, compound)', () => {
    const v14 = new FoundryV14Adapter();

    // 1. Authoritative canvas bounds (PIXI.Rectangle)
    const placeableWithBounds = {
        documentName: 'Region',
        bounds: { x: 100, y: 150, width: 400, height: 300 },
        center: { x: 300, y: 300 }
    };
    const b1 = v14.getRegionBounds(placeableWithBounds);
    assert.equal(b1.minX, 100);
    assert.equal(b1.maxX, 500);
    assert.equal(b1.minY, 150);
    assert.equal(b1.maxY, 450);
    assert.equal(b1.width, 400);
    assert.equal(b1.height, 300);
    assert.deepEqual(b1.center, { x: 300, y: 300 });

    // 2. Non-square arbitrary Polygon shape
    const polygonRegion = {
        documentName: 'Region',
        shapes: [
            {
                type: 'polygon',
                points: [100, 200, 500, 200, 300, 600]
            }
        ]
    };
    const bPoly = v14.getRegionBounds(polygonRegion);
    assert.equal(bPoly.minX, 100);
    assert.equal(bPoly.maxX, 500);
    assert.equal(bPoly.minY, 200);
    assert.equal(bPoly.maxY, 600);
    assert.equal(bPoly.width, 400);
    assert.equal(bPoly.height, 400);
    assert.deepEqual(bPoly.center, { x: 300, y: 400 });

    // 3. Circle shape (center at 400, 500 with radius 150)
    const circleRegion = {
        documentName: 'Region',
        shapes: [
            {
                type: 'circle',
                x: 400,
                y: 500,
                radius: 150
            }
        ]
    };
    const bCircle = v14.getRegionBounds(circleRegion);
    assert.equal(bCircle.minX, 250);
    assert.equal(bCircle.maxX, 550);
    assert.equal(bCircle.minY, 350);
    assert.equal(bCircle.maxY, 650);
    assert.equal(bCircle.width, 300);
    assert.equal(bCircle.height, 300);
    assert.deepEqual(bCircle.center, { x: 400, y: 500 });

    // 4. Ellipse shape
    const ellipseRegion = {
        documentName: 'Region',
        shapes: [
            {
                type: 'ellipse',
                x: 200,
                y: 300,
                radiusX: 100,
                radiusY: 50
            }
        ]
    };
    const bEllipse = v14.getRegionBounds(ellipseRegion);
    assert.equal(bEllipse.minX, 100);
    assert.equal(bEllipse.maxX, 300);
    assert.equal(bEllipse.minY, 250);
    assert.equal(bEllipse.maxY, 350);
    assert.equal(bEllipse.width, 200);
    assert.equal(bEllipse.height, 100);
    assert.deepEqual(bEllipse.center, { x: 200, y: 300 });

    // 5. Compound shapes: unions bounds across multiple shapes, ignores holes
    const compoundRegion = {
        documentName: 'Region',
        shapes: [
            { type: 'polygon', points: [100, 100, 200, 100, 200, 200, 100, 200] },
            { type: 'circle', x: 500, y: 500, radius: 50 },
            { type: 'polygon', points: [0, 0, 1000, 1000], hole: true } // should be ignored
        ]
    };
    const bCompound = v14.getRegionBounds(compoundRegion);
    assert.equal(bCompound.minX, 100);
    assert.equal(bCompound.maxX, 550); // 500 + 50
    assert.equal(bCompound.minY, 100);
    assert.equal(bCompound.maxY, 550); // 500 + 50
    assert.equal(bCompound.width, 450);
    assert.equal(bCompound.height, 450);
    assert.deepEqual(bCompound.center, { x: 325, y: 325 });
});

test('FoundryV14Adapter: getTokensInRegion extracts placeables directly from RegionDocument#tokens', () => {
    const v14 = new FoundryV14Adapter();

    const mockToken1 = { id: 't-1', name: 'Token 1' };
    const mockToken2 = { id: 't-2', name: 'Token 2' };
    const tokenDoc1 = { id: 't-1', object: mockToken1 };
    const tokenDoc2 = { id: 't-2', object: mockToken2 };

    const regionWithTokens = {
        documentName: 'Region',
        document: {
            tokens: new Set([tokenDoc1, tokenDoc2])
        }
    };

    const tokens = v14.getTokensInRegion(regionWithTokens);
    assert.equal(tokens.length, 2);
    assert.equal(tokens[0], mockToken1);
    assert.equal(tokens[1], mockToken2);

    // Empty region returns empty array
    const emptyRegion = {
        documentName: 'Region',
        document: { tokens: new Set() }
    };
    assert.deepEqual(v14.getTokensInRegion(emptyRegion), []);
});

test('FoundryV14Adapter: containsPoint leverages Region#testPoint for exact non-square geometry (legacy fallback)', () => {
    const v14 = new FoundryV14Adapter();

    let testedPoint = null;
    const mockRegionPlaceable = {
        testPoint: (pt) => {
            testedPoint = pt;
            return pt.x === 150 && pt.y === 150;
        }
    };
    const regionDoc = {
        documentName: 'Region',
        object: mockRegionPlaceable
    };

    assert.equal(v14.containsPoint(regionDoc, { x: 150, y: 150 }), true);
    assert.deepEqual(testedPoint, { x: 150, y: 150 });
    assert.equal(v14.containsPoint(regionDoc, { x: 300, y: 300 }), false);
});

test('FoundryV13Adapter & FoundryV14Adapter: containsPoint leverages modern RegionDocument#testPoint(point: ElevatedPoint)', () => {
    const v13 = new FoundryV13Adapter();
    const v14 = new FoundryV14Adapter();

    for (const adapterInstance of [v13, v14]) {
        let testedPoint = null;
        let placeableCalled = false;
        const regionDoc = {
            documentName: 'Region',
            testPoint: (pt) => {
                testedPoint = pt;
                return pt.x === 200 && pt.y === 200;
            },
            object: {
                testPoint: () => {
                    placeableCalled = true;
                    return false;
                }
            }
        };

        assert.equal(adapterInstance.containsPoint(regionDoc, { x: 200, y: 200 }), true);
        assert.deepEqual(testedPoint, { x: 200, y: 200, elevation: 0 }, 'RegionDocument#testPoint must receive ElevatedPoint');
        assert.equal(placeableCalled, false, 'Must not call deprecated Region#testPoint on placeable when RegionDocument#testPoint exists');

        // Test with explicit elevation
        assert.equal(adapterInstance.containsPoint(regionDoc, { x: 200, y: 200, elevation: 15 }), true);
        assert.deepEqual(testedPoint, { x: 200, y: 200, elevation: 15 });

        // Test non-matching point
        assert.equal(adapterInstance.containsPoint(regionDoc, { x: 500, y: 500 }), false);
    }
});

test('FoundryV14Adapter: createRegionBehavior and formatRegionBehaviorData contracts', async () => {
    const v14 = new FoundryV14Adapter();

    const formatted = v14.formatRegionBehaviorData({
        name: 'Spike Trap Behavior',
        events: ['tokenEnter', 'tokenMove'],
        source: 'console.log("triggered");',
        flags: { 'eskie-macro-pack': { isTrap: true } }
    });

    assert.equal(formatted.name, 'Spike Trap Behavior');
    assert.equal(formatted.type, 'executeScript');
    assert.deepEqual(formatted.system.events, ['tokenEnter', 'tokenMove']);
    assert.equal(formatted.system.source, 'console.log("triggered");');
    assert.equal(formatted.disabled, false);
    assert.deepEqual(formatted.flags['eskie-macro-pack'], { isTrap: true });

    let createdType = null;
    let createdPayload = null;
    const mockRegionDoc = {
        createEmbeddedDocuments: async (type, data) => {
            createdType = type;
            createdPayload = data;
            return [{ id: 'behavior-1', ...data[0] }];
        }
    };

    const result = await v14.createRegionBehavior(mockRegionDoc, formatted);
    assert.equal(createdType, 'RegionBehavior');
    assert.deepEqual(createdPayload, [formatted]);
    assert.equal(result.id, 'behavior-1');
});

test('FoundryV14Adapter: getPlaceableTexture resolves linked tile flags on Region', () => {
    const v14 = new FoundryV14Adapter();

    const mockTile = {
        id: 'tile-visual-1',
        document: {
            texture: { src: 'tiles/spikes.png' }
        }
    };
    globalThis.canvas.tiles = {
        get: (id) => (id === 'tile-visual-1' ? mockTile : null)
    };

    // Region with linked tile ID in flags
    const regionWithTile = {
        documentName: 'Region',
        document: {
            flags: {
                'eskie-macros': {
                    trap: { tileIds: ['tile-visual-1'] }
                }
            }
        }
    };

    const texture = v14.getPlaceableTexture(regionWithTile);
    assert.equal(texture, 'tiles/spikes.png');

    // Pure region with no linked tile returns null gracefully
    const pureRegion = {
        documentName: 'Region',
        document: { flags: {} }
    };
    assert.equal(v14.getPlaceableTexture(pureRegion), null);
});

test('FoundryV14Adapter & BaseFoundryAdapter: getTargetLocation resolves center coordinates across regions and tiles', () => {
    const v14 = new FoundryV14Adapter();

    // 1. Tile placeable -> resolves center
    const mockTile = {
        id: 'tile-target-loc-1',
        documentName: 'Tile',
        document: {
            x: 200,
            y: 300,
            width: 2,
            height: 2
        }
    };
    // getGridSize is 100 in test setup
    const tileLoc = v14.getTargetLocation(mockTile);
    assert.deepEqual(tileLoc, { x: 300, y: 400 }, 'Tile target location must be the center point');

    // 2. Region with explicit origin point
    const regionWithOrigin = {
        documentName: 'Region',
        document: {
            origin: { x: 150, y: 250 },
            shapes: []
        }
    };
    const regLoc1 = v14.getTargetLocation(regionWithOrigin);
    assert.deepEqual(regLoc1, { x: 150, y: 250 }, 'Region with origin property must resolve its origin point');

    // 3. Region with polygon shape -> resolves center from shape bounds
    const polygonRegion = {
        documentName: 'Region',
        document: {
            shapes: [
                {
                    type: 'polygon',
                    points: [400, 500, 600, 500, 600, 700, 400, 700]
                }
            ]
        }
    };
    const regLoc2 = v14.getTargetLocation(polygonRegion);
    assert.deepEqual(regLoc2, { x: 500, y: 600 }, 'Region with polygon must resolve its bounding box center as location');

    // 4. Region with circle shape -> resolves center from shape
    const circleRegion = {
        documentName: 'Region',
        document: {
            shapes: [
                {
                    type: 'circle',
                    x: 600,
                    y: 750,
                    radius: 100
                }
            ]
        }
    };
    const regLoc3 = v14.getTargetLocation(circleRegion);
    assert.deepEqual(regLoc3, { x: 600, y: 750 }, 'Region with circle must resolve shape center as location');

    // 5. Region PlaceableObject on canvas (having x: 0, y: 0 container, but center: { x: 450, y: 550 })
    const canvasRegionPlaceable = {
        id: 'reg-canvas-1',
        documentName: 'Region',
        x: 0,
        y: 0,
        center: { x: 450, y: 550 },
        bounds: { x: 400, y: 500, width: 100, height: 100 },
        document: {
            id: 'reg-canvas-1',
            documentName: 'Region'
        }
    };
    const regLoc4 = v14.getTargetLocation(canvasRegionPlaceable);
    assert.deepEqual(regLoc4, { x: 450, y: 550 }, 'Region PlaceableObject with x: 0, y: 0 container must resolve center coordinates, not container origin');

    // 6. Raw coordinate point { x, y } -> preserves coordinates
    const rawPoint = { x: 1234, y: 5678 };
    const pointLoc = v14.getTargetLocation(rawPoint);
    assert.deepEqual(pointLoc, { x: 1234, y: 5678 }, 'Raw coordinate point must return exact coordinates');

    // 7. Null input -> returns null
    assert.equal(v14.getTargetLocation(null), null);
});


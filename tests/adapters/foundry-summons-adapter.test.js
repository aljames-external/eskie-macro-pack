import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { FoundrySummonsModuleAdapter } from '../../src/adapters/modules/foundry-summons/foundry-summons-module-adapter.js';
import { adapter } from '../../src/adapters/index.js';

test('FoundrySummonsModuleAdapter provides standard isActive, isAvailable, and api interface', () => {
    const fsAdapter = new FoundrySummonsModuleAdapter();
    assert.equal(fsAdapter.moduleId, 'foundry-summons');

    game.modules.set('foundry-summons', { id: 'foundry-summons', active: false });
    assert.equal(fsAdapter.isActive(), false);
    assert.equal(fsAdapter.isAvailable(), false);
    assert.equal(fsAdapter.api, null);

    const mockApi = {
        pick: async () => null,
        SummonMenu: { start: () => {} }
    };
    game.modules.set('foundry-summons', { id: 'foundry-summons', active: true, api: mockApi });
    assert.equal(fsAdapter.isActive(), true);
    assert.equal(fsAdapter.isAvailable(), true);
    assert.equal(fsAdapter.api, mockApi);
});

test('FoundrySummonsModuleAdapter.resolveActorUuid resolves uuid from actor, string, or actor name', () => {
    const fsAdapter = new FoundrySummonsModuleAdapter();

    assert.equal(fsAdapter.resolveActorUuid(null), null);
    assert.equal(fsAdapter.resolveActorUuid(undefined), null);

    // Actor object with uuid
    const mockActor = { uuid: 'Actor.abc12345', name: 'Departed Spirit' };
    assert.equal(fsAdapter.resolveActorUuid(mockActor), 'Actor.abc12345');

    // UUID string with dot notation
    assert.equal(fsAdapter.resolveActorUuid('Compendium.dnd5e.monsters.Actor.999'), 'Compendium.dnd5e.monsters.Actor.999');

    // Actor lookup by name via game.actors.getName
    game.actors = {
        getName: (name) => (name === 'Ghost' ? { uuid: 'Actor.ghostUuid', name: 'Ghost' } : null)
    };
    assert.equal(fsAdapter.resolveActorUuid('Ghost'), 'Actor.ghostUuid');
    assert.equal(fsAdapter.resolveActorUuid('Unknown'), 'Unknown');
});

test('FoundrySummonsModuleAdapter.pick handles module inactive and warnings gracefully', async () => {
    const fsAdapter = new FoundrySummonsModuleAdapter();
    game.modules.set('foundry-summons', { id: 'foundry-summons', active: false });

    let warned = false;
    ui.notifications.warn = () => { warned = true; };

    const result = await fsAdapter.pick({ uuid: 'Actor.123' });
    assert.equal(result, null);
    assert.equal(warned, true);
});

test('FoundrySummonsModuleAdapter.pick delegates to api.pick and unwraps result token placeable', async () => {
    const mockTokenPlaceable = { id: 'token-summon-1', name: 'Summoned Token' };
    let passedOptions = null;

    const mockApi = {
        pick: async (options) => {
            passedOptions = options;
            return [{ object: mockTokenPlaceable }];
        }
    };

    game.modules.set('foundry-summons', { id: 'foundry-summons', active: true, api: mockApi });
    const fsAdapter = new FoundrySummonsModuleAdapter();

    const result = await fsAdapter.pick({
        actor: { uuid: 'Actor.summonUuid' },
        crosshairParameters: { t: 'circle', distance: 2.5 }
    });

    assert.equal(result, mockTokenPlaceable);
    assert.equal(passedOptions.uuid, 'Actor.summonUuid');
    assert.equal(passedOptions.actor, undefined);
    assert.deepEqual(passedOptions.crosshairParameters, { t: 'circle', distance: 2.5 });
});

test('FoundrySummonsModuleAdapter.spawn delegates to pick when location is omitted', async () => {
    const mockTokenPlaceable = { id: 'token-summon-2', name: 'Spawned Token' };
    const mockApi = {
        pick: async () => mockTokenPlaceable
    };
    game.modules.set('foundry-summons', { id: 'foundry-summons', active: true, api: mockApi });
    const fsAdapter = new FoundrySummonsModuleAdapter();

    const result = await fsAdapter.spawn({ uuid: 'Actor.123' });
    assert.equal(result, mockTokenPlaceable);
});

test('FoundrySummonsModuleAdapter.spawn delegates to spawnAtLocation when location is provided', async () => {
    let createdData = null;
    const mockTokenDoc = {
        id: 'tok-1',
        toObject: () => ({ id: 'tok-1', name: 'Direct Token' }),
        object: { id: 'tok-1', name: 'Direct Token' }
    };
    const mockActor = {
        id: 'act-1',
        uuid: 'Actor.act1',
        getTokenDocument: async (data) => {
            createdData = data;
            return mockTokenDoc;
        }
    };

    const origScene = canvas.scene;
    canvas.scene = {
        createEmbeddedDocuments: async (_type, docs) => [{ ...docs[0], object: mockTokenDoc.object }]
    };

    try {
        const fsAdapter = new FoundrySummonsModuleAdapter();
        const result = await fsAdapter.spawn({
            actor: mockActor,
            location: { x: 300, y: 400 },
            tokenData: { alpha: 0 }
        });

        assert.equal(result, mockTokenDoc.object);
        assert.equal(createdData.x, 300);
        assert.equal(createdData.y, 400);
        assert.equal(createdData.alpha, 0);
    } finally {
        canvas.scene = origScene;
    }
});

test('FoundrySummonsModuleAdapter.openMenu invokes SummonMenu.start when available', () => {
    let started = false;
    const mockApi = {
        SummonMenu: {
            start: () => { started = true; }
        }
    };
    game.modules.set('foundry-summons', { id: 'foundry-summons', active: true, api: mockApi });
    const fsAdapter = new FoundrySummonsModuleAdapter();

    fsAdapter.openMenu();
    assert.equal(started, true);
});

test('adapter singleton exposes summons and foundrySummons getters', () => {
    assert.ok(adapter.summons);
    assert.ok(adapter.foundrySummons);
    assert.equal(adapter.summons, adapter.foundrySummons);
});

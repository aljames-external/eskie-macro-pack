import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { dependency } from '../../src/lib/dependency.js';

test('dependency verification utility correctly inspects active modules and objects', () => {
    game.modules.set('eskie-macro-pack', { id: 'eskie-macro-pack', active: true, version: '1.0.0' });
    game.modules.set('sequencer', { id: 'sequencer', active: true, version: '3.4.0' });
    game.modules.set('socketlib', { id: 'socketlib', active: true, version: '1.0.0' });

    assert.equal(dependency.isInstalled({ id: 'eskie-macro-pack' }), true);
    assert.equal(dependency.isInstalled({ id: 'sequencer' }), true);
    assert.equal(dependency.isInstalled({ id: 'socketlib' }), true);
    assert.equal(dependency.isInstalled({ id: 'nonexistent-module' }), false);

    assert.equal(dependency.isActivated({ id: 'eskie-macro-pack' }), true);
    assert.equal(dependency.isActivated({ id: 'nonexistent-module' }), false);

    assert.doesNotThrow(() => {
        dependency.someRequired([{ id: 'nonexistent-module' }, { id: 'eskie-macro-pack' }]);
    });
    assert.throws(() => {
        dependency.someRequired([{ id: 'nonexistent-module' }]);
    });
});

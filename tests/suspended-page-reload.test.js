import assert from 'node:assert/strict';
import test from 'node:test';

import { reloadSuspendedPage } from '../src/js/fork/suspendedPageReload.js';

test('reload waits until suspended-state protection is persisted', async () => {
  let finishPersistence;
  let reloadCount = 0;
  const persistence = new Promise((resolve) => {
    finishPersistence = resolve;
  });

  const reload = reloadSuspendedPage({
    resolveTab: async () => ({ id: 42 }),
    preserveSuspendedState: (tabId) => {
      assert.equal(tabId, 42);
      return persistence;
    },
    reload: () => {
      reloadCount += 1;
    },
  });

  await Promise.resolve();
  assert.equal(reloadCount, 0);
  finishPersistence();
  await reload;
  assert.equal(reloadCount, 1);
});

test('reload fails closed when suspended-state protection rejects', async () => {
  const persistenceFailure = new Error('session storage rejected');
  let reloadCount = 0;

  await assert.rejects(
    reloadSuspendedPage({
      resolveTab: async () => ({ id: 42 }),
      preserveSuspendedState: async () => {
        throw persistenceFailure;
      },
      reload: () => {
        reloadCount += 1;
      },
    }),
    persistenceFailure,
  );
  assert.equal(reloadCount, 0);
});

test('reload fails closed when the suspended tab cannot be identified', async () => {
  let preserveCount = 0;
  let reloadCount = 0;

  await assert.rejects(
    reloadSuspendedPage({
      resolveTab: async () => undefined,
      preserveSuspendedState: async () => {
        preserveCount += 1;
      },
      reload: () => {
        reloadCount += 1;
      },
    }),
    /identify the suspended tab/,
  );
  assert.equal(preserveCount, 0);
  assert.equal(reloadCount, 0);
});

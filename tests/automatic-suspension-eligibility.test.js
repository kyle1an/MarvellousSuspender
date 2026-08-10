import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldSkipAutomaticSuspension } from '../src/js/fork/automaticSuspensionEligibility.js';

test('invalid tabs are not classified as standalone app windows', async () => {
  let lookupCount = 0;
  const getWindowById = async () => {
    lookupCount += 1;
    return { type: 'app' };
  };

  for (const tab of [undefined, null, {}, { windowId: '42' }]) {
    assert.equal(
      await shouldSkipAutomaticSuspension(tab, 3, getWindowById),
      false,
    );
  }
  assert.equal(lookupCount, 0);
});

test('window lookup classifies app and popup windows as standalone', async () => {
  const windowTypes = new Map([
    [1, 'app'],
    [2, 'popup'],
    [3, 'normal'],
  ]);
  const lookedUpWindowIds = [];
  const getWindowById = async (windowId) => {
    lookedUpWindowIds.push(windowId);
    const type = windowTypes.get(windowId);
    return type ? { type } : null;
  };

  assert.equal(
    await shouldSkipAutomaticSuspension({ windowId: 1 }, 3, getWindowById),
    true,
  );
  assert.equal(
    await shouldSkipAutomaticSuspension({ windowId: 2 }, 3, getWindowById),
    true,
  );
  assert.equal(
    await shouldSkipAutomaticSuspension({ windowId: 3 }, 3, getWindowById),
    false,
  );
  assert.equal(
    await shouldSkipAutomaticSuspension({ windowId: 4 }, 3, getWindowById),
    false,
  );
  assert.deepEqual(lookedUpWindowIds, [1, 2, 3, 4]);
});

test('only automatic suspension skips standalone app windows', async () => {
  let lookupCount = 0;
  const getAppWindowById = async () => {
    lookupCount += 1;
    return { type: 'app' };
  };

  for (const forceLevel of [undefined, 1, 2]) {
    assert.equal(
      await shouldSkipAutomaticSuspension(
        { windowId: 1 },
        forceLevel,
        getAppWindowById,
      ),
      false,
    );
  }
  assert.equal(lookupCount, 0);

  assert.equal(
    await shouldSkipAutomaticSuspension({ windowId: 1 }, 3, getAppWindowById),
    true,
  );
  assert.equal(lookupCount, 1);

  assert.equal(
    await shouldSkipAutomaticSuspension(
      { windowId: 2 },
      3,
      async () => ({ type: 'normal' }),
    ),
    false,
  );
});

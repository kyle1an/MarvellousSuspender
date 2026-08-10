import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatShortcutForPlatform,
  observeShortcutPresentation,
  presentShortcut,
} from '../src/js/fork/shortcutPresentation.js';

test('macOS shortcuts use compact modifier glyphs in platform order', () => {
  const cases = [
    ['(⌘ · Shift · S)', '⇧⌘S'],
    ['Command+Shift+S', '⇧⌘S'],
    ['Ctrl · Shift · S', '⌃⇧S'],
    ['MacCtrl+Shift+S', '⌃⇧S'],
    ['MacCtrl+Option+Shift+Command+S', '⌃⌥⇧⌘S'],
  ];

  for (const [shortcut, expected] of cases) {
    assert.equal(formatShortcutForPlatform(shortcut, 'mac'), expected);
  }
});

test('Windows and Linux shortcuts use plus-delimited modifier names', () => {
  for (const os of ['win', 'linux']) {
    assert.equal(
      formatShortcutForPlatform('(Ctrl · Shift · S)', os),
      'Ctrl+Shift+S',
    );
    assert.equal(
      formatShortcutForPlatform('Alt+Shift+PageUp', os),
      'Alt+Shift+PageUp',
    );
  }
});

test('ChromeOS keeps Search in the modifier group', () => {
  assert.equal(
    formatShortcutForPlatform('(Search · Shift · S)', 'cros'),
    'Search+Shift+S',
  );
});

test('shortcut presentation removes upstream parentheses without touching the empty state', () => {
  const command = { textContent: '(⌘ · Shift · S)' };
  const populatedWrapper = {
    querySelector(selector) {
      assert.equal(selector, '.hotkeyCommand');
      return command;
    },
  };

  assert.equal(presentShortcut(populatedWrapper, 'mac'), true);
  assert.equal(command.textContent, '⇧⌘S');

  const emptyWrapper = {
    querySelector() {
      return null;
    },
  };
  assert.equal(presentShortcut(emptyWrapper, 'mac'), false);
});

test('shortcut observation handles configured, unset, and reconfigured states', () => {
  let command = { textContent: '(⌘ · Shift · S)' };
  const wrapper = {
    querySelector() {
      return command;
    },
  };

  let notify;
  let observedTarget;
  let observedOptions;
  class TestMutationObserver {
    constructor(callback) {
      notify = callback;
    }

    observe(target, options) {
      observedTarget = target;
      observedOptions = options;
    }
  }

  observeShortcutPresentation(wrapper, 'mac', TestMutationObserver);
  assert.equal(command.textContent, '⇧⌘S');
  assert.equal(observedTarget, wrapper);
  assert.deepEqual(observedOptions, { childList: true });

  command = null;
  assert.equal(notify(), false);

  command = { textContent: '(Ctrl · Shift · S)' };
  assert.equal(notify(), true);
  assert.equal(command.textContent, '⌃⇧S');
});

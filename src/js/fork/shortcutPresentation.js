const MAC_MODIFIER_ORDER = ['Control', 'Option', 'Shift', 'Command'];
const NON_MAC_MODIFIER_ORDER = ['Search', 'Control', 'Option', 'Shift', 'Command'];

const MAC_MODIFIER_GLYPHS = {
  Control: '⌃',
  Option: '⌥',
  Shift: '⇧',
  Command: '⌘',
};

const NON_MAC_MODIFIER_LABELS = {
  Control: 'Ctrl',
  Option: 'Alt',
  Shift: 'Shift',
  Command: 'Meta',
  Search: 'Search',
};

function unwrapShortcut(shortcut) {
  return String(shortcut ?? '')
    .trim()
    .replace(/^\(\s*(.*?)\s*\)$/u, '$1')
    .trim();
}

function tokeniseShortcut(shortcut) {
  if (!shortcut) {
    return [];
  }

  if (/[+·]/u.test(shortcut)) {
    return shortcut.split(/\s*(?:\+|·)\s*/u).filter(Boolean);
  }

  const compactMacShortcut = shortcut.match(/^([⌃⌥⇧⌘]+)(.+)$/u);
  if (compactMacShortcut) {
    return [...compactMacShortcut[1], compactMacShortcut[2]];
  }

  return shortcut.split(/\s+/u).filter(Boolean);
}

function normaliseModifier(token) {
  const normalisedToken = token.toLowerCase();

  if (token === '⇧' || normalisedToken === 'shift') {
    return 'Shift';
  }
  if (token === '⌥' || normalisedToken === 'alt' || normalisedToken === 'option') {
    return 'Option';
  }
  if (token === '⌃' || normalisedToken === 'macctrl' || normalisedToken === 'control') {
    return 'Control';
  }
  if (token === '⌘' || normalisedToken === 'command' || normalisedToken === 'meta') {
    return 'Command';
  }
  if (normalisedToken === 'ctrl') {
    return 'Control';
  }
  if (normalisedToken === 'search') {
    return 'Search';
  }
  return null;
}

export function formatShortcutForPlatform(shortcut, os) {
  const modifiers = new Set();
  const keys = [];

  for (const token of tokeniseShortcut(unwrapShortcut(shortcut))) {
    const modifier = normaliseModifier(token);
    if (modifier) {
      modifiers.add(modifier);
    }
    else {
      keys.push(token);
    }
  }

  if (keys.length === 0) {
    return '';
  }

  if (os === 'mac') {
    return MAC_MODIFIER_ORDER
      .filter((modifier) => modifiers.has(modifier))
      .map((modifier) => MAC_MODIFIER_GLYPHS[modifier])
      .join('') + keys.join('');
  }

  return [
    ...NON_MAC_MODIFIER_ORDER
      .filter((modifier) => modifiers.has(modifier))
      .map((modifier) => NON_MAC_MODIFIER_LABELS[modifier]),
    ...keys,
  ].join('+');
}

export function presentShortcut(wrapper, os) {
  const command = wrapper.querySelector('.hotkeyCommand');
  if (!command) {
    return false;
  }

  const shortcut = formatShortcutForPlatform(command.textContent, os);
  if (!shortcut) {
    return false;
  }

  if (command.textContent !== shortcut) {
    command.textContent = shortcut;
  }
  return true;
}

export function observeShortcutPresentation(
  wrapper,
  os,
  Observer = MutationObserver,
) {
  const updateShortcut = () => presentShortcut(wrapper, os);
  updateShortcut();

  const observer = new Observer(updateShortcut);
  observer.observe(wrapper, { childList: true });
  return observer;
}
